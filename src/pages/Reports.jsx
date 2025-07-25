// src/pages/Reports.jsx - REAL-TIME VERSION
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { showToast } from '../utils/toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Users,
  CheckCircle,
  Clock,
  PieChart as PieIcon,
  Activity,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from 'lucide-react';

const Reports = () => {
  const { userRole, currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [allGuests, setAllGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [activeChart, setActiveChart] = useState('checkins');

  // Real-time data loading
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribers = [];

    try {
      // Listen to events in real-time
      const eventsQuery = userRole === 'owner' 
        ? query(collection(db, 'events'), orderBy('createdAt', 'desc'))
        : query(
            collection(db, 'events'), 
            where('createdBy', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );

      const unsubscribeEvents = onSnapshot(eventsQuery, 
        (snapshot) => {
          const eventsData = [];
          snapshot.forEach((doc) => {
            const eventData = { id: doc.id, ...doc.data() };
            eventsData.push(eventData);
          });
          setEvents(eventsData);
          
          // Load guests for each event
          loadGuestsForEvents(eventsData);
        },
        (error) => {
          console.error('Error fetching events:', error);
          setError('Failed to load events data');
        }
      );

      unsubscribers.push(unsubscribeEvents);
      
    } catch (err) {
      console.error('Error setting up real-time listeners:', err);
      setError('Failed to initialize real-time data');
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser, userRole]);

  // Load guests for all events
  const loadGuestsForEvents = async (eventsData) => {
    try {
      const allGuestsData = [];
      
      for (const event of eventsData) {
        try {
          const guestsQuery = query(
            collection(db, 'events', event.id, 'guests'),
            orderBy('createdAt', 'desc')
          );
          
          const guestsSnapshot = await getDocs(guestsQuery);
          
          guestsSnapshot.forEach((doc) => {
            const guestData = { 
              id: doc.id, 
              eventId: event.id, 
              eventName: event.name,
              ...doc.data() 
            };
            allGuestsData.push(guestData);
          });
        } catch (error) {
          console.warn(`Failed to load guests for event ${event.id}:`, error);
        }
      }
      
      setAllGuests(allGuestsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading guests:', err);
      setError('Failed to load guests data');
      setLoading(false);
    }
  };

  // Process data for charts
  const getProcessedData = () => {
    if (!events.length) return { stats: [], chartData: [], pieData: [] };

    // Filter by selected event
    const filteredEvents = selectedEvent === 'all' 
      ? events 
      : events.filter(e => e.id === selectedEvent);

    const filteredGuests = selectedEvent === 'all'
      ? allGuests
      : allGuests.filter(g => g.eventId === selectedEvent);

    // Calculate basic stats
    const totalEvents = filteredEvents.length;
    const totalGuests = filteredGuests.length;
    const checkedInGuests = filteredGuests.filter(g => g.checkedIn).length;
    const upcomingEvents = filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate > new Date();
    }).length;

    const stats = [
      {
        label: 'Total Events',
        value: totalEvents,
        change: '+12%',
        trend: 'up',
        icon: <Calendar className="w-5 h-5 text-blue-400" />
      },
      {
        label: 'Total Guests',
        value: totalGuests,
        change: '+8%',
        trend: 'up',
        icon: <Users className="w-5 h-5 text-green-400" />
      },
      {
        label: 'Check-ins',
        value: checkedInGuests,
        change: '+15%',
        trend: 'up',
        icon: <CheckCircle className="w-5 h-5 text-purple-400" />
      },
      {
        label: 'Attendance Rate',
        value: totalGuests > 0 ? `${Math.round((checkedInGuests / totalGuests) * 100)}%` : '0%',
        change: '+5%',
        trend: 'up',
        icon: <TrendingUp className="w-5 h-5 text-orange-400" />
      }
    ];

    // Chart data for check-ins over time
    const chartData = filteredEvents.map(event => {
      const eventGuests = filteredGuests.filter(g => g.eventId === event.id);
      const eventCheckedIn = eventGuests.filter(g => g.checkedIn).length;
      
      return {
        name: event.name?.substring(0, 12) + '...' || 'Unnamed Event',
        guests: eventGuests.length,
        checkedIn: eventCheckedIn,
        rate: eventGuests.length > 0 ? Math.round((eventCheckedIn / eventGuests.length) * 100) : 0,
        date: event.date || new Date().toISOString().split('T')[0]
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Pie chart data for event categories
    const categoryStats = filteredEvents.reduce((acc, event) => {
      const category = event.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(categoryStats).map(([category, count]) => ({
      name: category,
      value: count,
      percentage: Math.round((count / totalEvents) * 100)
    }));

    return { stats, chartData, pieData };
  };

  const { stats, chartData, pieData } = getProcessedData();

  // Chart options
  const chartOptions = [
    { id: 'checkins', label: 'Check-ins', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance Rate', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'categories', label: 'Event Categories', icon: <PieIcon className="w-4 h-4" /> }
  ];

  // Colors for charts
  const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    // Force reload by updating a state that triggers useEffect
    window.location.reload();
  };

  // Handle export
  const handleExport = () => {
    try {
      const exportData = {
        summary: {
          totalEvents: stats[0]?.value || 0,
          totalGuests: stats[1]?.value || 0,
          totalCheckIns: stats[2]?.value || 0,
          attendanceRate: stats[3]?.value || '0%'
        },
        events: chartData,
        categories: pieData,
        exportDate: new Date().toISOString(),
        dateRange: dateRange,
        selectedEvent: selectedEvent
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reports-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      showToast('Report exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export report', 'error');
    }
  };

  if (userRole === 'client') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Reports are only available for admin and owner accounts</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <Sidebar />
        <div className="ml-64 flex flex-col">
          <Navbar />
          <main className="flex-1 p-8 pt-24 flex items-center justify-center">
            <div className="text-center max-w-md">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Error Loading Reports</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Sidebar />
      <div className="ml-64 flex flex-col">
        <Navbar />
        
        <main className="flex-1 p-8 pt-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-purple-400" />
                Reports & Analytics
              </h1>
              <p className="text-gray-400">
                Real-time insights and performance analytics
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button 
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-400">Loading real-time data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-600/20 rounded-xl group-hover:scale-110 transition-transform">
                        {stat.icon}
                      </div>
                      <div className={`flex items-center space-x-1 text-sm ${
                        stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stat.trend === 'up' ? 
                          <ArrowUp className="w-4 h-4" /> : 
                          <ArrowDown className="w-4 h-4" />
                        }
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">Filters:</span>
                    </div>
                    
                    <select
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
                    >
                      <option value="all">All Events</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                      ))}
                    </select>
                    
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="365">Last year</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2 md:ml-auto">
                    {chartOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setActiveChart(option.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeChart === option.id 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                      >
                        {option.icon}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Check-ins Chart */}
                {activeChart === 'checkins' && (
                  <div className="lg:col-span-2 glass-dark p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                      Event Check-ins Overview
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <YAxis stroke="#9CA3AF" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="guests" fill="#3B82F6" name="Total Guests" />
                          <Bar dataKey="checkedIn" fill="#10B981" name="Checked In" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Attendance Rate Chart */}
                {activeChart === 'attendance' && (
                  <div className="lg:col-span-2 glass-dark p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                      Attendance Rate Trends
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <YAxis stroke="#9CA3AF" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="rate" 
                            stroke="#10B981" 
                            strokeWidth={3}
                            name="Attendance Rate (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Event Categories Pie Chart */}
                {activeChart === 'categories' && (
                  <div className="lg:col-span-2 glass-dark p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <PieIcon className="w-5 h-5 mr-2 text-purple-400" />
                      Event Categories Distribution
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({name, percentage}) => `${name} ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-orange-400" />
                  Recent Check-ins
                </h3>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {allGuests
                    .filter(guest => guest.checkedIn && guest.checkInTime)
                    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
                    .slice(0, 10)
                    .map((guest, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{guest.name}</p>
                            <p className="text-gray-400 text-sm">{guest.eventName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">
                            {new Date(guest.checkInTime).toLocaleTimeString()}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(guest.checkInTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                  {allGuests.filter(g => g.checkedIn).length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No check-ins yet</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Reports;
// src/pages/Stats.jsx - REAL-TIME VERSION
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  getDocs
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
  Download,
  RefreshCw,
  Users,
  CheckCircle,
  Clock,
  PieChart as PieIcon,
  Activity,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Eye,
  UserCheck,
  Star
} from 'lucide-react';

const Stats = () => {
  const { userRole, currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [allGuests, setAllGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState({
    totalEvents: 0,
    totalGuests: 0,
    totalCheckIns: 0,
    upcomingEvents: 0,
    averageAttendance: 0,
    topEvent: null
  });

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
          setLoading(false);
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

  // Load guests for all events and calculate stats
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
              eventDate: event.date,
              ...doc.data() 
            };
            allGuestsData.push(guestData);
          });
        } catch (error) {
          console.warn(`Failed to load guests for event ${event.id}:`, error);
        }
      }
      
      setAllGuests(allGuestsData);
      calculateRealTimeStats(eventsData, allGuestsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading guests:', err);
      setError('Failed to load guests data');
      setLoading(false);
    }
  };

  // Calculate real-time statistics
  const calculateRealTimeStats = (eventsData, guestsData) => {
    const totalEvents = eventsData.length;
    const totalGuests = guestsData.length;
    const totalCheckIns = guestsData.filter(g => g.checkedIn).length;
    
    const upcomingEvents = eventsData.filter(event => {
      if (!event.date) return false;
      try {
        const eventDate = new Date(event.date);
        return eventDate > new Date();
      } catch {
        return false;
      }
    }).length;

    const averageAttendance = totalGuests > 0 
      ? Math.round((totalCheckIns / totalGuests) * 100) 
      : 0;

    // Find top performing event
    const eventStats = eventsData.map(event => {
      const eventGuests = guestsData.filter(g => g.eventId === event.id);
      const eventCheckIns = eventGuests.filter(g => g.checkedIn).length;
      const attendanceRate = eventGuests.length > 0 
        ? Math.round((eventCheckIns / eventGuests.length) * 100) 
        : 0;
      
      return {
        ...event,
        guestCount: eventGuests.length,
        checkInCount: eventCheckIns,
        attendanceRate
      };
    });

    const topEvent = eventStats.reduce((top, current) => 
      (current.attendanceRate > (top?.attendanceRate || 0)) ? current : top, 
      null
    );

    setRealTimeStats({
      totalEvents,
      totalGuests,
      totalCheckIns,
      upcomingEvents,
      averageAttendance,
      topEvent
    });
  };

  // Process chart data
  const getChartData = () => {
    if (!events.length) return { attendanceData: [], categoryData: [], timelineData: [] };

    // Attendance data for bar chart
    const attendanceData = events.map(event => {
      const eventGuests = allGuests.filter(g => g.eventId === event.id);
      const eventCheckIns = eventGuests.filter(g => g.checkedIn).length;
      
      return {
        name: event.name?.substring(0, 15) + '...' || 'Unnamed Event',
        fullName: event.name || 'Unnamed Event',
        guests: eventGuests.length,
        checkIns: eventCheckIns,
        rate: eventGuests.length > 0 ? Math.round((eventCheckIns / eventGuests.length) * 100) : 0,
        date: event.date || new Date().toISOString().split('T')[0]
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Category distribution for pie chart
    const categoryStats = events.reduce((acc, event) => {
      const category = event.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const categoryData = Object.entries(categoryStats).map(([category, count]) => ({
      name: category,
      value: count,
      percentage: Math.round((count / events.length) * 100)
    }));

    // Timeline data for check-ins over time
    const checkInsByDate = allGuests
      .filter(g => g.checkedIn && g.checkInTime)
      .reduce((acc, guest) => {
        const date = new Date(guest.checkInTime).toDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

    const timelineData = Object.entries(checkInsByDate)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        checkIns: count,
        fullDate: date
      }))
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
      .slice(-7); // Last 7 days

    return { attendanceData, categoryData, timelineData };
  };

  const { attendanceData, categoryData, timelineData } = getChartData();

  // Colors for charts
  const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

  // Statistics cards data
  const statsCards = [
    {
      title: 'Total Events',
      value: realTimeStats.totalEvents,
      change: '+12%',
      trend: 'up',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-blue-600/20',
      textColor: 'text-blue-400'
    },
    {
      title: 'Total Guests',
      value: realTimeStats.totalGuests,
      change: '+8%',
      trend: 'up',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-600/20',
      textColor: 'text-green-400'
    },
    {
      title: 'Check-ins',
      value: realTimeStats.totalCheckIns,
      change: '+15%',
      trend: 'up',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-purple-600/20',
      textColor: 'text-purple-400'
    },
    {
      title: 'Upcoming Events',
      value: realTimeStats.upcomingEvents,
      change: '+5%',
      trend: 'up',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-orange-600/20',
      textColor: 'text-orange-400'
    }
  ];

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    showToast('Refreshing statistics...', 'info');
    // Reload data
    window.location.reload();
  };

  // Handle export
  const handleExport = () => {
    try {
      const exportData = {
        summary: realTimeStats,
        chartData: {
          attendance: attendanceData,
          categories: categoryData,
          timeline: timelineData
        },
        events: events.map(event => ({
          id: event.id,
          name: event.name,
          date: event.date,
          category: event.category,
          guestCount: allGuests.filter(g => g.eventId === event.id).length,
          checkInCount: allGuests.filter(g => g.eventId === event.id && g.checkedIn).length
        })),
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-statistics-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      showToast('Statistics exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export statistics', 'error');
    }
  };

  if (userRole === 'client') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Statistics are only available for admin and owner accounts</p>
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
              <h2 className="text-2xl font-bold text-white mb-4">Error Loading Statistics</h2>
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
                <BarChart3 className="w-8 h-8 mr-3 text-blue-400" />
                Event Statistics
              </h1>
              <p className="text-gray-400">
                Real-time overview of your event performance and metrics
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
                <p className="text-gray-400">Loading real-time statistics...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat, index) => (
                  <div key={index} className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 ${stat.color} rounded-xl group-hover:scale-110 transition-transform`}>
                        <div className={stat.textColor}>
                          {stat.icon}
                        </div>
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
                      <p className="text-3xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {stat.value}
                      </p>
                      <p className="text-gray-400 text-sm">{stat.title}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Performance Card */}
              {realTimeStats.topEvent && (
                <div className="glass-dark p-6 rounded-2xl border border-white/10 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
                        <Star className="w-5 h-5 mr-2 text-yellow-400" />
                        Top Performing Event
                      </h3>
                      <p className="text-2xl font-bold text-yellow-400 mb-1">
                        {realTimeStats.topEvent.name}
                      </p>
                      <p className="text-gray-400">
                        {realTimeStats.topEvent.attendanceRate}% attendance rate • 
                        {realTimeStats.topEvent.checkInCount} of {realTimeStats.topEvent.guestCount} guests checked in
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-yellow-400">
                        {realTimeStats.topEvent.attendanceRate}%
                      </div>
                      <p className="text-gray-400 text-sm">Attendance Rate</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Grid */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Event Attendance Chart */}
                <div className="glass-dark p-6 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                    Event Attendance
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceData}>
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
                          formatter={(value, name) => [
                            value,
                            name === 'guests' ? 'Total Guests' : 
                            name === 'checkIns' ? 'Checked In' : name
                          ]}
                          labelFormatter={(label) => {
                            const event = attendanceData.find(e => e.name === label);
                            return event ? event.fullName : label;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="guests" fill="#3B82F6" name="Total Guests" />
                        <Bar dataKey="checkIns" fill="#10B981" name="Checked In" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Event Categories */}
                <div className="glass-dark p-6 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <PieIcon className="w-5 h-5 mr-2 text-purple-400" />
                    Event Categories
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percentage}) => `${name} ${percentage}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
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
              </div>

              {/* Check-ins Timeline */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10 mb-8">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Check-ins Over Time (Last 7 Days)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
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
                      <Area
                        type="monotone"
                        dataKey="checkIns"
                        stroke="#10B981"
                        fill="url(#colorCheckIns)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Insights */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-dark p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-orange-400" />
                    Key Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-400">Average Attendance</span>
                      <span className="text-white font-semibold">{realTimeStats.averageAttendance}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-400">Total Check-in Rate</span>
                      <span className="text-green-400 font-semibold">
                        {realTimeStats.totalGuests > 0 
                          ? Math.round((realTimeStats.totalCheckIns / realTimeStats.totalGuests) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-400">Events This Month</span>
                      <span className="text-blue-400 font-semibold">
                        {events.filter(e => {
                          if (!e.date) return false;
                          const eventDate = new Date(e.date);
                          const now = new Date();
                          return eventDate.getMonth() === now.getMonth() && 
                                 eventDate.getFullYear() === now.getFullYear();
                        }).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-dark p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-green-400" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {allGuests
                      .filter(guest => guest.checkedIn && guest.checkInTime)
                      .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
                      .slice(0, 5)
                      .map((guest, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">{guest.name}</p>
                            <p className="text-gray-400 text-xs">{guest.eventName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-xs">
                              {new Date(guest.checkInTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    }
                    {allGuests.filter(g => g.checkedIn).length === 0 && (
                      <div className="text-center py-8">
                        <UserCheck className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No recent check-ins</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Stats;
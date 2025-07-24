// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
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
  ArrowDown
} from 'lucide-react';

const Reports = () => {
  const { userRole } = useAuth();
  const [events, setEvents] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [activeChart, setActiveChart] = useState('checkins');

  useEffect(() => {
    // Fetch events
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = [];
      snapshot.forEach((doc) => {
        eventsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setEvents(eventsData);
    });

    // Fetch check-ins/activities
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('type', '==', 'check_in'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesData = [];
      snapshot.forEach((doc) => {
        activitiesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setCheckIns(activitiesData);
      setLoading(false);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeActivities();
    };
  }, []);

  // Process data for charts
  const processCheckInData = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyData = {};
    
    // Initialize data for all days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        date: dateStr,
        checkIns: 0,
        events: 0
      };
    }

    // Count check-ins per day
    checkIns.forEach(checkIn => {
      if (checkIn.timestamp) {
        const date = checkIn.timestamp.toDate();
        if (date >= startDate && date <= endDate) {
          const dateStr = date.toISOString().split('T')[0];
          if (dailyData[dateStr]) {
            dailyData[dateStr].checkIns++;
          }
        }
      }
    });

    return Object.values(dailyData).reverse();
  };

  const processEventData = () => {
    return events.map(event => ({
      name: event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name,
      checkIns: event.checkedInGuests || 0,
      totalGuests: event.totalGuests || 0,
      percentage: event.totalGuests ? Math.round((event.checkedInGuests || 0) / event.totalGuests * 100) : 0
    }));
  };

  const processPieData = () => {
    const eventStats = events.map(event => ({
      name: event.name.length > 20 ? event.name.substring(0, 20) + '...' : event.name,
      value: event.checkedInGuests || 0
    })).filter(item => item.value > 0);

    return eventStats.slice(0, 8); // Top 8 events
  };

  const chartData = processCheckInData();
  const eventData = processEventData();
  const pieData = processPieData();

  const COLORS = ['#e50914', '#f40612', '#b81d24', '#d22730', '#8b0000', '#ff6b6b', '#ff8e8e', '#ffb3b3'];

  const chartOptions = [
    { id: 'checkins', label: 'Check-ins Over Time', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'events', label: 'Event Performance', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'distribution', label: 'Check-in Distribution', icon: <PieIcon className="w-4 h-4" /> }
  ];

  const stats = [
    {
      label: 'Total Check-ins',
      value: checkIns.length,
      change: '+12%',
      trend: 'up',
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      label: 'Active Events',
      value: events.filter(e => new Date(e.date) >= new Date()).length,
      change: '+5%',
      trend: 'up',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      label: 'Total Events',
      value: events.length,
      change: '+8%',
      trend: 'up',
      icon: <Activity className="w-5 h-5" />
    },
    {
      label: 'Avg. Attendance',
      value: events.length > 0 ? Math.round(events.reduce((acc, e) => acc + (e.checkedInGuests || 0), 0) / events.length) : 0,
      change: '-2%',
      trend: 'down',
      icon: <Users className="w-5 h-5" />
    }
  ];

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
                Track performance and analyze your event data
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200">
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

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
                        : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
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
            {/* Main Chart */}
            <div className="lg:col-span-2 glass-dark p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6">
                {chartOptions.find(opt => opt.id === activeChart)?.label}
              </h3>
              
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChart === 'checkins' && (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e50914" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#e50914" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
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
                          stroke="#e50914"
                          fillOpacity={1}
                          fill="url(#colorCheckIns)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    )}
                    
                    {activeChart === 'events' && (
                      <BarChart data={eventData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
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
                        <Bar dataKey="checkIns" fill="#e50914" name="Check-ins" />
                        <Bar dataKey="totalGuests" fill="#6B7280" name="Total Guests" />
                      </BarChart>
                    )}
                    
                    {activeChart === 'distribution' && (
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Event Performance Table */}
          <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Event Performance Details</h3>
              <p className="text-gray-400 text-sm mt-1">Detailed breakdown of each event's performance</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Event</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Total Guests</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Check-ins</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Attendance Rate</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-t border-white/10">
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-4 w-32 rounded"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-4 w-24 rounded"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-6 w-16 rounded"></div>
                        </td>
                      </tr>
                    ))
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No events found</p>
                        <p className="text-gray-500 text-sm">Create your first event to see analytics</p>
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => {
                      const attendanceRate = event.totalGuests ? 
                        Math.round((event.checkedInGuests || 0) / event.totalGuests * 100) : 0;
                      const eventDate = new Date(event.date);
                      const isUpcoming = eventDate > new Date();
                      const isPast = eventDate < new Date();
                      
                      return (
                        <tr key={event.id} className="border-t border-white/10 hover:bg-white/5 transition-all">
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-white font-medium">{event.name}</p>
                              <p className="text-gray-400 text-sm truncate max-w-xs">
                                {event.description || 'No description'}
                              </p>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-gray-300 text-sm">
                                {eventDate.toLocaleDateString()}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {event.time || 'No time set'}
                              </p>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <span className="text-white font-medium">
                              {event.totalGuests || 0}
                            </span>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium">
                                {event.checkedInGuests || 0}
                              </span>
                              {(event.checkedInGuests || 0) > 0 && (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    attendanceRate >= 80 ? 'bg-green-500' :
                                    attendanceRate >= 60 ? 'bg-yellow-500' :
                                    attendanceRate >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                                ></div>
                              </div>
                              <span className={`text-sm font-medium ${
                                attendanceRate >= 80 ? 'text-green-400' :
                                attendanceRate >= 60 ? 'text-yellow-400' :
                                attendanceRate >= 40 ? 'text-orange-400' : 'text-red-400'
                              }`}>
                                {attendanceRate}%
                              </span>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isUpcoming ? 'bg-blue-600/20 text-blue-400' :
                              isPast ? 'bg-gray-600/20 text-gray-400' :
                              'bg-green-600/20 text-green-400'
                            }`}>
                              {isUpcoming ? 'Upcoming' : isPast ? 'Completed' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
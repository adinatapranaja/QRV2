// src/pages/Stats.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  Calendar,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Activity,
  Eye,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { exportEventStatsToCSV } from '../utils/csv';
import { showToast } from '../utils/toast';

const Stats = () => {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalGuests: 0,
    totalCheckIns: 0,
    upcomingEvents: 0
  });
  const [events, setEvents] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Mock data loader with null checking
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock events data with proper null checking
      const mockEvents = [
        {
          id: '1',
          name: 'Tech Conference 2024',
          date: '2024-12-15',
          time: '09:00',
          location: 'Convention Center',
          totalGuests: 250,
          checkedInGuests: 187,
          status: 'upcoming',
          createdAt: new Date().toISOString()
        },
        {
          id: '2', 
          name: 'Annual Meetup',
          date: '2024-12-20',
          time: '14:00',
          location: 'Hotel Ballroom',
          totalGuests: 150,
          checkedInGuests: 142,
          status: 'upcoming',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Workshop Series',
          date: '2024-11-25',
          time: '10:00', 
          location: 'Training Center',
          totalGuests: 80,
          checkedInGuests: 75,
          status: 'completed',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Networking Event',
          date: '2024-11-30',
          time: '18:00',
          location: 'Rooftop Venue',
          totalGuests: 120,
          checkedInGuests: 98,
          status: 'completed',
          createdAt: new Date().toISOString()
        }
      ];

      // Process events with null safety
      const processedEvents = mockEvents.map(event => ({
        ...event,
        date: event.date || new Date().toISOString().split('T')[0],
        attendanceRate: event.totalGuests && event.totalGuests > 0 ? 
          Math.round((event.checkedInGuests || 0) / event.totalGuests * 100) : 0
      }));

      // Calculate stats with null checking
      const totalEvents = processedEvents.length;
      const totalGuests = processedEvents.reduce((sum, event) => sum + (event.totalGuests || 0), 0);
      const totalCheckIns = processedEvents.reduce((sum, event) => sum + (event.checkedInGuests || 0), 0);
      const upcomingEvents = processedEvents.filter(event => {
        if (!event.date) return false;
        try {
          return new Date(event.date) > new Date();
        } catch {
          return false;
        }
      }).length;

      // Create chart data with null safety
      const chartDataProcessed = processedEvents.map(event => ({
        name: event.name ? (event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name) : 'Unnamed Event',
        guests: event.totalGuests || 0,
        checkIns: event.checkedInGuests || 0,
        rate: event.attendanceRate || 0
      }));

      setStats({
        totalEvents,
        totalGuests,
        totalCheckIns,
        upcomingEvents
      });

      setEvents(processedEvents);
      setChartData(chartDataProcessed);
      
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load statistics data');
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportStats = () => {
    try {
      if (events.length === 0) {
        showToast('No data to export', 'warning');
        return;
      }
      
      exportEventStatsToCSV(events, 'event_statistics');
      showToast('Statistics exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export statistics', 'error');
    }
  };

  const handleRefresh = () => {
    loadData();
    showToast('Statistics refreshed!', 'info');
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
                Overview of your event performance and metrics
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={handleExportStats}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Total Events',
                value: stats.totalEvents,
                change: '+12%',
                trend: 'up',
                icon: <Calendar className="w-5 h-5" />
              },
              {
                title: 'Total Guests',
                value: stats.totalGuests,
                change: '+8%',
                trend: 'up',
                icon: <Users className="w-5 h-5" />
              },
              {
                title: 'Check-ins',
                value: stats.totalCheckIns,
                change: '+15%',
                trend: 'up',
                icon: <CheckCircle className="w-5 h-5" />
              },
              {
                title: 'Upcoming Events',
                value: stats.upcomingEvents,
                change: '+5%',
                trend: 'up',
                icon: <Clock className="w-5 h-5" />
              }
            ].map((stat, index) => (
              <div key={index} className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gray-600 rounded-xl"></div>
                      <div className="w-16 h-4 bg-gray-600 rounded"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-600 rounded mb-2"></div>
                    <div className="w-24 h-4 bg-gray-600 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-600/20 rounded-xl group-hover:scale-110 transition-transform">
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
                      <p className="text-3xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm">{stat.title}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Bar Chart */}
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                  Event Attendance
                </h3>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  View Details
                </button>
              </div>
              
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="loading-spinner"></div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No data available</p>
                    </div>
                  </div>
                ) : (
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
                      <Bar dataKey="checkIns" fill="#10B981" name="Check-ins" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie Chart */}
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-400" />
                  Attendance Rate
                </h3>
                <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                  View Details
                </button>
              </div>
              
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="loading-spinner"></div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No data available</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, rate }) => `${name}: ${rate}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="rate"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
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
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Events Table */}
          <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Eye className="w-5 h-5 mr-2 text-green-400" />
                Event Details
              </h3>
              <p className="text-gray-400 text-sm mt-1">Detailed breakdown of each event</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Event</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Guests</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Check-ins</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Rate</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
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
                        <p className="text-gray-500 text-sm">Create your first event to see statistics</p>
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => {
                      const eventDate = event.date ? new Date(event.date) : new Date();
                      const isUpcoming = eventDate > new Date();
                      
                      return (
                        <tr key={event.id} className="border-t border-white/10 hover:bg-white/5 transition-all">
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-white font-medium">{event.name || 'Unnamed Event'}</p>
                              <p className="text-gray-400 text-sm">{event.location || 'No location'}</p>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <p className="text-gray-300 text-sm">
                              {event.date ? new Date(event.date).toLocaleDateString() : 'No date'}
                            </p>
                            <p className="text-gray-500 text-xs">{event.time || 'No time'}</p>
                          </td>
                          
                          <td className="py-4 px-6">
                            <span className="text-white font-medium">
                              {event.totalGuests || 0}
                            </span>
                          </td>
                          
                          <td className="py-4 px-6">
                            <span className="text-green-400 font-medium">
                              {event.checkedInGuests || 0}
                            </span>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 bg-gray-700 rounded-full h-2 w-16">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    event.attendanceRate >= 80 ? 'bg-green-500' :
                                    event.attendanceRate >= 60 ? 'bg-yellow-500' :
                                    event.attendanceRate >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(event.attendanceRate || 0, 100)}%` }}
                                ></div>
                              </div>
                              <span className={`text-sm font-medium ${
                                event.attendanceRate >= 80 ? 'text-green-400' :
                                event.attendanceRate >= 60 ? 'text-yellow-400' :
                                event.attendanceRate >= 40 ? 'text-orange-400' : 'text-red-400'
                              }`}>
                                {event.attendanceRate || 0}%
                              </span>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isUpcoming ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'
                            }`}>
                              {isUpcoming ? 'Upcoming' : 'Completed'}
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

export default Stats;
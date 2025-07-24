// src/pages/Stats.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { exportEventStatsToCSV } from '../utils/csv';
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Download,
  Calendar,
  Clock,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  RefreshCw,
  QrCode
} from 'lucide-react';

const Stats = () => {
  const { eventId } = useParams();
  
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');

  // Load event and guests data
  useEffect(() => {
    loadData();
  }, [eventId]); // Remove loadData dependency to avoid infinite loop

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      // Load event
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() });
      }

      // Load guests
      const guestsQuery = query(collection(db, 'events', eventId, 'guests'));
      const guestsSnapshot = await getDocs(guestsQuery);
      const guestsData = guestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGuests(guestsData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalGuests = guests.length;
    const checkedInGuests = guests.filter(guest => guest.checkedIn);
    const notCheckedInGuests = guests.filter(guest => !guest.checkedIn);
    
    const checkinRate = totalGuests > 0 ? Math.round((checkedInGuests.length / totalGuests) * 100) : 0;

    // Filter by time if needed
    let filteredCheckins = checkedInGuests;
    if (timeFilter !== 'all') {
      const filterTime = new Date();
      
      switch (timeFilter) {
        case 'today':
          filterTime.setHours(0, 0, 0, 0);
          break;
        case 'hour':
          filterTime.setHours(filterTime.getHours() - 1);
          break;
        case 'week':
          filterTime.setDate(filterTime.getDate() - 7);
          break;
        default:
          break;
      }

      filteredCheckins = checkedInGuests.filter(guest => 
        guest.checkInTime && new Date(guest.checkInTime) >= filterTime
      );
    }

    // Category breakdown
    const categoryStats = guests.reduce((acc, guest) => {
      const category = guest.category || 'Unknown';
      if (!acc[category]) {
        acc[category] = { total: 0, checkedIn: 0 };
      }
      acc[category].total++;
      if (guest.checkedIn) {
        acc[category].checkedIn++;
      }
      return acc;
    }, {});

    // Check-in timeline (hourly breakdown for today)
    const timelineStats = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    checkedInGuests.forEach(guest => {
      if (guest.checkInTime) {
        const checkInDate = new Date(guest.checkInTime);
        if (checkInDate >= today) {
          const hour = checkInDate.getHours();
          timelineStats[hour] = (timelineStats[hour] || 0) + 1;
        }
      }
    });

    return {
      totalGuests,
      checkedInGuests: checkedInGuests.length,
      notCheckedInGuests: notCheckedInGuests.length,
      checkinRate,
      categoryStats,
      timelineStats,
      filteredCheckins: filteredCheckins.length,
      recentCheckins: checkedInGuests
        .filter(guest => guest.checkInTime)
        .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
        .slice(0, 5)
    };
  };

  // Export statistics
  const handleExportStats = () => {
    try {
      const stats = calculateStats();
      exportEventStatsToCSV(stats, guests, event?.name || 'event');
      showToast('Statistics exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting statistics:', error);
      showToast('Failed to export statistics', 'error');
    }
  };

  // Toast notification function
  const showToast = (message, type) => {
    console.log(`${type}: ${message}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Sidebar />
      <div className="ml-64 flex flex-col">
        <Navbar />
        
        <main className="flex-1 p-8 pt-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link
                to={`/events/${eventId}/guests`}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Event Statistics</h1>
                <p className="text-gray-400">{event?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-600"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="hour">Last Hour</option>
                  <option value="week">This Week</option>
                </select>
              </div>
              
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleExportStats}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Event Info */}
          <div className="glass-dark p-6 rounded-2xl border border-white/10 mb-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white font-medium">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">Time</p>
                  <p className="text-white font-medium">{event.time}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Location</p>
                  <p className="text-white font-medium">{event.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Statistics Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Guests</p>
                  <p className="text-3xl font-bold text-white">{stats.totalGuests}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-xs text-gray-400">
                Registered guests
              </div>
            </div>
            
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Checked In</p>
                  <p className="text-3xl font-bold text-green-400">{stats.checkedInGuests}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-xs text-gray-400">
                Successfully checked in
              </div>
            </div>
            
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-3xl font-bold text-red-400">{stats.notCheckedInGuests}</p>
                </div>
                <UserX className="w-8 h-8 text-red-400" />
              </div>
              <div className="text-xs text-gray-400">
                Not yet checked in
              </div>
            </div>
            
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Attendance Rate</p>
                  <p className="text-3xl font-bold text-purple-400">{stats.checkinRate}%</p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.checkinRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Category Breakdown */}
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Category Breakdown
              </h3>
              
              <div className="space-y-4">
                {Object.entries(stats.categoryStats).map(([category, data]) => {
                  const percentage = data.total > 0 ? Math.round((data.checkedIn / data.total) * 100) : 0;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{category}</span>
                        <span className="text-gray-400 text-sm">
                          {data.checkedIn}/{data.total} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Check-in Timeline */}
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Check-in Timeline (Today)
              </h3>
              
              {Object.keys(stats.timelineStats).length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No check-ins today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const count = stats.timelineStats[hour] || 0;
                    const maxCount = Math.max(...Object.values(stats.timelineStats));
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={hour} className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm w-12">
                          {hour.toString().padStart(2, '0')}:00
                        </span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm w-8">{count}</span>
                      </div>
                    );
                  }).filter((_, hour) => stats.timelineStats[hour] > 0)}
                </div>
              )}
            </div>
          </div>

          {/* Recent Check-ins */}
          <div className="glass-dark p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Recent Check-ins
            </h3>
            
            {stats.recentCheckins.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No check-ins yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.recentCheckins.map((guest) => (
                  <div key={guest.id} className="p-4 bg-black/20 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{guest.name}</h4>
                        <p className="text-gray-400 text-sm">{guest.category}</p>
                      </div>
                      <UserCheck className="w-5 h-5 text-green-400" />
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {new Date(guest.checkInTime).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Link
              to={`/events/${eventId}/guests`}
              className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Manage Guests</h3>
                  <p className="text-gray-400 text-sm">View and edit guest list</p>
                </div>
              </div>
            </Link>

            <Link
              to={`/events/${eventId}/scanner`}
              className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                          <QrCode className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">QR Scanner</h3>
                  <p className="text-gray-400 text-sm">Scan guest QR codes</p>
                </div>
              </div>
            </Link>

            <Link
              to={`/events/${eventId}/qr-generator`}
              className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                          <QrCode className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Generate QR</h3>
                  <p className="text-gray-400 text-sm">Create guest QR codes</p>
                </div>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Stats;
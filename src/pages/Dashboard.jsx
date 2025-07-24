// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import QuickActions from '../components/QuickActions';
import RecentActivity from '../components/RecentActivity';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Activity,
  ArrowUp,
  ArrowDown,
  Eye,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  Star
} from 'lucide-react';
import { showToast } from '../utils/toast';

const Dashboard = () => {
  const { currentUser, userRole } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 1234,
    totalEvents: 28,
    totalCheckIns: 456,
    activeEvents: 8,
    growth: 12.5,
    activeUsers: 789
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and fetch real data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update stats with real data from Firestore
        // This would typically fetch from your database
        setStats(prev => ({
          ...prev,
          // Update with real values
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Real-time data updates simulation
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeUsers: Math.max(0, prev.activeUsers + Math.floor(Math.random() * 10) - 5),
        growth: +(prev.growth + (Math.random() * 2 - 1)).toFixed(1)
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, change, icon, trend, loading = false }) => (
    <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
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
            <div className="p-3 netflix-gradient rounded-xl group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend === 'up' ? 
                <ArrowUp className="w-4 h-4" /> : 
                <ArrowDown className="w-4 h-4" />
              }
              <span>{change}</span>
            </div>
          </div>
          
          <div>
            <p className="text-3xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <p className="text-gray-400 text-sm">{title}</p>
          </div>
        </>
      )}
    </div>
  );

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificStats = () => {
    if (userRole === 'owner') {
      return [
        { 
          title: 'Total Users', 
          value: stats.totalUsers, 
          change: '+12%', 
          trend: 'up', 
          icon: <Users className="w-5 h-5" /> 
        },
        { 
          title: 'Total Events', 
          value: stats.totalEvents, 
          change: '+8%', 
          trend: 'up', 
          icon: <Calendar className="w-5 h-5" /> 
        },
        { 
          title: 'Check-ins Today', 
          value: stats.totalCheckIns, 
          change: '+15%', 
          trend: 'up', 
          icon: <CheckCircle className="w-5 h-5" /> 
        },
        { 
          title: 'Active Events', 
          value: stats.activeEvents, 
          change: '+5%', 
          trend: 'up', 
          icon: <Activity className="w-5 h-5" /> 
        }
      ];
    } else if (userRole === 'admin') {
      return [
        { 
          title: 'My Events', 
          value: stats.totalEvents, 
          change: '+8%', 
          trend: 'up', 
          icon: <Calendar className="w-5 h-5" /> 
        },
        { 
          title: 'Check-ins Today', 
          value: stats.totalCheckIns, 
          change: '+15%', 
          trend: 'up', 
          icon: <CheckCircle className="w-5 h-5" /> 
        },
        { 
          title: 'Active Events', 
          value: stats.activeEvents, 
          change: '+5%', 
          trend: 'up', 
          icon: <Activity className="w-5 h-5" /> 
        },
        { 
          title: 'Avg. Attendance', 
          value: '78%', 
          change: '+3%', 
          trend: 'up', 
          icon: <TrendingUp className="w-5 h-5" /> 
        }
      ];
    }
    
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Sidebar />
      <div className="ml-64 flex flex-col">
        <Navbar />
        
        <main className="flex-1 p-8 pt-24">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {getWelcomeMessage()}, {currentUser?.displayName?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="text-gray-400 text-lg">
                  Here's what's happening with your events today
                </p>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-semibold capitalize">{userRole}</p>
                  <p className="text-gray-400 text-sm">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-red-600/50">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <QuickActions />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {getRoleSpecificStats().map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
                trend={stat.trend}
                loading={loading}
              />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Recent Activity - Takes 2/3 of the space */}
            <div className="lg:col-span-2">
              <RecentActivity maxItems={8} />
            </div>

            {/* Quick Stats & Info */}
            <div className="space-y-6">
              {/* Performance Overview */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Performance
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Event Success Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '87%'}}></div>
                      </div>
                      <span className="text-green-400 text-sm font-medium">87%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Check-in Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '73%'}}></div>
                      </div>
                      <span className="text-blue-400 text-sm font-medium">73%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">User Satisfaction</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                      <span className="text-purple-400 text-sm font-medium">92%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-orange-400" />
                  Upcoming Events
                </h3>
                
                <div className="space-y-3">
                  {[
                    { name: 'Tech Conference 2024', date: 'Dec 15', attendees: 250 },
                    { name: 'Annual Meetup', date: 'Dec 20', attendees: 150 },
                    { name: 'Workshop Series', date: 'Dec 25', attendees: 80 }
                  ].map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                      <div>
                        <p className="text-white font-medium text-sm">{event.name}</p>
                        <p className="text-gray-400 text-xs">{event.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-400 text-sm font-medium">{event.attendees}</p>
                        <p className="text-gray-500 text-xs">attendees</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section - Only for Owner/Admin */}
          {(userRole === 'owner' || userRole === 'admin') && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Analytics Chart Placeholder */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                    Analytics Overview
                  </h3>
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    View Details
                  </button>
                </div>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Chart will be displayed here</p>
                    <p className="text-gray-500 text-sm">Connect your analytics service</p>
                  </div>
                </div>
              </div>

              {/* Performance Chart Placeholder */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-purple-400" />
                    Performance Metrics
                  </h3>
                  <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                    View Reports
                  </button>
                </div>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl">
                  <div className="text-center">
                    <PieChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Performance data will be shown here</p>
                    <p className="text-gray-500 text-sm">Real-time monitoring</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Client-specific content */}
          {userRole === 'client' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-green-400" />
                  Your Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 glass rounded-xl">
                    <span className="text-gray-400">Account Status</span>
                    <span className="text-green-400 font-medium">Active</span>
                  </div>
                  <div className="flex justify-between items-center p-4 glass rounded-xl">
                    <span className="text-gray-400">Subscription</span>
                    <span className="text-blue-400 font-medium">Premium</span>
                  </div>
                </div>
              </div>

              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-400" />
                  Upgrade Benefits
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Access to premium features</li>
                  <li>• Priority customer support</li>
                  <li>• Advanced analytics</li>
                  <li>• Custom branding options</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
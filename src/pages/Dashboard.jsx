// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowUp,
  ArrowDown,
  Eye,
  Calendar,
  Star,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser, userRole } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 1234,
    revenue: 45678,
    growth: 12.5,
    activeUsers: 789
  });

  const [recentActivity] = useState([
    { id: 1, user: 'John Doe', action: 'Signed up', time: '2 minutes ago', type: 'user' },
    { id: 2, user: 'Jane Smith', action: 'Made a purchase', time: '5 minutes ago', type: 'sale' },
    { id: 3, user: 'Mike Johnson', action: 'Updated profile', time: '10 minutes ago', type: 'update' },
    { id: 4, user: 'Sarah Wilson', action: 'Left a review', time: '15 minutes ago', type: 'review' }
  ]);

  const [quickActions] = useState([
    { icon: <Users className="w-5 h-5" />, label: 'Manage Users', color: 'bg-blue-600' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'View Analytics', color: 'bg-green-600' },
    { icon: <Star className="w-5 h-5" />, label: 'Premium Features', color: 'bg-purple-600' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Schedule Meeting', color: 'bg-orange-600' }
  ]);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        growth: +(prev.growth + (Math.random() * 2 - 1)).toFixed(1)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, change, icon, trend }) => (
    <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 netflix-gradient rounded-xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className={`flex items-center space-x-1 text-sm ${
          trend === 'up' ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          <span>{change}%</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value.toLocaleString()}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </div>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return <Users className="w-4 h-4 text-blue-400" />;
      case 'sale': return <DollarSign className="w-4 h-4 text-green-400" />;
      case 'update': return <Activity className="w-4 h-4 text-yellow-400" />;
      case 'review': return <Star className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Sidebar />
      <Navbar />
      
      <main className="ml-64 pt-16 p-6">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {currentUser?.displayName || 'User'}! 👋
              </h1>
              <p className="text-gray-400">
                Here's what's happening with your {userRole === 'owner' ? 'business' : 'account'} today.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {(userRole === 'owner' || userRole === 'admin') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              change={8.2}
              trend="up"
              icon={<Users className="w-6 h-6 text-white" />}
            />
            <StatCard
              title="Revenue"
              value={stats.revenue}
              change={15.3}
              trend="up"
              icon={<DollarSign className="w-6 h-6 text-white" />}
            />
            <StatCard
              title="Growth Rate"
              value={stats.growth}
              change={stats.growth > 12 ? 2.1 : -1.5}
              trend={stats.growth > 12 ? 'up' : 'down'}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              change={5.7}
              trend="up"
              icon={<Activity className="w-6 h-6 text-white" />}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-400" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center space-x-3 p-4 glass hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 group"
                  >
                    <div className={`p-2 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <span className="text-white font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-400" />
                  Recent Activity
                </h2>
                <button className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 glass hover:bg-white/5 rounded-xl transition-all duration-300 group"
                  >
                    <div className="p-2 bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.user}</p>
                      <p className="text-gray-400 text-sm">{item.action}</p>
                    </div>
                    <span className="text-gray-500 text-xs">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {(userRole === 'owner' || userRole === 'admin') && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Analytics Chart Placeholder */}
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                Analytics Overview
              </h2>
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
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-purple-400" />
                Performance Metrics
              </h2>
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
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-green-400" />
                Your Overview
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 glass rounded-xl">
                  <span className="text-gray-400">Account Status</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
                <div className="flex justify-between items-center p-4 glass rounded-xl">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white font-medium">Standard</span>
                </div>
                <div className="flex justify-between items-center p-4 glass rounded-xl">
                  <span className="text-gray-400">Usage</span>
                  <span className="text-blue-400 font-medium">75%</span>
                </div>
              </div>
            </div>

            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-400" />
                Upgrade Benefits
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Advanced Analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Priority Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Custom Integrations</span>
                </div>
                <button className="w-full mt-4 p-3 netflix-gradient hover:netflix-gradient-hover rounded-xl text-white font-medium transition-all duration-300 hover:scale-105">
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
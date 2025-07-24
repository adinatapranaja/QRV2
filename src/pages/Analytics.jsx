// src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import {
  BarChart3, 
  TrendingUp, 
  Users,
  Calendar,
  Activity,
  PieChart,
  LineChart,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

const Analytics = () => {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      title: 'Total Page Views',
      value: '24,567',
      change: '+12.5%',
      trend: 'up',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      title: 'Unique Visitors',
      value: '8,234',
      change: '+8.2%',
      trend: 'up',
      icon: <Users className="w-5 h-5" />
    },
    {
      title: 'Bounce Rate',
      value: '34.2%',
      change: '-2.4%',
      trend: 'down',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      title: 'Session Duration',
      value: '4m 32s',
      change: '+15.3%',
      trend: 'up',  
      icon: <Activity className="w-5 h-5" />
    }
  ];

  if (userRole === 'client') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Analytics are only available for admin and owner accounts</p>
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
                <LineChart className="w-8 h-8 mr-3 text-green-400" />
                Advanced Analytics
              </h1>
              <p className="text-gray-400">
                Deep insights into your application performance
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-500 transition-all"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              
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
                      <div className="p-3 bg-green-600/20 rounded-xl group-hover:scale-110 transition-transform">
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
                      <p className="text-3xl font-bold text-white mb-1 group-hover:text-green-400 transition-colors">
                        {stat.value}
                      </p>
                      <p className="text-gray-400 text-sm">{stat.title}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Charts Placeholder */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Traffic Chart */}
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <LineChart className="w-5 h-5 mr-2 text-green-400" />
                  Traffic Overview
                </h3>
                <button className="text-green-400 hover:text-green-300 text-sm font-medium">
                  View Details
                </button>
              </div>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl">
                <div className="text-center">
                  <LineChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Traffic analytics will be displayed here</p>
                  <p className="text-gray-500 text-sm">Connect your analytics service</p>
                </div>
              </div>
            </div>

            {/* User Demographics */}
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-blue-400" />
                  User Demographics
                </h3>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  View Details
                </button>
              </div>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl">
                <div className="text-center">
                  <PieChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">User demographics will be shown here</p>
                  <p className="text-gray-500 text-sm">Real-time user data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="glass-dark p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-400" />
                Performance Metrics
              </h3>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-lg text-sm">
                  Real-time
                </button>
                <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                  Configure
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Page Load Time', value: '1.2s', status: 'good' },
                { label: 'Time to Interactive', value: '2.8s', status: 'needs-improvement' },
                { label: 'Cumulative Layout Shift', value: '0.05', status: 'good' }
              ].map((metric, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">{metric.label}</span>
                    <div className={`w-3 h-3 rounded-full ${
                      metric.status === 'good' ? 'bg-green-500' :
                      metric.status === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;
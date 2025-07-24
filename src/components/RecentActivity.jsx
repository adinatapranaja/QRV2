// src/components/RecentActivity.jsx
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { 
  Clock, 
  User, 
  QrCode, 
  Calendar, 
  CheckCircle,
  UserPlus,
  Settings,
  Eye
} from 'lucide-react';

const RecentActivity = ({ maxItems = 10, showHeader = true }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Query untuk mengambil recent activities
    const activitiesQuery = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(maxItems)
    );

    // Setup realtime listener
    const unsubscribe = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const activitiesData = [];
        snapshot.forEach((doc) => {
          activitiesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setActivities(activitiesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching activities:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup listener
    return () => unsubscribe();
  }, [maxItems]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'check_in':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'user_registered':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'event_created':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'qr_scanned':
        return <QrCode className="w-4 h-4 text-orange-400" />;
      case 'settings_updated':
        return <Settings className="w-4 h-4 text-gray-400" />;
      case 'profile_viewed':
        return <Eye className="w-4 h-4 text-indigo-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'check_in':
        return 'border-l-green-500 bg-green-500/5';
      case 'user_registered':
        return 'border-l-blue-500 bg-blue-500/5';
      case 'event_created':
        return 'border-l-purple-500 bg-purple-500/5';
      case 'qr_scanned':
        return 'border-l-orange-500 bg-orange-500/5';
      case 'settings_updated':
        return 'border-l-gray-500 bg-gray-500/5';
      case 'profile_viewed':
        return 'border-l-indigo-500 bg-indigo-500/5';
      default:
        return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const activityTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="glass-dark p-6 rounded-2xl border border-white/10">
        {showHeader && (
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-400" />
            Recent Activity
          </h2>
        )}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4 p-4 glass rounded-xl">
                <div className="w-8 h-8 bg-gray-600 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-dark p-6 rounded-2xl border border-red-500/20">
        {showHeader && (
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-red-400" />
            Recent Activity
          </h2>
        )}
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">Failed to load activities</div>
          <div className="text-gray-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-dark p-6 rounded-2xl border border-white/10">
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-400" />
            Recent Activity
            {activities.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                {activities.length}
              </span>
            )}
          </h2>
          <button className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
            View All
          </button>
        </div>
      )}
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No recent activity</p>
            <p className="text-gray-500 text-sm">Activities will appear here as they happen</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-4 p-4 border-l-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${getActivityColor(activity.type)}`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-white font-medium truncate">
                    {activity.userName || activity.userEmail || 'Unknown User'}
                  </p>
                  {activity.isNew && (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
                
                <p className="text-gray-400 text-sm mt-1">
                  {activity.description || activity.action}
                </p>
                
                {activity.eventName && (
                  <p className="text-blue-400 text-xs mt-1">
                    Event: {activity.eventName}
                  </p>
                )}
                
                {activity.metadata && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <span 
                        key={key}
                        className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="text-right flex-shrink-0">
                <span className="text-gray-500 text-xs block">
                  {formatTimestamp(activity.timestamp)}
                </span>
                {activity.location && (
                  <span className="text-gray-600 text-xs block mt-1">
                    {activity.location}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length >= maxItems && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <button className="w-full text-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors py-2 hover:bg-blue-600/10 rounded-lg">
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
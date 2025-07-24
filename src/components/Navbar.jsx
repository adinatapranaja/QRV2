// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  LogOut, 
  User, 
  Settings,
  ChevronDown,
  Crown,
  Shield
} from 'lucide-react';

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState([
    { id: 1, title: 'Welcome to YourApp!', message: 'Get started with your dashboard', time: '2m ago', unread: true },
    { id: 2, title: 'System Update', message: 'New features available', time: '1h ago', unread: true },
    { id: 3, title: 'Account Security', message: 'Your account is secure', time: '2h ago', unread: false }
  ]);

  const { currentUser, userRole, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-green-500" />;
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <nav className="fixed top-0 right-0 left-64 h-16 bg-black/50 backdrop-blur-md border-b border-white/10 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600 focus:bg-white/20 transition-all duration-300"
            />
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-dark border border-white/20 rounded-2xl shadow-2xl animate-fade-in-up">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-white font-semibold">Notifications</h3>
                  <p className="text-gray-400 text-sm">{unreadCount} unread messages</p>
                </div>
                <div className="max-h-64 overflow-y-auto hide-scrollbar">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                        notification.unread ? 'bg-red-600/10' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.unread ? 'bg-red-600' : 'bg-gray-600'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium">{notification.title}</h4>
                          <p className="text-gray-400 text-xs mt-1">{notification.message}</p>
                          <span className="text-gray-500 text-xs">{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-white/10">
                  <button className="w-full text-center text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-white/10 rounded-lg transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-red-600/50 transition-all">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-white text-sm font-medium">
                  {currentUser?.displayName || 'User'}
                </p>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(userRole)}
                  <span className="text-gray-400 text-xs capitalize">{userRole}</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                showProfileMenu ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 glass-dark border border-white/20 rounded-2xl shadow-2xl animate-fade-in-up">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20">
                      {currentUser?.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {currentUser?.displayName || 'User'}
                      </p>
                      <p className="text-gray-400 text-sm">{currentUser?.email}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {getRoleIcon(userRole)}
                        <span className="text-gray-400 text-xs capitalize">{userRole}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="p-2 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded-lg transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
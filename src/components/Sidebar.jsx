// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Settings, 
  Users, 
  BarChart3, 
  FileText, 
  Star, 
  Play,
  ChevronLeft,
  ChevronRight,
  Crown,
  Shield,
  User
} from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userRole } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['owner', 'admin', 'client']
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Analytics',
      path: '/analytics',
      roles: ['owner', 'admin']
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Users',
      path: '/users',
      roles: ['owner', 'admin']
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Reports',
      path: '/reports',
      roles: ['owner', 'admin', 'client']
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: 'Premium',
      path: '/premium',
      roles: ['owner', 'admin', 'client']
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      path: '/settings',
      roles: ['owner', 'admin', 'client']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'client':
        return <User className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'admin':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'client':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-black/50 backdrop-blur-md border-r border-white/10 transition-all duration-300 z-40 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 netflix-gradient rounded-xl flex items-center justify-center">
            <Play className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">YourApp</h1>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* User Role Badge */}
      {!isCollapsed && (
        <div className="p-4 border-b border-white/10">
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
            {getRoleIcon(userRole)}
            <span className="capitalize">{userRole}</span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 hide-scrollbar overflow-y-auto">
        {filteredMenuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'netflix-gradient text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              
              {/* Active indicator */}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 netflix-gradient"></div>
    </div>
  );
};

export default Sidebar;
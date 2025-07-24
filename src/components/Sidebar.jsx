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
  ChevronLeft,
  ChevronRight,
  Crown,
  Shield,
  User,
  Calendar,
  QrCode,
  Camera,
  TrendingUp,
  PieChart,
  Activity,
  Bell
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
      roles: ['owner', 'admin'],
      category: 'main'
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'Events',
      path: '/events',
      roles: ['owner', 'admin'],
      category: 'main'
    },
    {
      icon: <Camera className="w-5 h-5" />,
      label: 'QR Scanner',
      path: '/scanner',
      roles: ['owner', 'admin'],
      category: 'main'
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Statistics',
      path: '/stats',
      roles: ['owner', 'admin'],
      category: 'analytics'
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Analytics',
      path: '/analytics',
      roles: ['owner', 'admin'],
      category: 'analytics'
    },
    // NEW: Reports Page
    {
      icon: <PieChart className="w-5 h-5" />,
      label: 'Reports',
      path: '/reports',
      roles: ['owner', 'admin'],
      category: 'analytics',
      badge: 'New'
    },
    // NEW: Users Management (Owner Only)
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Users',
      path: '/users',
      roles: ['owner'],
      category: 'management',
      badge: 'New'
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Reports (Old)',
      path: '/reports-old',
      roles: ['owner', 'admin'],
      category: 'management'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      path: '/settings',
      roles: ['owner', 'admin'],
      category: 'system'
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  // Group menu items by category
  const groupedMenuItems = filteredMenuItems.reduce((acc, item) => {
    const category = item.category || 'main';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const categoryLabels = {
    main: 'Main',
    analytics: 'Analytics',
    management: 'Management', 
    system: 'System'
  };

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

  // Don't show sidebar for client role
  if (userRole === 'client') {
    return null;
  }

  return (
    <div className={`fixed left-0 top-0 h-full bg-black/50 backdrop-blur-md border-r border-white/10 transition-all duration-300 z-40 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 netflix-gradient rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">QR Events</h1>
              <p className="text-xs text-gray-400">Management</p>
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
            {userRole === 'owner' && (
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded">
                Pro
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-6 hide-scrollbar overflow-y-auto">
        {Object.entries(groupedMenuItems).map(([category, items]) => (
          <div key={category}>
            {/* Category Label */}
            {!isCollapsed && items.length > 0 && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                  {categoryLabels[category]}
                </h3>
              </div>
            )}
            
            {/* Menu Items */}
            <div className="space-y-1">
              {items.map((item, index) => {
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                      isActive 
                        ? 'netflix-gradient text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                      {item.icon}
                    </div>
                    
                    {!isCollapsed && (
                      <>
                        <span className="font-medium flex-1">{item.label}</span>
                        
                        {/* Badge for new features */}
                        {item.badge && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full animate-pulse">
                            {item.badge}
                          </span>
                        )}
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                      </>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {item.label}
                        {item.badge && (
                          <span className="ml-2 px-1.5 py-0.5 bg-red-600 text-xs rounded">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Notifications Badge */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Updates</span>
            </div>
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
              3
            </span>
          </div>
        </div>
      )}

      {/* Collapse Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group"
        >
          {isCollapsed ? (
            <>
              <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {/* Tooltip for collapsed state */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Expand Menu
              </div>
            </>
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
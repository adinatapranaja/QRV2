// src/components/QuickActions.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  QrCode, 
  BarChart3, 
  Calendar, 
  Camera,
  Users,
  Settings,
  Zap,
  ChevronRight,
  Star,
  TrendingUp
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();
  const [hoveredAction, setHoveredAction] = useState(null);

  const quickActions = [
    {
      id: 'create-event',
      title: 'Create Event',
      description: 'Start a new event',
      icon: <Plus className="w-6 h-6" />,
      color: 'from-blue-600 to-blue-800',
      hoverColor: 'from-blue-500 to-blue-700',
      path: '/events?create=true',
      shortcut: 'Ctrl+N',
      stats: null
    },
    {
      id: 'scan-qr',
      title: 'Scan QR',
      description: 'Quick check-in',
      icon: <Camera className="w-6 h-6" />,
      color: 'from-green-600 to-green-800',
      hoverColor: 'from-green-500 to-green-700',
      path: '/scanner',
      shortcut: 'Ctrl+S',
      stats: null
    },
    {
      id: 'statistics',
      title: 'Statistics',
      description: 'View analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-purple-600 to-purple-800',
      hoverColor: 'from-purple-500 to-purple-700',
      path: '/stats',
      shortcut: 'Ctrl+A',
      stats: '+12%'
    },
    {
      id: 'events',
      title: 'All Events',
      description: 'Manage events',
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-orange-600 to-orange-800',
      hoverColor: 'from-orange-500 to-orange-700',
      path: '/events',
      shortcut: 'Ctrl+E',
      stats: '8 active'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const handleActionClick = (action) => {
    if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Zap className="w-6 h-6 mr-2 text-yellow-400" />
            Quick Actions
          </h2>
          <p className="text-gray-400 mt-1">Shortcuts to common tasks</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
        >
          Customize
        </motion.button>
      </div>

      {/* Quick Actions Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {quickActions.map((action) => (
          <motion.div
            key={action.id}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05, 
              rotateY: 5,
              transition: { type: "spring", stiffness: 300 }
            }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredAction(action.id)}
            onHoverEnd={() => setHoveredAction(null)}
            className="relative group cursor-pointer"
            onClick={() => handleActionClick(action)}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
              hoveredAction === action.id ? action.hoverColor : action.color
            } rounded-2xl transition-all duration-300 opacity-90 group-hover:opacity-100`}></div>
            
            {/* Glass Overlay */}
            <div className="relative glass-dark p-6 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all duration-300 h-full">
              {/* Icon */}
              <motion.div 
                className="mb-4"
                animate={{ 
                  rotateZ: hoveredAction === action.id ? 360 : 0 
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                  {action.icon}
                </div>
              </motion.div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white group-hover:text-white transition-colors">
                    {action.title}
                  </h3>
                  <motion.div
                    animate={{ x: hoveredAction === action.id ? 5 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                  </motion.div>
                </div>
                
                <p className="text-white/70 text-sm group-hover:text-white/90 transition-colors">
                  {action.description}
                </p>

                {/* Stats */}
                {action.stats && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: hoveredAction === action.id ? 1 : 0.7,
                      y: hoveredAction === action.id ? 0 : 10
                    }}
                    className="flex items-center space-x-1 text-xs"
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-white/80">{action.stats}</span>
                  </motion.div>
                )}

                {/* Shortcut */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredAction === action.id ? 1 : 0 }}
                  className="mt-3 pt-3 border-t border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Shortcut:</span>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">
                      {action.shortcut}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Hover Effect Particles */}
              <AnimatePresence>
                {hoveredAction === action.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute top-2 right-2"
                  >
                    <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Additional Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-dark p-4 rounded-2xl border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">More actions:</div>
            <div className="flex items-center space-x-2">
              {[
                { icon: <Users className="w-4 h-4" />, label: 'Users', path: '/users' },
                { icon: <Settings className="w-4 h-4" />, label: 'Settings', path: '/settings' },
                { icon: <QrCode className="w-4 h-4" />, label: 'Generate QR', path: '/qr-generator' }
              ].map((link, index) => (
                <motion.button
                  key={link.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(link.path)}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-gray-600"
          >
            <Zap className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickActions;
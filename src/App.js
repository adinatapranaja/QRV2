// src/App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Import styles - moved here to fix import order
import './styles/global.css';

// Import existing pages (immediate loading)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Subscribe from './pages/Subscribe';

// Import QR Event pages (immediate loading for core features)
import Events from './pages/Events';
import Guests from './pages/Guests';
import QRGenerator from './pages/QRGenerator';
import QRScanner from './pages/QRScanner';
import Stats from './pages/Stats';

// Lazy load heavy pages (new features)
const Users = lazy(() => import('./pages/Users'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Enhanced Loading Component
const LoadingScreen = ({ message = "Loading your Netflix experience..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
    <div className="text-center">
      <div className="loading-spinner mb-4"></div>
      <p className="text-gray-400 animate-pulse">{message}</p>
      <div className="mt-4 flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  </div>
);

// Enhanced Error Fallback
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
      <p className="text-gray-400 mb-6">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <div className="space-y-3">
        <button
          onClick={resetErrorBoundary}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);

// Enhanced Protected Route Component with Role Check
const ProtectedRoute = ({ 
  children, 
  requireRole = null, 
  allowedRoles = [],
  fallbackPath = '/dashboard'
}) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verifying your permissions..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user has no role, redirect to subscribe
  if (!userRole) {
    return <Navigate to="/subscribe" replace />;
  }

  // If user is client, always redirect to subscribe (except for subscribe page itself)
  if (userRole === 'client' && window.location.pathname !== '/subscribe') {
    return <Navigate to="/subscribe" replace />;
  }

  // Role-based access control
  if (requireRole) {
    if (userRole === 'owner') {
      // Owner has access to everything
    } else if (userRole === 'admin' && requireRole !== 'owner') {
      // Admin has access to non-owner routes
    } else if (userRole === 'client' && requireRole === 'client') {
      // Client has access to client routes only
    } else {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Check allowed roles array
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

// Main App Router Component
const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes - Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - Events Management */}
      <Route 
        path="/events" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Events />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/events/:eventId/guests" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Guests />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/events/:eventId/qr-generator" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <QRGenerator />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - QR & Scanning */}
      <Route 
        path="/scanner" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <QRScanner />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/stats" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Stats />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - User Management (Owner Only) */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requireRole="owner">
            <Suspense fallback={<LoadingScreen message="Loading user management..." />}>
              <Users />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - Reports & Analytics */}
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Suspense fallback={<LoadingScreen message="Loading reports..." />}>
              <Reports />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Suspense fallback={<LoadingScreen message="Loading analytics..." />}>
              <Analytics />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - Settings */}
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Settings />
          </ProtectedRoute>
        } 
      />
      
      {/* Subscription Route (All authenticated users) */}
      <Route 
        path="/subscribe" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin', 'client']}>
            <Subscribe />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <AppRouter />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
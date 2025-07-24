// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

// Import existing pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Subscribe from './pages/Subscribe';

// Import new QR Event pages
import Events from './pages/Events';
import Guests from './pages/Guests';
import QRGenerator from './pages/QRGenerator';
import QRScanner from './pages/QRScanner';
import Stats from './pages/Stats';

// Import styles
import './styles/global.css';

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
    <div className="text-center">
      <div className="loading-spinner mb-4"></div>
      <p className="text-gray-400 animate-pulse">Loading your Netflix experience...</p>
    </div>
  </div>
);

// Protected Route Component with Role Check
const ProtectedRoute = ({ children, requireRole = null, allowedRoles = [] }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
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
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check allowed roles array
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentUser && userRole && userRole !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  if (currentUser && userRole === 'client') {
    return <Navigate to="/subscribe" replace />;
  }

  if (currentUser && !userRole) {
    return <Navigate to="/subscribe" replace />;
  }

  return children;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-400 mb-6">We're sorry for the inconvenience. Please refresh the page or try again later.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="netflix-gradient px-6 py-3 rounded-lg font-semibold text-white hover:netflix-gradient-hover transition-all duration-300"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* Protected Routes - Existing */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute requireRole="owner">
            <Settings />
          </ProtectedRoute>
        } 
      />

      {/* QR Event Routes - Admin & Owner Only */}
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
      <Route 
        path="/events/:eventId/scanner" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <QRScanner />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/events/:eventId/stats" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Stats />
          </ProtectedRoute>
        } 
      />

      {/* Additional Routes for Sidebar Menu */}
      <Route 
        path="/scanner" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Events />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/stats" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Events />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requireRole="owner">
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Subscription Route */}
      <Route 
        path="/subscribe" 
        element={<Subscribe />} 
      />

      {/* Admin Routes (Owner only) */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireRole="owner">
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App min-h-screen bg-black text-white">
              <AppRoutes />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
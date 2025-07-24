// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

// Import pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Subscribe from './pages/Subscribe';

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

// Protected Route Component
const ProtectedRoute = ({ children, requireRole = null }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole) {
    return <Navigate to="/subscribe" replace />;
  }

  // Role-based access control
  if (requireRole) {
    // If specific role required, check exact match or higher privileges
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

  return children;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentUser && userRole) {
    return <Navigate to="/dashboard" replace />;
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

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />

      {/* Admin/Owner only routes (example) */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireRole="admin">
            <Dashboard /> {/* You can create separate Admin component */}
          </ProtectedRoute>
        } 
      />

      {/* Subscription Route (for users without role) */}
      <Route 
        path="/subscribe" 
        element={<Subscribe />} 
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
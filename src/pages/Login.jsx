// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Play, ArrowLeft, Shield, Star, Users } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  // Enhanced visibility animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      showToast('Successfully signed in with Google! 🎉', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google');
      showToast('Failed to sign in with Google', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isLogin && !displayName) {
      setError('Please enter your display name');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isLogin) {
        await signInWithEmail(email, password);
        showToast('Successfully signed in! Welcome back! 🚀', 'success');
      } else {
        await signUpWithEmail(email, password, displayName);
        showToast('Account created successfully! Welcome! 🎊', 'success');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Email auth error:', error);
      let errorMessage = 'Authentication failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already registered';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Enhanced Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Enhanced Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type} animate-slide-in-right`}>
          <div className="flex items-center space-x-2">
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Back to Landing */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group z-20"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Home</span>
      </Link>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className={`glass-dark p-8 rounded-3xl border border-white/10 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
        }`}>
          {/* Enhanced Logo Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 netflix-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow hover:scale-110 transition-transform duration-300">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 animate-fade-in-up">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-400 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              {isLogin ? 'Sign in to your account' : 'Join us today'}
            </p>
          </div>

          {/* Enhanced Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 text-sm animate-fade-in-up backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Enhanced Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mb-6 p-4 glass hover:bg-white/20 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 border border-white/20 flex items-center justify-center space-x-3 group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:border-white/30"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Enhanced Divider */}
          <div className="flex items-center mb-6">
            <hr className="flex-1 border-gray-600" />
            <span className="px-4 text-gray-400 text-sm">or</span>
            <hr className="flex-1 border-gray-600" />
          </div>

          {/* Enhanced Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative animate-fade-in-up">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">👤</span>
                </div>
                <input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 glass-dark rounded-xl text-white placeholder-gray-400 border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300 hover:border-white/20 focus:shadow-lg focus:shadow-red-600/20"
                  disabled={loading}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 glass-dark rounded-xl text-white placeholder-gray-400 border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300 hover:border-white/20 focus:shadow-lg focus:shadow-red-600/20"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 glass-dark rounded-xl text-white placeholder-gray-400 border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300 hover:border-white/20 focus:shadow-lg focus:shadow-red-600/20"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 p-4 netflix-gradient hover:netflix-gradient-hover rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Enhanced Toggle Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleForm}
                className="ml-2 text-red-400 hover:text-red-300 font-medium transition-colors hover:underline"
                disabled={loading}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Enhanced Forgot Password */}
          {isLogin && (
            <div className="mt-4 text-center">
              <button className="text-gray-400 hover:text-white text-sm transition-colors hover:underline">
                Forgot your password?
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Features Preview */}
        <div className={`mt-8 text-center transform transition-all duration-1000 delay-300 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}>
          <p className="text-gray-500 text-sm mb-4">Trusted by thousands of users worldwide</p>
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
            <div className="flex flex-col items-center space-y-1 hover:text-gray-400 transition-colors">
              <Shield className="w-4 h-4" />
              <span>Secure Auth</span>
            </div>
            <div className="flex flex-col items-center space-y-1 hover:text-gray-400 transition-colors">
              <Star className="w-4 h-4" />
              <span>Premium Features</span>
            </div>
            <div className="flex flex-col items-center space-y-1 hover:text-gray-400 transition-colors">
              <Users className="w-4 h-4" />
              <span>Active Community</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
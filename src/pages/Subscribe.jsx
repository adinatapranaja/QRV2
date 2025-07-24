// src/pages/Subscribe.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Star, 
  Check, 
  X, 
  Zap, 
  Shield, 
  Users, 
  BarChart3,
  ArrowRight,
  LogOut,
  Calendar,
  QrCode,
  Camera,
  Download,
  UserCheck
} from 'lucide-react';

const Subscribe = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: { monthly: 9, yearly: 90 },
      description: 'Perfect for small events and personal use',
      icon: <Star className="w-6 h-6" />,
      color: 'from-blue-600 to-blue-800',
      features: [
        'Up to 2 events per month',
        'Up to 50 guests per event', 
        'Basic QR code generation',
        'Email support',
        'Basic statistics',
        'CSV export'
      ],
      limitations: [
        'No advanced analytics',
        'No bulk QR generation',
        'No real-time notifications'
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      price: { monthly: 29, yearly: 290 },
      description: 'Best for businesses and professional events',
      icon: <Crown className="w-6 h-6" />,
      color: 'from-red-600 to-red-800',
      popular: true,
      features: [
        'Unlimited events',
        'Unlimited guests',
        'Advanced QR code features',
        'Real-time scanner',
        'Advanced analytics & reports',
        'Bulk guest import/export',
        'Custom QR designs',
        'Priority support',
        'Real-time notifications',
        'Guest check-in tracking',
        'Multiple admin users'
      ],
      limitations: []
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: { monthly: 99, yearly: 990 },
      description: 'For large organizations with advanced needs',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-purple-600 to-purple-800',
      features: [
        'Everything in Professional',
        'White-label solution',
        'Custom integrations',
        'Dedicated support manager',
        'Advanced security features',
        'API access',
        'Custom reporting',
        'SSO integration',
        'Multi-tenant support',
        'Custom training',
        'SLA guarantee'
      ],
      limitations: []
    }
  ];

  const qrFeatures = [
    {
      icon: <QrCode className="w-6 h-6" />,
      title: 'Smart QR Generation',
      description: 'Generate secure, encrypted QR codes for each guest with expiration controls'
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: 'Real-time Scanner',
      description: 'Fast camera-based scanning with instant check-in validation'
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: 'Guest Management',
      description: 'Complete guest lifecycle from registration to check-in tracking'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Advanced Analytics',
      description: 'Detailed attendance statistics and real-time event insights'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Data Export',
      description: 'Export guest lists, statistics, and reports in multiple formats'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Security First',
      description: 'AES encryption, HMAC validation, and single-use QR codes'
    }
  ];

  // Simulate payment process
  const handleUpgrade = (planId) => {
    // In real implementation, integrate with payment gateway
    alert(`Upgrade to ${plans.find(p => p.id === planId)?.name} plan initiated!\n\nThis would integrate with your payment processor.\n\nAfter successful payment, user role will be updated to 'admin'.`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 netflix-gradient rounded-lg flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">QR Events Pro</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Unlock Professional
            <span className="text-netflix-gradient bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent"> QR Event Management</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform your events with advanced QR code technology. Generate secure codes, track attendance in real-time, and get powerful insights.
          </p>
          
          {/* Current User Info */}
          {currentUser && (
            <div className="glass-dark p-6 rounded-2xl border border-white/10 inline-block mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold">Welcome, {currentUser.displayName || currentUser.email}</h3>
                  <p className="text-gray-400 text-sm">Upgrade to access professional QR event features</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* QR Features Showcase */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Powerful QR Event Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {qrFeatures.map((feature, index) => (
              <div
                key={index}
                className="glass-dark p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <div className="netflix-gradient w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-4 glass-dark p-2 rounded-2xl border border-white/10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'netflix-gradient text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                billingCycle === 'yearly'
                  ? 'netflix-gradient text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Yearly
              <span className="ml-2 px-2 py-1 bg-green-600 text-green-100 text-xs rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative glass-dark p-8 rounded-3xl border transition-all duration-300 ${
                plan.popular
                  ? 'border-red-600/50 ring-2 ring-red-600/20'
                  : 'border-white/10 hover:border-white/20'
              } ${selectedPlan === plan.id ? 'ring-2 ring-red-600/50' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="netflix-gradient px-6 py-2 rounded-full text-white text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">
                    ${plan.price[billingCycle]}
                  </span>
                  <span className="text-gray-400 ml-2">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'netflix-gradient hover:netflix-gradient-hover text-white'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.popular ? 'Start Free Trial' : 'Choose Plan'}
                </button>
              </div>

              {/* Features */}
              <div className="space-y-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start space-x-3 opacity-60">
                    <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400 text-sm">{limitation}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* QR Demo Section */}
        <div className="glass-dark p-12 rounded-3xl border border-white/10 mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                See QR Events in Action
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Experience the power of professional event management with secure QR codes, real-time scanning, and comprehensive analytics.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 netflix-gradient rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Create Events</h4>
                    <p className="text-gray-400 text-sm">Set up events with detailed information and guest management</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 netflix-gradient rounded-xl flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Generate QR Codes</h4>
                    <p className="text-gray-400 text-sm">Create secure, encrypted QR codes for each guest</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 netflix-gradient rounded-xl flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Real-time Scanning</h4>
                    <p className="text-gray-400 text-sm">Fast check-in process with mobile camera scanning</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 netflix-gradient rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Track Analytics</h4>
                    <p className="text-gray-400 text-sm">Monitor attendance and get detailed event insights</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="relative">
                <div className="w-64 h-64 bg-white rounded-3xl p-8 mx-auto mb-6 shadow-2xl">
                  <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-white" />
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 netflix-gradient rounded-full flex items-center justify-center animate-pulse">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-8 h-8 netflix-gradient rounded-full flex items-center justify-center animate-pulse delay-500">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Secure, encrypted QR codes with real-time validation
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-dark p-6 rounded-2xl border border-white/10 text-left">
              <h4 className="text-white font-semibold mb-3">How secure are the QR codes?</h4>
              <p className="text-gray-400 text-sm">
                Our QR codes use AES encryption with HMAC validation. Each code is unique, has expiration controls, and can only be used once for maximum security.
              </p>
            </div>
            
            <div className="glass-dark p-6 rounded-2xl border border-white/10 text-left">
              <h4 className="text-white font-semibold mb-3">Can I import existing guest lists?</h4>
              <p className="text-gray-400 text-sm">
                Yes! You can bulk import guests via CSV files. We provide templates and support various formats for easy data migration.
              </p>
            </div>
            
            <div className="glass-dark p-6 rounded-2xl border border-white/10 text-left">
              <h4 className="text-white font-semibold mb-3">What devices support the scanner?</h4>
              <p className="text-gray-400 text-sm">
                The scanner works on any device with a camera and modern web browser. No app installation required - just open in browser and scan.
              </p>
            </div>
            
            <div className="glass-dark p-6 rounded-2xl border border-white/10 text-left">
              <h4 className="text-white font-semibold mb-3">Can I export attendance reports?</h4>
              <p className="text-gray-400 text-sm">
                Absolutely! Export detailed attendance reports, guest lists, and analytics in CSV format for further analysis or record keeping.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <div className="glass-dark p-12 rounded-3xl border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Transform Your Events?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of event organizers who trust QR Events Pro for their professional event management needs.
            </p>
            <button
              onClick={() => handleUpgrade(selectedPlan)}
              className="inline-flex items-center space-x-2 px-8 py-4 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <Crown className="w-5 h-5" />
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-gray-400 text-sm mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
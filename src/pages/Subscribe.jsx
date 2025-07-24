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
  Headphones,
  Globe,
  Play,
  ArrowRight,
  LogOut
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
      description: 'Perfect for individuals getting started',
      icon: <Star className="w-6 h-6" />,
      color: 'from-blue-600 to-blue-800',
      features: [
        'Up to 5 projects',
        'Basic analytics',
        'Email support',
        '10GB storage',
        'Standard templates'
      ],
      limitations: [
        'No advanced features',
        'Limited integrations',
        'No priority support'
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      price: { monthly: 29, yearly: 290 },
      description: 'Best for growing businesses and teams',
      icon: <Crown className="w-6 h-6" />,
      color: 'from-red-600 to-red-800',
      popular: true,
      features: [
        'Unlimited projects',
        'Advanced analytics',
        'Priority support',
        '100GB storage',
        'Premium templates',
        'Team collaboration',
        'API access',
        'Custom integrations'
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
        'Dedicated support',
        'Custom solutions',
        'Unlimited storage',
        'Advanced security',
        'SLA guarantee',
        'White-label options',
        'Custom training'
      ],
      limitations: []
    }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast Performance',
      description: 'Optimized for speed and efficiency'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Enterprise Security',
      description: 'Bank-level security for your data'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Collaboration',
      description: 'Work together seamlessly'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Advanced Analytics',
      description: 'Deep insights into your performance'
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: '24/7 Support',
      description: 'Get help whenever you need it'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global CDN',
      description: 'Fast access from anywhere'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSubscribe = (planId) => {
    // Handle subscription logic here
    console.log(`Subscribing to ${planId} plan with ${billingCycle} billing`);
    // After successful subscription, redirect to dashboard
    // navigate('/dashboard');
  };

  const getDiscountPercent = () => {
    return billingCycle === 'yearly' ? 17 : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 netflix-gradient rounded-xl flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">YourApp</h1>
              <p className="text-xs text-gray-400">Choose Your Plan</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-white font-medium">{currentUser?.displayName || 'User'}</p>
              <p className="text-gray-400 text-sm">{currentUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Welcome to
            <span className="block netflix-gradient bg-clip-text text-transparent">
              YourApp Premium
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            You're just one step away from unlocking powerful features. 
            Choose a plan that fits your needs and start your journey today.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={billingCycle === 'yearly'}
                onChange={(e) => setBillingCycle(e.target.checked ? 'yearly' : 'monthly')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
            <span className={`font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                Save {getDiscountPercent()}%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative glass-dark p-8 rounded-3xl border transition-all duration-300 hover:scale-105 cursor-pointer ${
                selectedPlan === plan.id
                  ? 'border-red-600 ring-2 ring-red-600/20'
                  : 'border-white/10 hover:border-white/20'
              } ${plan.popular ? 'ring-2 ring-red-600/30' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-2 netflix-gradient rounded-full text-white text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                {plan.icon}
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">
                    ${plan.price[billingCycle]}
                  </span>
                  <span className="text-gray-400">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-green-400 text-sm">
                    Save ${(plan.price.monthly * 12) - plan.price.yearly} per year
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, limitIndex) => (
                  <div key={limitIndex} className="flex items-center space-x-3 opacity-50">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-gray-400">{limitation}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 ${
                  selectedPlan === plan.id
                    ? 'netflix-gradient hover:netflix-gradient-hover text-white shadow-lg'
                    : 'glass hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose YourApp?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join thousands of satisfied users who trust our platform for their business needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 text-center"
              >
                <div className="w-12 h-12 netflix-gradient rounded-xl flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ or Support */}
        <div className="text-center">
          <div className="glass-dark p-8 rounded-3xl border border-white/10 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Need Help Choosing?
            </h3>
            <p className="text-gray-400 mb-6">
              Our team is here to help you find the perfect plan for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 glass hover:bg-white/20 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 border border-white/20">
                Contact Sales
              </button>
              <button className="px-6 py-3 netflix-gradient hover:netflix-gradient-hover rounded-xl text-white font-medium transition-all duration-300 hover:scale-105">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
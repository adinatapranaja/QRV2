// src/pages/Landing.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Users, Shield, Zap } from 'lucide-react';

const Landing = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Built with modern technologies for optimal performance"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with Firebase backend"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Work together with role-based access control"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        </div>

        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 netflix-gradient rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">YourApp</span>
            </div>
            <Link
              to="/login"
              className="px-6 py-2 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className={`relative z-10 text-center max-w-4xl mx-auto px-6 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Welcome to the
            <span className="block netflix-gradient bg-clip-text text-transparent">
              Future of Apps
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Experience the next generation of web applications with modern design, 
            seamless authentication, and powerful features.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/login"
              className="px-8 py-4 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center space-x-2 group"
            >
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Get Started</span>
            </Link>
            
            <button className="px-8 py-4 glass-dark hover:bg-white/20 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 border border-white/20">
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span>10K+ Users</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-green-500" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">
              Built for Modern Teams
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover the features that make our platform the perfect choice for your next project
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`glass-dark p-8 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105 transform ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="netflix-gradient w-12 h-12 rounded-xl flex items-center justify-center mb-6">
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
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-dark p-12 rounded-3xl border border-white/10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already using our platform to build amazing applications.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 px-8 py-4 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
            >
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Start Your Journey</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>&copy; 2025 YourApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
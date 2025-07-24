// src/pages/Settings.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  User, 
  Bell, 
  Shield, 
  Settings as SettingsIcon, 
  Database,
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Lock,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const Settings = () => {
  const { currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    location: '',
    bio: '',
    website: ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    weeklyReports: true
  });

  const [applicationSettings, setApplicationSettings] = useState({
    darkMode: isDark,
    language: 'en',
    timezone: 'UTC',
    autoSave: true,
    soundEffects: true
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'application', label: 'Application', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> }
  ];

  const handleSave = (section) => {
    // Handle save logic here
    console.log(`Saving ${section} settings`);
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field, value) => {
    setSecurityData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field, value) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleApplicationChange = (field, value) => {
    setApplicationSettings(prev => ({ ...prev, [field]: value }));
    if (field === 'darkMode') {
      toggleTheme();
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="glass-dark p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Profile Picture
        </h3>
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/20">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <div>
            <button className="px-4 py-2 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 mb-2 block">
              Upload New Photo
            </button>
            <p className="text-gray-400 text-sm">JPG, PNG or GIF. Max size 2MB.</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="glass-dark p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={profileData.displayName}
              onChange={(e) => handleProfileChange('displayName', e.target.value)}
              className="w-full p-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="w-full pl-10 pr-3 py-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
                disabled
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                className="w-full pl-10 pr-3 py-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => handleProfileChange('location', e.target.value)}
                className="w-full pl-10 pr-3 py-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
                placeholder="City, Country"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-400 text-sm font-medium mb-2">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={profileData.website}
                onChange={(e) => handleProfileChange('website', e.target.value)}
                className="w-full pl-10 pr-3 py-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-400 text-sm font-medium mb-2">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              rows={3}
              className="w-full p-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300 resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
        <button
          onClick={() => handleSave('profile')}
          className="mt-4 px-6 py-2 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="glass-dark p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 glass rounded-xl">
              <div>
                <label className="text-white font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <p className="text-gray-400 text-sm">
                  {key === 'emailNotifications' && 'Receive notifications via email'}
                  {key === 'pushNotifications' && 'Receive push notifications in browser'}
                  {key === 'marketingEmails' && 'Receive promotional emails'}
                  {key === 'securityAlerts' && 'Important security notifications'}
                  {key === 'weeklyReports' && 'Weekly summary reports'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          ))}
        </div>
        <button
          onClick={() => handleSave('notifications')}
          className="mt-4 px-6 py-2 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="glass-dark p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Change Password
        </h3>
        <div className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="Current Password"
              value={securityData.currentPassword}
              onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
              className="w-full pl-10 pr-12 py-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={securityData.newPassword}
              onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
              className="w-full pl-10 pr-12 py-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={securityData.confirmPassword}
              onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
              className="w-full pl-10 pr-12 py-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button
          onClick={() => handleSave('security')}
          className="mt-4 px-6 py-2 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Update Password</span>
        </button>
      </div>

      {/* Two-Factor Authentication */}
      <div className="glass-dark p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Smartphone className="w-5 h-5 mr-2" />
          Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between p-4 glass rounded-xl">
          <div>
            <p className="text-white font-medium">Enable 2FA</p>
            <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securityData.twoFactorEnabled}
              onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderApplicationTab = () => (
    <div className="space-y-6">
      <div className="glass-dark p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2" />
          Application Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass rounded-xl">
            <div>
              <label className="text-white font-medium">Dark Mode</label>
              <p className="text-gray-400 text-sm">Switch between light and dark themes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={applicationSettings.darkMode}
                onChange={(e) => handleApplicationChange('darkMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <div className="p-4 glass rounded-xl">
            <label className="block text-white font-medium mb-2">Language</label>
            <select
              value={applicationSettings.language}
              onChange={(e) => handleApplicationChange('language', e.target.value)}
              className="w-full p-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </div>

          <div className="p-4 glass rounded-xl">
            <label className="block text-white font-medium mb-2">Timezone</label>
            <select
              value={applicationSettings.timezone}
              onChange={(e) => handleApplicationChange('timezone', e.target.value)}
              className="w-full p-3 glass-dark rounded-lg text-white border border-white/10 focus:border-red-600 focus:outline-none transition-all duration-300"
            >
              <option value="UTC">UTC</option>
              <option value="PST">Pacific Standard Time</option>
              <option value="EST">Eastern Standard Time</option>
              <option value="GMT">Greenwich Mean Time</option>
              <option value="JST">Japan Standard Time</option>
              <option value="WIB">Western Indonesian Time</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 glass rounded-xl">
            <div>
              <label className="text-white font-medium">Auto Save</label>
              <p className="text-gray-400 text-sm">Automatically save your work</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={applicationSettings.autoSave}
                onChange={(e) => handleApplicationChange('autoSave', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 glass rounded-xl">
            <div>
              <label className="text-white font-medium">Sound Effects</label>
              <p className="text-gray-400 text-sm">Enable audio feedback</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={applicationSettings.soundEffects}
                onChange={(e) => handleApplicationChange('soundEffects', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
        <button
          onClick={() => handleSave('application')}
          className="mt-4 px-6 py-2 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      {/* Export Data */}
      <div className="glass-dark p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Export Your Data
        </h3>
        <p className="text-gray-400 mb-4">
          Download a copy of your data for backup or transfer purposes.
        </p>
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Download Data</span>
        </button>
      </div>

      {/* Delete Account */}
      <div className="glass-dark p-6 rounded-2xl border border-red-600/30 bg-red-600/5">
        <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Danger Zone
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-xl">
            <h4 className="text-white font-medium mb-2">Delete Account</h4>
            <p className="text-gray-400 text-sm mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      case 'application':
        return renderApplicationTab();
      case 'data':
        return renderDataTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Sidebar />
      <Navbar />
      
      <main className="ml-64 pt-16 p-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-64 glass-dark p-4 rounded-2xl border border-white/10 h-fit">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                    activeTab === tab.id
                      ? 'netflix-gradient text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className={`${activeTab === tab.id ? 'scale-110' : ''} transition-transform`}>
                    {tab.icon}
                  </span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
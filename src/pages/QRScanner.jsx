// ===================================================
// UI/UX LAYOUT FIX - COMPLETE RESPONSIVE DESIGN (FIXED)
// ===================================================

// src/pages/QRScanner.jsx - FIXED UI/UX VERSION

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import { validateQRToken } from '../utils/crypto';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { showToast } from '../utils/toast';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Upload,
  Zap,
  Play,
  Square,
  RotateCcw,
  Info
} from 'lucide-react';

const QRScanner = () => {
  const { eventId } = useParams();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [event, setEvent] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const qrScanner = useRef(null);
  const fileInputRef = useRef(null);

  // Check camera support
  useEffect(() => {
    QrScanner.hasCamera().then(hasCamera => {
      console.log('📷 Camera available:', hasCamera);
      setHasCamera(hasCamera);
      if (!hasCamera) {
        setError('No camera found. Please use file upload.');
      }
    });
    
    return () => {
      stopScanner();
    };
  }, []);

  // Load event data
  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() });
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  // Start QR Scanner
  const startScanner = async () => {
    try {
      setError(null);
      setScanResult(null);
      
      if (!videoRef.current) {
        throw new Error('Video element not ready');
      }

      qrScanner.current = new QrScanner(
        videoRef.current,
        result => handleScanSuccess(result.data),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
        }
      );

      await qrScanner.current.start();
      setIsScanning(true);
      showToast('📷 QR Scanner started!', 'success');
      
    } catch (error) {
      console.error('❌ Scanner start error:', error);
      setError(error.message);
      showToast(`Scanner error: ${error.message}`, 'error');
    }
  };

  // Stop QR Scanner
  const stopScanner = () => {
    try {
      if (qrScanner.current) {
        qrScanner.current.stop();
        qrScanner.current.destroy();
        qrScanner.current = null;
      }
      setIsScanning(false);
      setScanResult(null);
      showToast('📷 Scanner stopped', 'info');
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  // Handle successful scan
  const handleScanSuccess = async (qrData) => {
    if (processing) return;
    
    console.log('🎯 QR Code scanned:', qrData);
    setProcessing(true);
    setScanCount(prev => prev + 1);
    
    if (qrScanner.current) {
      qrScanner.current.pause();
    }

    try {
      // Parse QR data with multiple strategies
      let tokenData = null;

      // Strategy 1: Direct token validation
      try {
        tokenData = validateQRToken(qrData);
      } catch (e) {
        console.log('Direct validation failed:', e.message);
      }

      // Strategy 2: JSON parsing
      if (!tokenData) {
        try {
          const parsedData = JSON.parse(qrData);
          if (parsedData.token) {
            tokenData = validateQRToken(parsedData.token);
          }
        } catch (e) {
          console.log('JSON parsing failed:', e.message);
        }
      }

      // Strategy 3: Simple test data
      if (!tokenData && qrData.includes('test')) {
        setScanResult({
          success: false,
          type: 'test_qr',
          message: 'Test QR Code detected',
          debug: {
            data: qrData,
            note: 'This is a test QR code. Generate a proper QR code for this event.'
          }
        });
        return;
      }

      // If no valid token found
      if (!tokenData) {
        setScanResult({
          success: false,
          type: 'invalid_format',
          message: 'QR code format not recognized',
          debug: {
            scannedData: qrData,
            dataLength: qrData.length,
            suggestion: 'Make sure this is a QR Events QR code'
          }
        });
        return;
      }

      // Validate event ID
      if (tokenData.eventId !== eventId) {
        setScanResult({
          success: false,
          type: 'wrong_event',
          message: 'QR code is for a different event'
        });
        return;
      }

      // Process guest check-in
      await processGuestCheckIn(tokenData);

    } catch (error) {
      console.error('❌ Scan processing error:', error);
      setScanResult({
        success: false,
        type: 'processing_error',
        message: error.message || 'Failed to process QR code'
      });
      showToast(error.message, 'error');
    } finally {
      // Resume scanning after delay
      setTimeout(() => {
        setProcessing(false);
        setScanResult(null);
        if (qrScanner.current && isScanning) {
          qrScanner.current.start();
        }
      }, 3000);
    }
  };

  // Process guest check-in
  const processGuestCheckIn = async (tokenData) => {
    try {
      const guestRef = doc(db, 'events', eventId, 'guests', tokenData.guestId);
      const guestDoc = await getDoc(guestRef);
      
      if (!guestDoc.exists()) {
        throw new Error('Guest not found in database');
      }
      
      const guestData = guestDoc.data();
      
      if (guestData.checkedIn) {
        setScanResult({
          success: false,
          type: 'already_checked_in',
          message: `${guestData.name} is already checked in`,
          guest: guestData,
          timestamp: guestData.checkInTime
        });
        showToast(`${guestData.name} already checked in`, 'warning');
        return;
      }
      
      const checkInTime = new Date().toISOString();
      await updateDoc(guestRef, {
        checkedIn: true,
        checkInTime: checkInTime,
        checkInMethod: 'qr_scanner_v2'
      });
      
      setScanResult({
        success: true,
        type: 'checked_in',
        message: `${guestData.name} checked in successfully!`,
        guest: guestData,
        timestamp: checkInTime
      });
      
      showToast(`✅ ${guestData.name} checked in!`, 'success');
      
    } catch (error) {
      throw new Error(`Guest check-in failed: ${error.message}`);
    }
  };

  // File upload fallback
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setProcessing(true);
      console.log('📁 Scanning uploaded file...');
      
      const result = await QrScanner.scanImage(file);
      console.log('📁 File scan result:', result);
      
      await handleScanSuccess(result);
      
    } catch (error) {
      console.error('❌ File scan error:', error);
      setScanResult({
        success: false,
        type: 'file_error',
        message: 'Could not scan QR code from image'
      });
      showToast('File scan failed', 'error');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Generate test QR data
  const generateTestData = () => {
    const testData = {
      app: "qr-events",
      eventId: eventId,
      guestId: "test-guest-123",
      token: `test-${eventId}-${Date.now()}`,
      timestamp: Date.now()
    };
    
    console.log('🧪 Test QR Data:', JSON.stringify(testData));
    setScanResult({
      success: false,
      type: 'test_data',
      message: 'Test QR data generated',
      debug: {
        instructions: [
          '1. Copy JSON data from browser console',
          '2. Go to qr-code-generator.com',
          '3. Paste the JSON data',
          '4. Generate and download QR code',
          '5. Upload the image using "Upload" button'
        ],
        testData: JSON.stringify(testData, null, 2)
      }
    });
    
    showToast('Test data generated - check console', 'info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="flex">
        {/* Sidebar - Fixed position and proper z-index */}
        <div className="hidden lg:block fixed top-0 left-0 h-full z-40">
          <Sidebar />
        </div>
        
        {/* Main Content - Properly offset by sidebar width */}
        <div className="flex-1 lg:ml-64">
          {/* Navbar - Fixed and properly positioned */}
          <div className="fixed top-0 right-0 left-0 lg:left-64 z-30">
            <Navbar />
          </div>
          
          {/* Content Container with Proper Spacing */}
          <main className="pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 pb-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                {/* Left: Title & Back Button */}
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => window.history.back()}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-target"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-3">
                      <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                      <span>QR Scanner</span>
                    </h1>
                    {event && (
                      <p className="text-gray-400 mt-1 text-sm sm:text-base">
                        {event.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  {/* File Upload Button */}
                  <label className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600/20 text-purple-400 
                                  hover:bg-purple-600/30 rounded-lg transition-all duration-300 cursor-pointer touch-target">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Image</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  
                  {/* Test Button */}
                  <button
                    onClick={generateTestData}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600/20 text-blue-400 
                             hover:bg-blue-600/30 rounded-lg transition-all duration-300 touch-target"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">Test QR</span>
                  </button>
                  
                  {/* Scanner Toggle Button */}
                  {hasCamera && (
                    !isScanning ? (
                      <button
                        onClick={startScanner}
                        className="flex items-center justify-center space-x-2 px-6 py-2.5 netflix-gradient 
                                 hover:netflix-gradient-hover rounded-lg text-white font-semibold 
                                 transition-all duration-300 touch-target"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Scanner</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopScanner}
                        className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-red-600/20 text-red-400 
                                 hover:bg-red-600/30 rounded-lg transition-all duration-300 touch-target"
                      >
                        <Square className="w-4 h-4" />
                        <span>Stop Scanner</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                {/* Scanner Area - Takes 2 columns on xl screens */}
                <div className="xl:col-span-2">
                  <div className="glass-dark p-6 sm:p-8 rounded-2xl border border-white/10">
                    {/* Scanner Header */}
                    <div className="flex items-center justify-center mb-6">
                      <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center space-x-3">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                        <span>Camera Scanner</span>
                      </h2>
                    </div>
                    
                    {/* Scanner Container */}
                    <div className="relative">
                      {/* Video Element */}
                      <video
                        ref={videoRef}
                        className={`w-full max-w-md mx-auto rounded-xl shadow-lg ${
                          isScanning ? 'block' : 'hidden'
                        }`}
                        style={{ aspectRatio: '1 / 1' }}
                      />
                      
                      {/* Initial State */}
                      {!isScanning && !scanResult && !error && (
                        <div className="text-center py-12 sm:py-16">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-600/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                            <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg sm:text-xl text-white mb-2 font-semibold">QR Scanner Ready</h3>
                          <p className="text-gray-400 mb-6 text-sm sm:text-base px-4">
                            Start camera scanning or upload an image with QR code
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                            {hasCamera && (
                              <button
                                onClick={startScanner}
                                className="flex items-center justify-center space-x-2 px-6 py-3 netflix-gradient 
                                         hover:netflix-gradient-hover rounded-xl text-white font-semibold 
                                         transition-all duration-300 touch-target"
                              >
                                <Camera className="w-5 h-5" />
                                <span>Start Camera</span>
                              </button>
                            )}
                            
                            <label className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 
                                            hover:bg-purple-700 rounded-xl text-white font-semibold 
                                            transition-all duration-300 cursor-pointer touch-target">
                              <Upload className="w-5 h-5" />
                              <span>Upload Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                      
                      {/* Error State */}
                      {error && (
                        <div className="text-center py-12 sm:py-16">
                          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-400" />
                          </div>
                          <h3 className="text-lg sm:text-xl text-red-400 mb-2 font-semibold">Scanner Error</h3>
                          <p className="text-gray-400 mb-6 px-4 text-sm sm:text-base">{error}</p>
                          <button
                            onClick={() => setError(null)}
                            className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600/20 text-red-400 
                                     hover:bg-red-600/30 rounded-lg transition-all duration-300 mx-auto touch-target"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Try Again</span>
                          </button>
                        </div>
                      )}
                      
                      {/* Processing Overlay */}
                      {processing && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl 
                                      flex items-center justify-center">
                          <div className="text-center">
                            <div className="loading-spinner mx-auto mb-4"></div>
                            <p className="text-white font-medium">Processing QR code...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scan Result */}
                    {scanResult && (
                      <div className="mt-6 sm:mt-8">
                        <ScanResultDisplay result={scanResult} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Panel - Sidebar */}
                <div className="space-y-6">
                  {/* Event Info Card */}
                  <div className="glass-dark p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-blue-400" />
                      Event Details
                    </h3>
                    
                    {event ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-400">Event Name</span>
                          <span className="text-white font-medium text-right">{event.name}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-400">Event ID</span>
                          <span className="text-white font-mono text-xs text-right break-all">{eventId}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="loading-spinner mx-auto mb-2"></div>
                        <p className="text-gray-400 text-sm">Loading event...</p>
                      </div>
                    )}
                  </div>

                  {/* Scanner Status Card */}
                  <div className="glass-dark p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <RefreshCw className="w-5 h-5 mr-2 text-purple-400" />
                      Scanner Status
                    </h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Library</span>
                        <span className="text-green-400 font-medium">qr-scanner v2</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Camera</span>
                        <span className={`font-medium ${hasCamera ? 'text-green-400' : 'text-red-400'}`}>
                          {hasCamera ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className={`font-medium ${isScanning ? 'text-green-400' : 'text-gray-400'}`}>
                          {isScanning ? 'Scanning' : 'Stopped'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Scans</span>
                        <span className="text-white font-medium">{scanCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tips Card */}
                  <div className="glass-dark p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      💡 Scanning Tips
                    </h3>
                    <ul className="text-sm text-gray-400 space-y-2">
                      <li>• Use "Test QR" to generate sample data</li>
                      <li>• Upload image if camera doesn't work</li>
                      <li>• Ensure good lighting for camera</li>
                      <li>• Hold QR code steady in frame</li>
                      <li>• Check browser permissions</li>
                      <li>• Try different QR code formats</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Enhanced Scan Result Display Component
const ScanResultDisplay = ({ result }) => {
  const getIcon = () => {
    switch (result.type) {
      case 'checked_in': return <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-400" />;
      case 'already_checked_in': return <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400" />;
      case 'test_data': case 'test_qr': return <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />;
      default: return <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400" />;
    }
  };

  const getColors = () => {
    switch (result.type) {
      case 'checked_in': return { bg: 'bg-green-600/20 border-green-600/30', text: 'text-green-400' };
      case 'already_checked_in': return { bg: 'bg-yellow-600/20 border-yellow-600/30', text: 'text-yellow-400' };
      case 'test_data': case 'test_qr': return { bg: 'bg-blue-600/20 border-blue-600/30', text: 'text-blue-400' };
      default: return { bg: 'bg-red-600/20 border-red-600/30', text: 'text-red-400' };
    }
  };

  const colors = getColors();

  return (
    <div className={`p-6 sm:p-8 rounded-2xl border text-center ${colors.bg}`}>
      <div className="mb-4">{getIcon()}</div>
      <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${colors.text}`}>
        {result.success ? 'Success!' : 
         result.type.includes('test') ? 'Test Mode' : 'Error'}
      </h3>
      <p className="text-white text-base sm:text-lg mb-4 px-2">{result.message}</p>
      
      {result.guest && (
        <div className="bg-black/20 rounded-lg p-4 mb-4">
          <p className="text-white font-semibold text-lg">{result.guest.name}</p>
          {result.guest.email && (
            <p className="text-gray-400 text-sm mt-1">{result.guest.email}</p>
          )}
          {result.timestamp && (
            <p className="text-gray-500 text-xs mt-2">
              {new Date(result.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {result.debug && (
        <details className="bg-black/30 rounded-lg p-4 mt-4 text-left">
          <summary className="text-white font-semibold mb-2 cursor-pointer text-sm">
            🐛 Debug Information
          </summary>
          <div className="space-y-2 text-xs text-gray-300">
            {Object.entries(result.debug).map(([key, value]) => (
              <div key={key}>
                <span className="text-gray-400 capitalize text-xs">{key.replace('_', ' ')}:</span>
                <pre className="font-mono bg-black/50 p-2 rounded mt-1 text-gray-300 overflow-auto text-xs">
                  {Array.isArray(value) ? value.join('\n') : String(value)}
                </pre>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default QRScanner;
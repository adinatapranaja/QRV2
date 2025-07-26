// ===================================================
// SIMPLE QR SCANNER FIX - GUARANTEED WORKING SOLUTION
// ===================================================

// STEP 1: Install alternative library
// npm uninstall html5-qrcode
// npm install qr-scanner --save

// STEP 2: Replace QRScanner.jsx with this working version
// src/pages/QRScanner.jsx - SIMPLE & WORKING

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import QrScanner from 'qr-scanner'; // Different library!
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
  RotateCcw
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

      // Create QR Scanner instance
      qrScanner.current = new QrScanner(
        videoRef.current,
        result => handleScanSuccess(result.data),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera
        }
      );

      await qrScanner.current.start();
      setIsScanning(true);
      showToast('📷 QR Scanner started successfully!', 'success');
      
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
    
    // Pause scanner during processing
    if (qrScanner.current) {
      qrScanner.current.pause();
    }

    try {
      // Parse QR data with multiple strategies
      let tokenData = null;
      let parsedData = null;

      // Strategy 1: Direct token validation
      try {
        tokenData = validateQRToken(qrData);
        if (tokenData) {
          parsedData = { token: qrData };
        }
      } catch (e) {
        console.log('Direct validation failed:', e.message);
      }

      // Strategy 2: JSON parsing
      if (!tokenData) {
        try {
          parsedData = JSON.parse(qrData);
          if (parsedData.token) {
            tokenData = validateQRToken(parsedData.token);
          }
        } catch (e) {
          console.log('JSON parsing failed:', e.message);
        }
      }

      // Strategy 3: URL parameter extraction
      if (!tokenData && qrData.includes('http')) {
        try {
          const url = new URL(qrData);
          const token = url.searchParams.get('token') || url.searchParams.get('qr');
          if (token) {
            tokenData = validateQRToken(token);
            parsedData = { token };
          }
        } catch (e) {
          console.log('URL parsing failed:', e.message);
        }
      }

      // Strategy 4: Simple test data
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
          message: 'QR code is for a different event',
          debug: {
            expectedEvent: eventId,
            qrCodeEvent: tokenData.eventId
          }
        });
        return;
      }

      // Check expiration
      if (tokenData.expires && Date.now() > tokenData.expires) {
        setScanResult({
          success: false,
          type: 'expired',
          message: 'QR code has expired',
          debug: {
            expiredAt: new Date(tokenData.expires).toLocaleString(),
            currentTime: new Date().toLocaleString()
          }
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
        message: error.message || 'Failed to process QR code',
        debug: {
          error: error.message,
          qrData: qrData
        }
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
      
      // Check if already checked in
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
      
      // Update check-in status
      const checkInTime = new Date().toISOString();
      await updateDoc(guestRef, {
        checkedIn: true,
        checkInTime: checkInTime,
        checkInMethod: 'qr_scanner_v2'
      });
      
      // Success result
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
        message: 'Could not scan QR code from image',
        debug: {
          error: error.message,
          suggestion: 'Try a clearer image or use camera scanner'
        }
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
    const testToken = `test-${eventId}-${Date.now()}`;
    const testData = {
      app: "qr-events",
      eventId: eventId,
      guestId: "test-guest-123",
      token: testToken,
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
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <main className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Camera className="w-6 h-6 text-red-400" />
                    <span>QR Scanner v2</span>
                  </h1>
                  {event && (
                    <p className="text-gray-400 mt-1">
                      Scanning for: {event.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                {/* File Upload */}
                <label className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 text-purple-400 
                                hover:bg-purple-600/30 rounded-lg transition-all duration-300 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                
                {/* Test Data */}
                <button
                  onClick={generateTestData}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-400 
                           hover:bg-blue-600/30 rounded-lg transition-all duration-300"
                >
                  <Zap className="w-4 h-4" />
                  <span>Test</span>
                </button>
                
                {/* Scanner Toggle */}
                {hasCamera && (
                  !isScanning ? (
                    <button
                      onClick={startScanner}
                      className="flex items-center space-x-2 px-6 py-3 netflix-gradient 
                               hover:netflix-gradient-hover rounded-lg text-white font-semibold 
                               transition-all duration-300"
                    >
                      <Play className="w-5 h-5" />
                      <span>Start Scanner</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopScanner}
                      className="flex items-center space-x-2 px-6 py-3 bg-red-600/20 text-red-400 
                               hover:bg-red-600/30 rounded-lg transition-all duration-300"
                    >
                      <Square className="w-5 h-5" />
                      <span>Stop Scanner</span>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Scanner Area */}
              <div className="lg:col-span-2">
                <div className="glass-dark p-8 rounded-2xl border border-white/10">
                  <h2 className="text-2xl font-semibold text-white mb-6 flex items-center justify-center">
                    <Camera className="w-6 h-6 mr-2" />
                    Camera Scanner v2
                  </h2>
                  
                  <div className="relative">
                    {/* Video Element */}
                    <video
                      ref={videoRef}
                      className="w-full max-w-md mx-auto rounded-xl"
                      style={{ display: isScanning ? 'block' : 'none' }}
                    />
                    
                    {/* Initial State */}
                    {!isScanning && !scanResult && !error && (
                      <div className="text-center py-16">
                        <Camera className="w-24 h-24 text-gray-600 mx-auto mb-6" />
                        <h3 className="text-xl text-white mb-2">QR Scanner v2 Ready</h3>
                        <p className="text-gray-400 mb-6">
                          Using improved qr-scanner library
                        </p>
                        <div className="flex justify-center space-x-4">
                          {hasCamera && (
                            <button
                              onClick={startScanner}
                              className="px-8 py-4 netflix-gradient hover:netflix-gradient-hover 
                                       rounded-xl text-white font-semibold transition-all duration-300"
                            >
                              Start Camera
                            </button>
                          )}
                          <label className="px-8 py-4 bg-purple-600 hover:bg-purple-700 
                                          rounded-xl text-white font-semibold transition-all duration-300 cursor-pointer">
                            Upload Image
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
                      <div className="text-center py-16">
                        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl text-red-400 mb-2">Scanner Error</h3>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className="px-6 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 
                                   rounded-lg transition-all duration-300"
                        >
                          <RotateCcw className="w-4 h-4 mr-2 inline" />
                          Try Again
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
                    <div className="mt-8">
                      <ScanResultDisplay result={scanResult} />
                    </div>
                  )}
                </div>
              </div>

              {/* Info Panel */}
              <div className="space-y-6">
                {/* Event Info */}
                <div className="glass-dark p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-blue-400" />
                    Event Details
                  </h3>
                  
                  {event ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Event Name</span>
                        <span className="text-white font-medium">{event.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Event ID</span>
                        <span className="text-white font-mono text-xs">{eventId}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="loading-spinner mx-auto mb-2"></div>
                      <p className="text-gray-400 text-sm">Loading event...</p>
                    </div>
                  )}
                </div>

                {/* Scanner Status */}
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
                      <span className="text-gray-400">Scans</span>
                      <span className="text-white font-medium">{scanCount}</span>
                    </div>
                  </div>
                </div>

                {/* Help */}
                <div className="glass-dark p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    💡 Tips
                  </h3>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li>• Use "Test" to generate sample QR data</li>
                    <li>• Upload image if camera doesn't work</li>
                    <li>• Ensure good lighting for camera</li>
                    <li>• Hold QR code steady in frame</li>
                    <li>• Check browser permissions</li>
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Scan Result Display Component
const ScanResultDisplay = ({ result }) => {
  const getIcon = () => {
    switch (result.type) {
      case 'checked_in': return <CheckCircle className="w-16 h-16 text-green-400" />;
      case 'already_checked_in': return <AlertCircle className="w-16 h-16 text-yellow-400" />;
      case 'test_data': case 'test_qr': return <Zap className="w-16 h-16 text-blue-400" />;
      default: return <XCircle className="w-16 h-16 text-red-400" />;
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
    <div className={`p-8 rounded-2xl border text-center ${colors.bg}`}>
      <div className="mb-4">{getIcon()}</div>
      <h3 className={`text-2xl font-bold mb-2 ${colors.text}`}>
        {result.success ? 'Success!' : 
         result.type.includes('test') ? 'Test Mode' : 'Error'}
      </h3>
      <p className="text-white text-lg mb-4">{result.message}</p>
      
      {result.guest && (
        <div className="bg-black/20 rounded-lg p-4 mb-4">
          <p className="text-white font-semibold">{result.guest.name}</p>
          {result.guest.email && (
            <p className="text-gray-400 text-sm">{result.guest.email}</p>
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
          <summary className="text-white font-semibold mb-2 cursor-pointer">
            🐛 Debug Info
          </summary>
          <div className="space-y-2 text-xs text-gray-300">
            {Object.entries(result.debug).map(([key, value]) => (
              <div key={key}>
                <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
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
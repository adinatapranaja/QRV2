// src/pages/QRScanner.jsx - FIXED GUEST PROCESSING
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
  Info,
  Menu
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
      let tokenData = null;
      
      // Try direct validation first
      try {
        tokenData = validateQRToken(qrData);
        console.log('✅ Direct token validation successful:', tokenData);
      } catch (validationError) {
        console.log('Direct validation failed:', validationError.message);
      }

      // If direct validation fails, try parsing as JSON
      if (!tokenData) {
        try {
          const jsonData = JSON.parse(qrData);
          console.log('📋 Parsed JSON data:', jsonData);
          
          if (jsonData.token) {
            tokenData = validateQRToken(jsonData.token);
            console.log('✅ JSON token validation successful:', tokenData);
          } else if (jsonData.app === 'qr-events' && jsonData.eventId && jsonData.guestId) {
            // Handle direct QR data format
            tokenData = {
              eventId: jsonData.eventId,
              guestId: jsonData.guestId,
              expires: jsonData.expires || Date.now() + (24 * 60 * 60 * 1000) // 24 hours default
            };
            console.log('✅ Direct QR data format:', tokenData);
          }
        } catch (parseError) {
          console.log('JSON parsing failed:', parseError.message);
        }
      }

      // Handle test QR codes
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
        setProcessing(false);
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
            suggestion: 'Make sure this is a QR Events QR code',
            possibleFormats: [
              'Encrypted token string',
              'JSON with token field',
              'Direct QR Events format'
            ]
          }
        });
        setProcessing(false);
        return;
      }

      // Validate event ID
      if (tokenData.eventId !== eventId) {
        setScanResult({
          success: false,
          type: 'wrong_event',
          message: `QR code is for event "${tokenData.eventId}", but current event is "${eventId}"`,
          debug: {
            scannedEventId: tokenData.eventId,
            currentEventId: eventId
          }
        });
        setProcessing(false);
        return;
      }

      // Check token expiration
      if (tokenData.expires && Date.now() > tokenData.expires) {
        setScanResult({
          success: false,
          type: 'expired_token',
          message: 'QR code has expired',
          debug: {
            expiredAt: new Date(tokenData.expires).toLocaleString(),
            currentTime: new Date().toLocaleString()
          }
        });
        setProcessing(false);
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
          stack: error.stack?.substring(0, 200)
        }
      });
      showToast(error.message, 'error');
      setProcessing(false);
    }
  };

  // Process guest check-in - FIXED VERSION
  const processGuestCheckIn = async (tokenData) => {
    try {
      console.log('🔍 Processing guest check-in for:', tokenData);
      
      // Get guest document from Firestore
      const guestRef = doc(db, 'events', eventId, 'guests', tokenData.guestId);
      const guestDoc = await getDoc(guestRef);
      
      if (!guestDoc.exists()) {
        throw new Error(`Guest with ID "${tokenData.guestId}" not found in event "${eventId}"`);
      }
      
      const guestData = guestDoc.data();
      console.log('👤 Guest data loaded:', guestData);
      
      // Check if already checked in
      if (guestData.checkedIn) {
        setScanResult({
          success: false,
          type: 'already_checked_in',
          message: `${guestData.name} is already checked in`,
          guest: {
            id: tokenData.guestId,
            name: guestData.name,
            email: guestData.email,
            category: guestData.category,
            company: guestData.company,
            phone: guestData.phone
          },
          timestamp: guestData.checkInTime,
          debug: {
            guestId: tokenData.guestId,
            previousCheckIn: guestData.checkInTime,
            checkInMethod: guestData.checkInMethod || 'unknown'
          }
        });
        showToast(`${guestData.name} already checked in`, 'warning');
        setProcessing(false);
        return;
      }
      
      // Perform check-in
      const checkInTime = new Date().toISOString();
      const updateData = {
        checkedIn: true,
        checkInTime: checkInTime,
        checkInMethod: 'qr_scanner_v2',
        scanCount: (guestData.scanCount || 0) + 1
      };
      
      await updateDoc(guestRef, updateData);
      console.log('✅ Guest checked in successfully:', updateData);
      
      // Show success result
      setScanResult({
        success: true,
        type: 'checked_in',
        message: `${guestData.name} checked in successfully!`,
        guest: {
          id: tokenData.guestId,
          name: guestData.name,
          email: guestData.email,
          category: guestData.category,
          company: guestData.company,
          phone: guestData.phone
        },
        timestamp: checkInTime,
        debug: {
          guestId: tokenData.guestId,
          checkInTime: checkInTime,
          eventId: tokenData.eventId,
          scannerVersion: 'v2.0'
        }
      });
      
      showToast(`✅ ${guestData.name} checked in!`, 'success');
      
    } catch (error) {
      console.error('❌ Guest check-in error:', error);
      throw new Error(`Guest check-in failed: ${error.message}`);
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

  // Reset scanner
  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    if (qrScanner.current && !isScanning) {
      qrScanner.current.start();
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
      setProcessing(false);
    } finally {
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
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
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

  // Scan Result Component
  const ScanResultDisplay = ({ result }) => (
    <div className={`p-6 rounded-xl text-center border ${
      result.success 
        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      <div className="flex justify-center mb-4">
        {result.success ? (
          <CheckCircle className="w-12 h-12 text-green-400" />
        ) : (
          <XCircle className="w-12 h-12 text-red-400" />
        )}
      </div>
      
      <h3 className="text-xl font-bold mb-2">
        {result.success ? "Success!" : result.type === "test_data" ? "Test Mode" : "Error"}
      </h3>
      
      <p className="text-white text-base sm:text-lg mb-4 px-2">
        {result.message}
      </p>
      
      {result.guest && (
        <div className="bg-black/20 rounded-lg p-4 mb-4">
          <p className="text-white font-semibold text-lg">{result.guest.name}</p>
          {result.guest.email && (
            <p className="text-gray-400 text-sm mt-1">{result.guest.email}</p>
          )}
          {result.guest.category && (
            <p className="text-blue-400 text-sm mt-1">Category: {result.guest.category}</p>
          )}
          {result.guest.company && (
            <p className="text-gray-400 text-sm mt-1">Company: {result.guest.company}</p>
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
                <span className="text-gray-400 capitalize text-xs">
                  {key.replace('_', ' ')}:
                </span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:z-30
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>
      
      {/* Main Content Container */}
      <div className="lg:ml-64 min-h-screen">
        {/* Mobile Navbar with hamburger */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
          <div className="bg-black/90 backdrop-blur-lg border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-white font-semibold">QR Scanner</h1>
              <div className="w-9" /> {/* Spacer for centering */}
            </div>
          </div>
        </div>

        {/* Desktop Navbar */}
        <div className="hidden lg:block fixed top-0 left-64 right-0 z-20">
          <Navbar />
        </div>
        
        {/* Content */}
        <main className="pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          {/* Header Section */}
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              {/* Left: Title & Back Button */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors touch-target"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">QR Scanner</h1>
                  <p className="text-gray-400 text-sm sm:text-base mt-1">
                    Scan QR codes for event check-in
                  </p>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {/* Test QR Button */}
                <button
                  onClick={generateTestData}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600/20 text-blue-400 
                           hover:bg-blue-600/30 rounded-lg transition-all duration-300 touch-target flex-1 sm:flex-initial"
                >
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Test QR</span>
                  <span className="sm:hidden">Test</span>
                </button>

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600/20 text-purple-400 
                           hover:bg-purple-600/30 rounded-lg transition-all duration-300 touch-target flex-1 sm:flex-initial"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload Image</span>
                  <span className="sm:hidden">Upload</span>
                </button>

                {/* Start/Stop Scanner Button */}
                <div className="flex-1 sm:flex-initial">
                  {!isScanning ? (
                    <button
                      onClick={startScanner}
                      disabled={!hasCamera}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 netflix-gradient 
                               hover:netflix-gradient-hover disabled:bg-gray-600/20 disabled:text-gray-500
                               rounded-lg text-white font-semibold transition-all duration-300 touch-target w-full"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Scanner</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopScanner}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600/20 text-red-400 
                               hover:bg-red-600/30 rounded-lg transition-all duration-300 touch-target w-full"
                    >
                      <Square className="w-4 h-4" />
                      <span>Stop Scanner</span>
                    </button>
                  )}
                </div>
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
                      playsInline
                      muted
                    />
                    
                    {/* Placeholder when not scanning */}
                    {!isScanning && (
                      <div className="w-full max-w-md mx-auto aspect-square bg-black/30 border-2 border-dashed border-white/20 
                                    rounded-xl flex flex-col items-center justify-center text-center p-8">
                        <Camera className="w-16 h-16 text-gray-500 mb-4" />
                        <h3 className="text-white font-semibold text-lg mb-2">QR Scanner Ready</h3>
                        <p className="text-gray-400 text-sm mb-6">
                          Start camera scanning or upload an image with QR code
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="space-y-3 w-full max-w-xs">
                          {hasCamera && (
                            <button
                              onClick={startScanner}
                              className="w-full flex items-center justify-center space-x-2 px-6 py-3 netflix-gradient 
                                       hover:netflix-gradient-hover rounded-lg text-white font-semibold 
                                       transition-all duration-300 touch-target"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Start Camera</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600/20 text-purple-400 
                                     hover:bg-purple-600/30 rounded-lg transition-all duration-300 touch-target"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload Image</span>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Error Display */}
                    {error && (
                      <div className="absolute top-4 left-4 right-4 bg-red-500/20 border border-red-500/30 
                                    rounded-lg p-4 text-center backdrop-blur-sm">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <span className="text-red-400 font-semibold">Camera Error</span>
                        </div>
                        <p className="text-white text-sm">{error}</p>
                        <button
                          onClick={resetScanner}
                          className="mt-3 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 
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

                {/* Scanning Tips */}
                <div className="glass-dark p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
                    Scanning Tips
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Use "Test QR" to generate sample data</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Upload image if camera doesn't work</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Ensure good lighting for camera</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Hold QR code steady in frame</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Check browser permissions</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Try different QR code formats</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default QRScanner;
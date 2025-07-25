// src/pages/QRScanner.jsx - FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  doc, 
  updateDoc, 
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { validateQRToken, parseQRData } from '../utils/crypto';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
  Clock,
  Shield,
  Zap,
  BarChart3,
  Bug,
  Home
} from 'lucide-react';

const QRScannerPage = () => {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingResult, setProcessingResult] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [eventIdError, setEventIdError] = useState(null);
  const html5QrCodeScannerRef = useRef(null);

  // Get Event ID from multiple sources
  const getEventId = () => {
    if (paramEventId) return paramEventId;
    const pathMatch = location.pathname.match(/\/events\/([^\/]+)/);
    if (pathMatch) return pathMatch[1];
    const urlParams = new URLSearchParams(location.search);
    const queryEventId = urlParams.get('eventId');
    if (queryEventId) return queryEventId;
    const storedEventId = localStorage.getItem('currentEventId');
    if (storedEventId) return storedEventId;
    if (window.EMERGENCY_EVENT_ID) return window.EMERGENCY_EVENT_ID;
    return null;
  };

  const actualEventId = getEventId();

  useEffect(() => {
    if (!actualEventId) {
      setEventIdError('No Event ID found in URL. Please navigate from Events page.');
      setLoading(false);
      return;
    }
    localStorage.setItem('currentEventId', actualEventId);
    setEventIdError(null);
  }, [paramEventId, location, actualEventId]);

  useEffect(() => {
    const loadEvent = async () => {
      if (!actualEventId) return;
      try {
        const eventDoc = await getDoc(doc(db, 'events', actualEventId));
        if (eventDoc.exists()) {
          const eventData = { id: eventDoc.id, ...eventDoc.data() };
          setEvent(eventData);
        } else {
          throw new Error('Event not found');
        }
        setLoading(false);
      } catch (error) {
        setEventIdError(`Failed to load event: ${error.message}`);
        setLoading(false);
      }
    };
    loadEvent();
  }, [actualEventId]);

  useEffect(() => {
    return () => {
      if (html5QrCodeScannerRef.current) {
        try {
          html5QrCodeScannerRef.current.clear();
        } catch (error) {}
        html5QrCodeScannerRef.current = null;
      }
    };
  }, []);

  const cleanupScanner = () => {
    if (html5QrCodeScannerRef.current) {
      try {
        html5QrCodeScannerRef.current.clear();
      } catch (error) {}
      html5QrCodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = () => {
    if (!actualEventId) {
      alert('Cannot start scanner: No Event ID found.');
      return;
    }
    cleanupScanner();
    const container = document.getElementById('qr-scanner-container');
    if (!container) {
      setTimeout(startScanner, 500);
      return;
    }
    try {
      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2
        },
        false
      );
      scanner.render(
        (decodedText, decodedResult) => {
          handleScanSuccess(decodedText, decodedResult);
        },
        (error) => {}
      );
      html5QrCodeScannerRef.current = scanner;
      setScanning(true);
    } catch (error) {
      alert('Failed to start camera. Please check permissions and try again.');
    }
  };

  const stopScanner = () => {
    cleanupScanner();
  };

  const handleScanSuccess = async (decodedText, decodedResult) => {
    if (processingResult) return;
    setProcessingResult(true);
    cleanupScanner();
    const debug = {
      rawData: decodedText,
      currentEventId: actualEventId,
      timestamp: new Date().toISOString(),
      steps: []
    };
    try {
      debug.steps.push({ step: 1, action: 'Parsing QR data', status: 'start' });
      const qrData = parseQRData(decodedText);
      if (!qrData) {
        debug.steps.push({ step: 1, action: 'Parsing QR data', status: 'failed', error: 'Invalid QR format' });
        throw new Error('Invalid QR code format');
      }
      debug.steps.push({ step: 1, action: 'Parsing QR data', status: 'success', data: qrData });
      debug.qrData = qrData;
      debug.steps.push({ step: 2, action: 'Validating token', status: 'start' });
      const tokenData = validateQRToken(qrData.token);
      if (!tokenData) {
        debug.steps.push({ step: 2, action: 'Validating token', status: 'failed', error: 'Token validation failed' });
        throw new Error('Invalid or expired QR token');
      }
      debug.steps.push({ step: 2, action: 'Validating token', status: 'success', data: tokenData });
      debug.tokenData = tokenData;
      debug.steps.push({ step: 3, action: 'Verifying event ID', status: 'start' });
      const tokenEventId = String(tokenData.eventId || '').trim();
      const currentEventIdStr = String(actualEventId || '').trim();
      debug.comparison = {
        tokenEventId,
        currentEventId: currentEventIdStr,
        match: tokenEventId === currentEventIdStr,
        tokenType: typeof tokenEventId,
        currentType: typeof currentEventIdStr,
        tokenLength: tokenEventId.length,
        currentLength: currentEventIdStr.length
      };
      if (tokenEventId !== currentEventIdStr) {
        debug.steps.push({ 
          step: 3, 
          action: 'Verifying event ID', 
          status: 'failed', 
          error: `Event ID mismatch: token="${tokenEventId}" vs current="${currentEventIdStr}"` 
        });
        setDebugInfo(debug);
        throw new Error(`QR code is for event "${tokenEventId}" but scanner is for event "${currentEventIdStr}"`);
      }
      debug.steps.push({ step: 3, action: 'Verifying event ID', status: 'success' });
      debug.steps.push({ step: 4, action: 'Finding guest', status: 'start' });
      const guestRef = doc(db, 'events', actualEventId, 'guests', tokenData.guestId);
      const guestDoc = await getDoc(guestRef);
      if (!guestDoc.exists()) {
        debug.steps.push({ step: 4, action: 'Finding guest', status: 'failed', error: 'Guest not found' });
        throw new Error('Guest not found');
      }
      const guestData = guestDoc.data();
      debug.steps.push({ step: 4, action: 'Finding guest', status: 'success', guest: guestData });
      debug.guestData = guestData;
      debug.steps.push({ step: 5, action: 'Checking status', status: 'start' });
      if (guestData.checkedIn) {
        debug.steps.push({ step: 5, action: 'Checking status', status: 'already_checked_in' });
        setScanResult({
          success: false,
          type: 'already_checked_in',
          message: `${guestData.name} has already been checked in`,
          guest: guestData,
          timestamp: new Date().toISOString(),
          debug: debugMode ? debug : null
        });
      } else {
        debug.steps.push({ step: 6, action: 'Checking in guest', status: 'start' });
        await updateDoc(guestRef, {
          checkedIn: true,
          checkInTime: new Date().toISOString(),
          checkedInBy: currentUser.uid,
          qrTokenUsed: qrData.token
        });
        debug.steps.push({ step: 6, action: 'Checking in guest', status: 'success' });
        setScanResult({
          success: true,
          type: 'checked_in',
          message: `${guestData.name} successfully checked in!`,
          guest: guestData,
          timestamp: new Date().toISOString(),
          debug: debugMode ? debug : null
        });
        setScanHistory(prev => [{
          id: Date.now(),
          guest: guestData,
          timestamp: new Date().toISOString(),
          success: true
        }, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      debug.error = error.message;
      setDebugInfo(debug);
      setScanResult({
        success: false,
        type: 'error',
        message: error.message || 'Failed to process QR code',
        timestamp: new Date().toISOString(),
        debug: debugMode ? debug : null
      });
    } finally {
      setProcessingResult(false);
      setTimeout(() => {
        if (!scanResult && !scanning) {
          startScanner();
        }
      }, 3000);
    }
  };

  const clearResult = () => {
    setScanResult(null);
    setDebugInfo(null);
    setTimeout(() => {
      if (!scanning) {
        startScanner();
      }
    }, 100);
  };

  const getResultDisplay = (result) => {
    if (!result) return null;
    switch (result.type) {
      case 'checked_in':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-400" />,
          bgColor: 'bg-green-600/20',
          borderColor: 'border-green-600/30',
          textColor: 'text-green-400'
        };
      case 'already_checked_in':
        return {
          icon: <AlertTriangle className="w-16 h-16 text-yellow-400" />,
          bgColor: 'bg-yellow-600/20',
          borderColor: 'border-yellow-600/30',
          textColor: 'text-yellow-400'
        };
      case 'error':
        return {
          icon: <XCircle className="w-16 h-16 text-red-400" />,
          bgColor: 'bg-red-600/20',
          borderColor: 'border-red-600/30',
          textColor: 'text-red-400'
        };
      default:
        return {
          icon: <XCircle className="w-16 h-16 text-red-400" />,
          bgColor: 'bg-red-600/20',
          borderColor: 'border-red-600/30',
          textColor: 'text-red-400'
        };
    }
  };

  if (eventIdError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <Sidebar />
        <div className="ml-64 flex flex-col">
          <Navbar />
          <main className="flex-1 p-8 pt-24">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Scanner Error</h1>
              <p className="text-gray-400 mb-8">{eventIdError}</p>
              <div className="space-y-4">
                <Link
                  to="/events"
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300"
                >
                  <Home className="w-5 h-5" />
                  <span>Go to Events</span>
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-300"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Reload Page</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Sidebar />
      <div className="ml-64 flex flex-col">
        <Navbar />
        <main className="flex-1 p-8 pt-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link
                to={actualEventId ? `/events/${actualEventId}/guests` : '/events'}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">QR Scanner</h1>
                <p className="text-gray-400">{event?.name || 'Loading...'}</p>
                <p className="text-gray-500 text-sm">Event ID: {actualEventId}</p>
                {debugMode && (
                  <p className="text-yellow-400 text-sm mt-1">Debug Mode: ON</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Debug Mode Toggle */}
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  debugMode ? 'bg-yellow-600/20 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Debug Mode"
              >
                <Bug className="w-5 h-5" />
              </button>

              {scanning ? (
                <button
                  onClick={stopScanner}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <CameraOff className="w-5 h-5" />
                  <span>Stop Scanner</span>
                </button>
              ) : (
                <button
                  onClick={startScanner}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <Camera className="w-5 h-5" />
                  <span>Start Scanner</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Scanner Section */}
            <div className="lg:col-span-2">
              <div className="glass-dark p-8 rounded-2xl border border-white/10">
                <h2 className="text-2xl font-semibold text-white mb-8 flex items-center">
                  <Camera className="w-6 h-6 mr-2" />
                  Camera Scanner
                  {processingResult && <span className="ml-2 text-yellow-400">(Processing...)</span>}
                </h2>

                {/* Scanner Container */}
                <div className="relative">
                  {!scanResult ? (
                    <div
                      id="qr-scanner-container"
                      className="w-full max-w-md mx-auto bg-black rounded-2xl overflow-hidden"
                      style={{ minHeight: '400px' }}
                    >
                      {!scanning && !processingResult && (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                          <div className="text-center">
                            <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">Click "Start Scanner" to begin</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`p-8 rounded-2xl border-2 ${getResultDisplay(scanResult).borderColor} ${getResultDisplay(scanResult).bgColor}`}>
                      <div className="text-center">
                        {getResultDisplay(scanResult).icon}
                        <h3 className={`text-xl font-semibold mt-4 mb-2 ${getResultDisplay(scanResult).textColor}`}>
                          {scanResult.success ? 'Success!' : 'Scan Failed'}
                        </h3>
                        <p className="text-white mb-4">{scanResult.message}</p>
                        
                        {scanResult.guest && (
                          <div className="bg-black/20 p-4 rounded-xl mb-4 text-left">
                            <h4 className="text-white font-medium mb-2">Guest Details</h4>
                            <p className="text-gray-300 text-sm"><strong>Name:</strong> {scanResult.guest.name}</p>
                            <p className="text-gray-300 text-sm"><strong>Category:</strong> {scanResult.guest.category}</p>
                            {scanResult.guest.email && (
                              <p className="text-gray-300 text-sm"><strong>Email:</strong> {scanResult.guest.email}</p>
                            )}
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <button
                            onClick={clearResult}
                            className="flex-1 px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all duration-300"
                          >
                            Continue Scanning
                          </button>
                          <Link
                            to={actualEventId ? `/events/${actualEventId}/guests` : '/events'}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 text-center"
                          >
                            View All Guests
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Processing indicator */}
                {processingResult && (
                  <div className="mt-4 p-4 bg-blue-600/10 border border-blue-600/20 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="loading-spinner w-6 h-6"></div>
                      <p className="text-blue-400">Processing QR code...</p>
                    </div>
                  </div>
                )}

                {/* Debug Information */}
                {debugMode && (debugInfo || scanResult?.debug) && (
                  <div className="mt-8 p-6 bg-yellow-600/10 border border-yellow-600/20 rounded-xl">
                    <h3 className="text-yellow-400 font-semibold mb-4 flex items-center">
                      <Bug className="w-5 h-5 mr-2" />
                      Debug Information
                    </h3>
                    <div className="space-y-4 text-sm">
                      {/* Current Event ID */}
                      <div>
                        <p className="text-yellow-300 font-medium">Current Event ID:</p>
                        <p className="text-white font-mono bg-black/20 p-2 rounded">{actualEventId}</p>
                      </div>

                      {/* Event ID Comparison */}
                      {(debugInfo?.comparison || scanResult?.debug?.comparison) && (
                        <div>
                          <p className="text-yellow-300 font-medium">Event ID Comparison:</p>
                          <div className="bg-black/20 p-3 rounded">
                            <p className="text-white">Token Event ID: <span className="font-mono">{debugInfo?.comparison?.tokenEventId || scanResult?.debug?.comparison?.tokenEventId}</span></p>
                            <p className="text-white">Current Event ID: <span className="font-mono">{debugInfo?.comparison?.currentEventId || scanResult?.debug?.comparison?.currentEventId}</span></p>
                            <p className={`font-medium ${(debugInfo?.comparison?.match || scanResult?.debug?.comparison?.match) ? 'text-green-400' : 'text-red-400'}`}>
                              Match: {(debugInfo?.comparison?.match || scanResult?.debug?.comparison?.match) ? '✅ YES' : '❌ NO'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Processing Steps */}
                      {(debugInfo?.steps || scanResult?.debug?.steps) && (
                        <div>
                          <p className="text-yellow-300 font-medium">Processing Steps:</p>
                          <div className="space-y-2">
                            {(debugInfo?.steps || scanResult?.debug?.steps).map((step, index) => (
                              <div key={index} className="bg-black/20 p-2 rounded">
                                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                  step.status === 'success' ? 'bg-green-400' :
                                  step.status === 'failed' ? 'bg-red-400' :
                                  step.status === 'already_checked_in' ? 'bg-yellow-400' :
                                  'bg-blue-400'
                                }`}></span>
                                <span className="text-white text-xs">
                                  Step {step.step}: {step.action} - {step.status}
                                  {step.error && ` (${step.error})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Scanner Instructions */}
                <div className="mt-8 p-6 bg-blue-600/10 border border-blue-600/20 rounded-xl">
                  <h3 className="text-blue-400 font-semibold mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Scanner Instructions
                  </h3>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li>• Hold the QR code steady within the scanner frame</li>
                    <li>• Ensure good lighting for better scanning accuracy</li>
                    <li>• The scanner will automatically detect and process QR codes</li>
                    <li>• Scanner will stop automatically after successful scan</li>
                    <li>• Click "Continue Scanning" to scan more codes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Scanner Status */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Scanner Status
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Camera</span>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${scanning ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-white text-sm">{scanning ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Processing</span>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${processingResult ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                      <span className="text-white text-sm">{processingResult ? 'Processing' : 'Ready'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Event ID</span>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${actualEventId ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-white text-sm">{actualEventId ? 'Found' : 'Missing'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Scans Today</span>
                    <span className="text-white font-semibold">{scanHistory.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Successful Scans</span>
                    <span className="text-green-400 font-semibold">{scanHistory.filter(s => s.success).length}</span>
                    </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Failed Scans</span>
                    <span className="text-red-400 font-semibold">{scanHistory.filter(s => !s.success).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Scans</span>
                    <span className="text-white font-semibold">{scanHistory.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Last Scan</span>
                    <span className="text-white text-sm">
                      {scanHistory.length > 0 
                        ? new Date(scanHistory[0].timestamp).toLocaleTimeString()
                        : 'None'
                      }
                    </span>
                  </div>
                </div>
                <Link
                  to={`/events/${actualEventId}/stats`}
                  className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-xl transition-all duration-300"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Full Statistics</span>
                </Link>
              </div>

              {/* Recent Scans */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Scans
                </h3>
                
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No scans yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {scanHistory.map((scan) => (
                      <div key={scan.id} className="p-3 bg-black/20 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium text-sm">
                            {scan.guest.name}
                          </span>
                          {scan.success ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{scan.guest.category}</span>
                          <span className="text-gray-400">
                            {new Date(scan.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {scanHistory.length > 0 && (
                      <button
                        onClick={() => setScanHistory([])}
                        className="mt-4 w-full px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-xl transition-all duration-300 text-sm"
                      >
                        Clear History
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Link
                    to={`/events/${actualEventId}/qr-generator`}
                    className="w-full flex items-center space-x-3 p-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl transition-all duration-300"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Generate QR Codes</span>
                  </Link>
                  
                  <Link
                    to={`/events/${actualEventId}/guests`}
                    className="w-full flex items-center space-x-3 p-3 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-xl transition-all duration-300"
                  >
                    <User className="w-5 h-5" />
                    <span>View All Guests</span>
                  </Link>
                  
                  <Link
                    to={`/events/${actualEventId}/stats`}
                    className="w-full flex items-center space-x-3 p-3 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-xl transition-all duration-300"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Event Statistics</span>
                  </Link>
                </div>
              </div>

              {/* Tips & Shortcuts */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Tips & Shortcuts</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Start Scanner</span>
                    <kbd className="px-2 py-1 bg-black/30 text-gray-300 rounded text-xs">Ctrl+S</kbd>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Stop Scanner</span>
                    <kbd className="px-2 py-1 bg-black/30 text-gray-300 rounded text-xs">Esc</kbd>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Clear Result</span>
                    <kbd className="px-2 py-1 bg-black/30 text-gray-300 rounded text-xs">Enter</kbd>
                  </div>
                  
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-gray-400 text-xs leading-relaxed">
                      💡 Position QR codes within the scanning frame for best results. 
                      The scanner will auto-restart after processing each code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QRScannerPage;
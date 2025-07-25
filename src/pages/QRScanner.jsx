// src/pages/QRScanner.jsx - PORTAL-BASED SOLUTION
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

// Isolated Scanner Component that runs outside React
const IsolatedScanner = ({ 
  isActive, 
  onScanSuccess, 
  onScanError, 
  containerId,
  eventId 
}) => {
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Create isolated container outside React tree
  useEffect(() => {
    if (!isActive) return;

    // Create a completely isolated DOM element
    const isolatedContainer = document.createElement('div');
    isolatedContainer.id = containerId;
    isolatedContainer.style.cssText = `
      width: 100%; 
      max-width: 400px; 
      margin: 0 auto; 
      background: black; 
      border-radius: 16px; 
      overflow: hidden;
      min-height: 400px;
    `;

    // Find the target container and append
    const targetContainer = document.getElementById('scanner-target-container');
    if (targetContainer) {
      // Clear any existing content
      targetContainer.innerHTML = '';
      targetContainer.appendChild(isolatedContainer);
      containerRef.current = isolatedContainer;

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (isActive && !isInitializedRef.current) {
          initializeScanner();
        }
      }, 100);
    }

    return () => {
      cleanupScanner();
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
      containerRef.current = null;
      isInitializedRef.current = false;
    };
  }, [isActive, containerId]);

  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear().catch(() => {
          // Fallback cleanup
          try {
            scannerRef.current.stop();
          } catch (e) {
            // Silent fail
          }
        });
      } catch (error) {
        // Silent fail
      }
      scannerRef.current = null;
    }
    isInitializedRef.current = false;
  }, []);

  const initializeScanner = useCallback(() => {
    if (!isActive || isInitializedRef.current || !containerRef.current) return;

    try {
      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        rememberLastUsedCamera: true
      };

      const scanner = new Html5QrcodeScanner(containerId, config, false);
      
      scanner.render(
        (decodedText, decodedResult) => {
          if (onScanSuccess) {
            onScanSuccess(decodedText, decodedResult);
          }
        },
        (error) => {
          // Only report meaningful errors
          if (!error.includes('NotFoundException') && 
              !error.includes('No MultiFormat Readers were able to detect the code') &&
              onScanError) {
            onScanError(error);
          }
        }
      );

      scannerRef.current = scanner;
      isInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to initialize scanner:', error);
      if (onScanError) {
        onScanError('Failed to initialize camera. Please check permissions.');
      }
    }
  }, [isActive, containerId, onScanSuccess, onScanError]);

  return null; // This component doesn't render anything in React tree
};

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
  const [scannerError, setScannerError] = useState(null);

  const scannerContainerIdRef = useRef(`qr-scanner-${Date.now()}`);

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

  // Event ID validation
  useEffect(() => {
    if (!actualEventId) {
      setEventIdError('No Event ID found in URL. Please navigate from Events page.');
      setLoading(false);
      return;
    }
    localStorage.setItem('currentEventId', actualEventId);
    setEventIdError(null);
  }, [paramEventId, location, actualEventId]);

  // Load event data
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

  const handleScanSuccess = async (decodedText, decodedResult) => {
    if (processingResult) return;
    
    setProcessingResult(true);
    setScannerError(null);
    
    // Stop scanner temporarily
    setScanning(false);
    
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

      debug.steps.push({ step: 4, action: 'Finding guest in subcollection', status: 'start' });
      
      // Use subcollection structure: events/{eventId}/guests/{guestId}
      const guestRef = doc(db, 'events', actualEventId, 'guests', tokenData.guestId);
      const guestDoc = await getDoc(guestRef);
      
      if (!guestDoc.exists()) {
        debug.steps.push({ step: 4, action: 'Finding guest in subcollection', status: 'failed', error: 'Guest not found' });
        throw new Error('Guest not found');
      }

      const guestData = guestDoc.data();
      debug.steps.push({ step: 4, action: 'Finding guest in subcollection', status: 'success', guest: guestData });
      debug.guestData = guestData;

      debug.steps.push({ step: 5, action: 'Checking guest status', status: 'start' });
      
      if (guestData.checkedIn) {
        debug.steps.push({ step: 5, action: 'Checking guest status', status: 'already_checked_in' });
        setScanResult({
          success: true,
          type: 'already_checked_in',
          message: `${guestData.name} has already been checked in`,
          guest: guestData,
          timestamp: new Date().toISOString(),
          debug: debugMode ? debug : null
        });
      } else {
        debug.steps.push({ step: 6, action: 'Checking in guest', status: 'start' });
        
        // Update guest document in subcollection
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
          message: `Welcome ${guestData.name}! Successfully checked in.`,
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
      // Auto restart scanner after 3 seconds
      setTimeout(() => {
        if (!scanResult) {
          startScanner();
        }
      }, 3000);
    }
  };

  const handleScanError = (error) => {
    setScannerError(error);
  };

  const startScanner = () => {
    if (!actualEventId) {
      setScannerError('Cannot start scanner: No Event ID found.');
      return;
    }
    setScanResult(null);
    setDebugInfo(null);
    setScannerError(null);
    setScanning(true);
  };

  const stopScanner = () => {
    setScanning(false);
    setScannerError(null);
  };

  const clearResult = () => {
    setScanResult(null);
    setDebugInfo(null);
    setTimeout(() => {
      startScanner();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <Sidebar />
        <div className="ml-64 flex flex-col">
          <Navbar />
          <main className="flex-1 p-8 pt-24">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Loading Scanner</h1>
              <p className="text-gray-400">Setting up QR scanner...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
              </div>
            </div>
          </main>
        </div>
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
                to="/events"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <Camera className="w-8 h-8 mr-3 text-blue-400" />
                  QR Scanner
                </h1>
                <p className="text-gray-400 mt-1">
                  {event ? `Scanning for: ${event.name}` : 'Loading event...'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  debugMode ? 
                    'bg-yellow-600/20 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-white/10'
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
                    <div className="w-full">
                      {/* Target container for isolated scanner */}
                      <div 
                        id="scanner-target-container"
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
                        {processingResult && (
                          <div className="flex items-center justify-center h-full min-h-[400px]">
                            <div className="text-center">
                              <RefreshCw className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
                              <p className="text-gray-400">Processing QR code...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Scanner Error Display */}
                      {scannerError && (
                        <div className="mt-4 p-4 bg-red-600/20 border border-red-600/30 rounded-xl">
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-400">{scannerError}</p>
                          </div>
                        </div>
                      )}

                      {/* Isolated Scanner Component */}
                      <IsolatedScanner
                        isActive={scanning}
                        onScanSuccess={handleScanSuccess}
                        onScanError={handleScanError}
                        containerId={scannerContainerIdRef.current}
                        eventId={actualEventId}
                      />
                    </div>
                  ) : (
                    <div className={`p-8 rounded-2xl border-2 ${getResultDisplay(scanResult).borderColor} ${getResultDisplay(scanResult).bgColor}`}>
                      <div className="text-center">
                        {getResultDisplay(scanResult).icon}
                        <h3 className={`text-xl font-semibold mt-4 mb-2 ${getResultDisplay(scanResult).textColor}`}>
                          {scanResult.success ? 'Success!' : 'Error'}
                        </h3>
                        <p className="text-gray-300 mb-6">{scanResult.message}</p>
                        
                        {scanResult.guest && (
                          <div className="bg-black/50 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-center space-x-4">
                              <User className="w-6 h-6 text-blue-400" />
                              <div className="text-left">
                                <p className="text-white font-semibold">{scanResult.guest.name}</p>
                                <p className="text-gray-400 text-sm">{scanResult.guest.email}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={clearResult}
                          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 mx-auto"
                        >
                          <RefreshCw className="w-5 h-5" />
                          <span>Scan Next</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Debug Info */}
                {debugMode && (debugInfo || scanResult?.debug) && (
                  <div className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4">Debug Information</h3>
                    <pre className="text-xs text-gray-300 overflow-auto max-h-64">
                      {JSON.stringify(debugInfo || scanResult?.debug, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              {/* Event Info */}
              {event && (
                <div className="glass-dark p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Event Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">Event Name</p>
                      <p className="text-white font-semibold">{event.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Guests</p>
                      <p className="text-white font-semibold">{event.guests?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Checked In</p>
                      <p className="text-green-400 font-semibold">
                        {event.guests?.filter(g => g.checkedIn)?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Scans */}
              {scanHistory.length > 0 && (
                <div className="glass-dark p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Scans
                  </h3>
                  <div className="space-y-3">
                    {scanHistory.slice(0, 5).map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{scan.guest.name}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(scan.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scanner Stats */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Scanner Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-semibold ${scanning ? 'text-green-400' : 'text-gray-400'}`}>
                      {scanning ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Scans</span>
                    <span className="text-white font-semibold">{scanHistory.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Debug Mode</span>
                    <span className={`font-semibold ${debugMode ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {debugMode ? 'On' : 'Off'}
                    </span>
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
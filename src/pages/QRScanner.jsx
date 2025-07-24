// src/pages/QRScanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  doc, 
  updateDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs
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
  BarChart3
} from 'lucide-react';

const QRScanner = () => {
  const { eventId } = useParams();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingResult, setProcessingResult] = useState(false);
  const html5QrCodeScannerRef = useRef(null);

  // Load event details
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading event:', error);
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  // Initialize scanner
  const startScanner = () => {
    if (html5QrCodeScannerRef.current) {
      html5QrCodeScannerRef.current.clear();
    }

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
      (error) => {
        // Handle scan errors silently (too noisy otherwise)
        console.debug('QR scan error:', error);
      }
    );

    html5QrCodeScannerRef.current = scanner;
    setScanning(true);
  };

  // Stop scanner
  const stopScanner = () => {
    if (html5QrCodeScannerRef.current) {
      html5QrCodeScannerRef.current.clear();
      html5QrCodeScannerRef.current = null;
    }
    setScanning(false);
  };

  // Handle successful scan
  const handleScanSuccess = async (decodedText, decodedResult) => {
    if (processingResult) return; // Prevent multiple simultaneous scans
    
    setProcessingResult(true);
    stopScanner(); // Stop scanning while processing

    try {
      // Parse QR data
      const qrData = parseQRData(decodedText);
      if (!qrData) {
        throw new Error('Invalid QR code format');
      }

      // Validate token
      const tokenData = validateQRToken(qrData.token);
      if (!tokenData) {
        throw new Error('Invalid or expired QR token');
      }

      // Verify event matches
      if (tokenData.eventId !== eventId) {
        throw new Error('QR code is for a different event');
      }

      // Find guest
      const guestRef = doc(db, 'events', eventId, 'guests', tokenData.guestId);
      const guestDoc = await getDoc(guestRef);
      
      if (!guestDoc.exists()) {
        throw new Error('Guest not found');
      }

      const guestData = guestDoc.data();

      // Check if already checked in
      if (guestData.checkedIn) {
        setScanResult({
          success: false,
          type: 'already_checked_in',
          message: 'Guest has already been checked in',
          guest: guestData,
          timestamp: new Date().toISOString()
        });
      } else {
        // Check in the guest
        await updateDoc(guestRef, {
          checkedIn: true,
          checkInTime: new Date().toISOString(),
          checkedInBy: currentUser.uid,
          qrTokenUsed: qrData.token
        });

        setScanResult({
          success: true,
          type: 'checked_in',
          message: 'Guest successfully checked in!',
          guest: guestData,
          timestamp: new Date().toISOString()
        });

        // Add to scan history
        setScanHistory(prev => [{
          id: Date.now(),
          guest: guestData,
          timestamp: new Date().toISOString(),
          success: true
        }, ...prev.slice(0, 9)]); // Keep last 10 scans
      }

    } catch (error) {
      console.error('Error processing QR scan:', error);
      setScanResult({
        success: false,
        type: 'error',
        message: error.message || 'Failed to process QR code',
        timestamp: new Date().toISOString()
      });
    } finally {
      setProcessingResult(false);
      
      // Auto-restart scanner after 3 seconds
      setTimeout(() => {
        if (!scanning) {
          startScanner();
        }
      }, 3000);
    }
  };

  // Clear scan result
  const clearResult = () => {
    setScanResult(null);
    if (!scanning) {
      startScanner();
    }
  };

  // Get result icon and color
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
                to={`/events/${eventId}/guests`}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">QR Scanner</h1>
                <p className="text-gray-400">{event?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {scanning ? (
                <button
                  onClick={stopScanner}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-all duration-300"
                >
                  <CameraOff className="w-5 h-5" />
                  <span>Stop Scanner</span>
                </button>
              ) : (
                <button
                  onClick={startScanner}
                  className="flex items-center space-x-2 px-6 py-3 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-semibold transition-all duration-300"
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
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center justify-center">
                  <Camera className="w-6 h-6 mr-2" />
                  Camera Scanner
                </h2>

                {/* Scanner Container */}
                <div className="relative">
                  {!scanning && !scanResult && (
                    <div className="text-center py-16">
                      <Camera className="w-24 h-24 text-gray-600 mx-auto mb-6" />
                      <h3 className="text-xl text-white mb-2">Scanner Ready</h3>
                      <p className="text-gray-400 mb-6">Click "Start Scanner" to begin scanning QR codes</p>
                      <button
                        onClick={startScanner}
                        className="px-8 py-4 netflix-gradient hover:netflix-gradient-hover rounded-xl text-white font-semibold transition-all duration-300"
                      >
                        Start Scanning
                      </button>
                    </div>
                  )}

                  {/* QR Scanner */}
                  <div id="qr-scanner-container" className="rounded-xl overflow-hidden"></div>

                  {/* Processing Overlay */}
                  {processingResult && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
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
                    {(() => {
                      const display = getResultDisplay(scanResult);
                      return (
                        <div className={`p-8 rounded-2xl border text-center ${display.bgColor} ${display.borderColor}`}>
                          <div className="mb-4">
                            {display.icon}
                          </div>
                          
                          <h3 className={`text-2xl font-bold mb-2 ${display.textColor}`}>
                            {scanResult.success ? 'Success!' : 'Scan Failed'}
                          </h3>
                          
                          <p className="text-white mb-4">{scanResult.message}</p>
                          
                          {scanResult.guest && (
                            <div className="bg-black/20 p-6 rounded-xl mb-6">
                              <h4 className="text-white font-semibold mb-3">Guest Information</h4>
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">Name</p>
                                  <p className="text-white font-medium">{scanResult.guest.name}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Category</p>
                                  <p className="text-white">{scanResult.guest.category}</p>
                                </div>
                                {scanResult.guest.company && (
                                  <div>
                                    <p className="text-gray-400">Company</p>
                                    <p className="text-white">{scanResult.guest.company}</p>
                                  </div>
                                )}
                                {scanResult.guest.email && (
                                  <div>
                                    <p className="text-gray-400">Email</p>
                                    <p className="text-white text-xs">{scanResult.guest.email}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-center space-x-4">
                            <button
                              onClick={clearResult}
                              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300"
                            >
                              Continue Scanning
                            </button>
                            <Link
                              to={`/events/${eventId}/guests`}
                              className="px-6 py-3 netflix-gradient hover:netflix-gradient-hover text-white rounded-xl transition-all duration-300"
                            >
                              View All Guests
                            </Link>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Scanner Instructions */}
                <div className="mt-8 p-6 bg-blue-600/10 border border-blue-600/20 rounded-xl">
                  <h4 className="text-blue-400 font-medium mb-3 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Scanner Instructions
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-2">
                    <li>• Hold the QR code steady within the scanner frame</li>
                    <li>• Ensure good lighting for better scanning accuracy</li>
                    <li>• The scanner will automatically detect and process QR codes</li>
                    <li>• Each QR code can only be used once for security</li>
                    <li>• Invalid or expired QR codes will be rejected</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Scanner Status */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Scanner Status
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Camera</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${scanning ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className={`text-sm font-medium ${scanning ? 'text-green-400' : 'text-red-400'}`}>
                        {scanning ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Processing</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${processingResult ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
                      <span className={`text-sm font-medium ${processingResult ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {processingResult ? 'Processing' : 'Ready'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Scans Today</span>
                    <span className="text-white font-medium">{scanHistory.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Successful Scans</span>
                    <span className="text-green-400 font-medium">
                      {scanHistory.filter(scan => scan.success).length}
                    </span>
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
                  to={`/events/${eventId}/stats`}
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
                          <span className="text-gray-400">
                            {scan.guest.category}
                          </span>
                          <span className="text-gray-400">
                            {new Date(scan.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {scanHistory.length > 0 && (
                  <button
                    onClick={() => setScanHistory([])}
                    className="mt-4 w-full px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-xl transition-all duration-300 text-sm"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Link
                    to={`/events/${eventId}/qr-generator`}
                    className="w-full flex items-center space-x-3 p-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl transition-all duration-300"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Generate QR Codes</span>
                  </Link>
                  
                  <Link
                    to={`/events/${eventId}/guests`}
                    className="w-full flex items-center space-x-3 p-3 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-xl transition-all duration-300"
                  >
                    <User className="w-5 h-5" />
                    <span>Manage Guests</span>
                  </Link>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 rounded-xl transition-all duration-300"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Refresh Scanner</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QRScanner;
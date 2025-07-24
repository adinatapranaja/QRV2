// src/pages/QRGenerator.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import QRCode from 'qrcode';
import { generateQRData } from '../utils/crypto';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  QrCode,
  User,
  Calendar,
  MapPin,
  Clock,
  Share2,
  Printer,
  BarChart3
} from 'lucide-react';

const QRGenerator = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('guestId');
  
  const [event, setEvent] = useState(null);
  const [guest, setGuest] = useState(null);
  const [guests, setGuests] = useState([]);
  const [selectedGuestId, setSelectedGuestId] = useState(guestId || '');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);
  const canvasRef = useRef(null);

  // Load event and guests
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load event
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        }

        // Load guests
        const guestsQuery = query(collection(db, 'events', eventId, 'guests'));
        const guestsSnapshot = await getDocs(guestsQuery);
        const guestsData = guestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGuests(guestsData);

        // Load specific guest if guestId provided
        if (guestId) {
          const guestDoc = guestsData.find(g => g.id === guestId);
          if (guestDoc) {
            setGuest(guestDoc);
            setSelectedGuestId(guestId);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, guestId]);

  // Generate QR code when guest is selected
  useEffect(() => {
    const generateQR = async (guestData) => {
      if (!guestData || !event) return;

      setGenerating(true);
      try {
        const qrData = generateQRData({
          guestId: guestData.id,
          eventId: eventId,
          expiresIn: expirationHours
        });

        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 300
        });

        setQrCodeUrl(qrCodeDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
        showToast('Failed to generate QR code', 'error');
      } finally {
        setGenerating(false);
      }
    };

    if (selectedGuestId && guests.length > 0) {
      const selectedGuest = guests.find(g => g.id === selectedGuestId);
      if (selectedGuest) {
        setGuest(selectedGuest);
        generateQR(selectedGuest);
      }
    }
  }, [selectedGuestId, guests, event, eventId, expirationHours]);

  // Generate QR code
  const generateQRCode = async (guestData) => {
    if (!guestData || !event) return;

    setGenerating(true);
    try {
      // Create QR data with encrypted token
      const qrData = generateQRData({
        guestId: guestData.id,
        eventId: eventId,
        expiresIn: expirationHours
      });

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      });

      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      showToast('Failed to generate QR code', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeUrl || !guest) return;

    const link = document.createElement('a');
    link.download = `qr-${guest.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  // Print QR code
  const printQRCode = () => {
    if (!qrCodeUrl || !guest || !event) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${guest.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: white;
            }
            .ticket {
              text-align: center;
              padding: 40px;
              border: 2px solid #000;
              border-radius: 10px;
              max-width: 400px;
            }
            .event-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .guest-name {
              font-size: 20px;
              margin-bottom: 20px;
              color: #333;
            }
            .qr-code {
              margin: 20px 0;
            }
            .details {
              font-size: 14px;
              color: #666;
              margin-top: 20px;
            }
            .expires {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="event-title">${event.name}</div>
            <div class="guest-name">${guest.name}</div>
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
            </div>
            <div class="details">
              <div><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</div>
              <div><strong>Location:</strong> ${event.location}</div>
              <div><strong>Category:</strong> ${guest.category}</div>
            </div>
            <div class="expires">
              Valid for ${expirationHours} hours from generation
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Share QR code
  const shareQRCode = async () => {
    if (!qrCodeUrl || !guest) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], `qr-${guest.name}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `QR Code for ${guest.name}`,
          text: `QR Code for ${event.name}`,
          files: [file]
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard', 'success');
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      showToast('Failed to share QR code', 'error');
    }
  };

  // Toast notification function
  const showToast = (message, type) => {
    console.log(`${type}: ${message}`);
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
                <h1 className="text-3xl font-bold text-white mb-2">QR Code Generator</h1>
                <p className="text-gray-400">{event?.name}</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Guest Selection */}
            <div className="lg:col-span-1">
              <div className="glass-dark p-6 rounded-2xl border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Select Guest
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Choose Guest
                    </label>
                    <select
                      value={selectedGuestId}
                      onChange={(e) => setSelectedGuestId(e.target.value)}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                    >
                      <option value="">Select a guest...</option>
                      {guests.map((guest) => (
                        <option key={guest.id} value={guest.id}>
                          {guest.name} ({guest.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      QR Code Expiration
                    </label>
                    <select
                      value={expirationHours}
                      onChange={(e) => setExpirationHours(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={6}>6 Hours</option>
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours</option>
                      <option value={48}>48 Hours</option>
                      <option value={168}>1 Week</option>
                    </select>
                  </div>

                  {guest && (
                    <button
                      onClick={() => generateQRCode(guest)}
                      disabled={generating}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 netflix-gradient hover:netflix-gradient-hover rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                      <span>{generating ? 'Generating...' : 'Regenerate QR Code'}</span>
                    </button>
                  )}
                </div>

                {/* Guest Details */}
                {guest && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Guest Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Name</p>
                        <p className="text-white font-medium">{guest.name}</p>
                      </div>
                      {guest.email && (
                        <div>
                          <p className="text-sm text-gray-400">Email</p>
                          <p className="text-white text-sm">{guest.email}</p>
                        </div>
                      )}
                      {guest.phone && (
                        <div>
                          <p className="text-sm text-gray-400">Phone</p>
                          <p className="text-white text-sm">{guest.phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-400">Category</p>
                        <span className="inline-block mt-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm">
                          {guest.category}
                        </span>
                      </div>
                      {guest.company && (
                        <div>
                          <p className="text-sm text-gray-400">Company</p>
                          <p className="text-white text-sm">{guest.company}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-400">Check-in Status</p>
                        <div className="flex items-center mt-1">
                          {guest.checkedIn ? (
                            <span className="text-green-400 text-sm font-medium">✓ Checked In</span>
                          ) : (
                            <span className="text-red-400 text-sm font-medium">✗ Not Checked In</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Display */}
            <div className="lg:col-span-2">
              <div className="glass-dark p-8 rounded-2xl border border-white/10 text-center">
                <h2 className="text-2xl font-semibold text-white mb-8 flex items-center justify-center">
                  <QrCode className="w-6 h-6 mr-2" />
                  Generated QR Code
                </h2>

                {!selectedGuestId ? (
                  <div className="py-16">
                    <QrCode className="w-24 h-24 text-gray-600 mx-auto mb-6" />
                    <h3 className="text-xl text-white mb-2">Select a Guest</h3>
                    <p className="text-gray-400">Choose a guest from the list to generate their QR code</p>
                  </div>
                ) : generating ? (
                  <div className="py-16">
                    <div className="loading-spinner mx-auto mb-6"></div>
                    <h3 className="text-xl text-white mb-2">Generating QR Code...</h3>
                    <p className="text-gray-400">Please wait while we create the secure QR code</p>
                  </div>
                ) : qrCodeUrl ? (
                  <div>
                    {/* QR Code Image */}
                    <div className="bg-white p-8 rounded-2xl inline-block mb-8">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code" 
                        className="w-64 h-64 mx-auto"
                        ref={canvasRef}
                      />
                    </div>

                    {/* Event Info */}
                    <div className="mb-8 p-6 bg-black/20 rounded-xl">
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-center space-x-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-gray-300">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <button
                        onClick={downloadQRCode}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl transition-all duration-300"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={printQRCode}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-xl transition-all duration-300"
                      >
                        <Printer className="w-5 h-5" />
                        <span>Print</span>
                      </button>

                      <button
                        onClick={shareQRCode}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-xl transition-all duration-300"
                      >
                        <Share2 className="w-5 h-5" />
                        <span>Share</span>
                      </button>

                      <button
                        onClick={() => generateQRCode(guest)}
                        disabled={generating}
                        className="flex items-center justify-center space-x-2 px-6 py-3 netflix-gradient hover:netflix-gradient-hover rounded-xl text-white transition-all duration-300 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    {/* Security Info */}
                    <div className="mt-8 p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-yellow-600 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-black text-xs font-bold">!</span>
                        </div>
                        <div className="text-left">
                          <h4 className="text-yellow-400 font-medium mb-1">Security Notice</h4>
                          <ul className="text-yellow-200 text-sm space-y-1">
                            <li>• QR code expires in {expirationHours} hours from generation</li>
                            <li>• Each QR code is unique and can only be used once</li>
                            <li>• QR codes are encrypted with AES encryption</li>
                            <li>• Share this QR code only with the intended guest</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16">
                    <div className="w-24 h-24 bg-gray-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl text-white mb-2">No QR Code Generated</h3>
                    <p className="text-gray-400">Click "Generate QR Code" to create a secure QR code for this guest</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {guest && qrCodeUrl && (
                <div className="mt-6 grid md:grid-cols-2 gap-6">
                  <Link
                    to={`/events/${eventId}/scanner`}
                    className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <QrCode className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-semibold mb-1">Test Scanner</h3>
                        <p className="text-gray-400 text-sm">Test the generated QR code with scanner</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to={`/events/${eventId}/stats`}
                    className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-semibold mb-1">View Statistics</h3>
                        <p className="text-gray-400 text-sm">Check event attendance statistics</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QRGenerator;
// src/pages/Guests.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { generateGuestId } from '../utils/uuid';
import { parseGuestCSV, exportGuestsToCSV, validateCSVFile, downloadGuestTemplate } from '../utils/csv';
import {
  Plus,
  Upload,
  Download,
  Search,
  Edit3,
  Trash2,
  QrCode,
  Users,
  ArrowLeft,
  UserCheck,
  UserX,
  Mail,
  Phone,
  BarChart3
} from 'lucide-react';

const Guests = () => {
  const { eventId } = useParams();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'General',
    company: '',
    title: '',
    notes: ''
  });

  // Load event details
  useEffect(() => {
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

    loadEvent();
  }, [eventId]);

  // Listen to guests in real-time
  useEffect(() => {
    const guestsQuery = query(
      collection(db, 'events', eventId, 'guests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(guestsQuery, (snapshot) => {
      const guestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGuests(guestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  // Add new guest
  const handleAddGuest = async (e) => {
    e.preventDefault();
    
    try {
      const guestData = {
        ...newGuest,
        guestId: generateGuestId(),
        eventId: eventId,
        checkedIn: false,
        checkInTime: null,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'events', eventId, 'guests'), guestData);
      
      // Reset form
      setNewGuest({
        name: '',
        email: '',
        phone: '',
        category: 'General',
        company: '',
        title: '',
        notes: ''
      });
      setShowAddModal(false);
      
      showToast('Guest added successfully!', 'success');
    } catch (error) {
      console.error('Error adding guest:', error);
      showToast('Failed to add guest', 'error');
    }
  };

  // Update guest
  const handleUpdateGuest = async (e) => {
    e.preventDefault();
    
    try {
      const guestRef = doc(db, 'events', eventId, 'guests', editingGuest.id);
      await updateDoc(guestRef, {
        ...newGuest,
        updatedAt: new Date().toISOString()
      });
      
      setEditingGuest(null);
      setShowAddModal(false);
      showToast('Guest updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating guest:', error);
      showToast('Failed to update guest', 'error');
    }
  };

  // Delete guest
  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm('Are you sure you want to delete this guest?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', eventId, 'guests', guestId));
      showToast('Guest deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting guest:', error);
      showToast('Failed to delete guest', 'error');
    }
  };

  // Open edit modal
  const openEditModal = (guest) => {
    setEditingGuest(guest);
    setNewGuest({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      category: guest.category,
      company: guest.company,
      title: guest.title,
      notes: guest.notes
    });
    setShowAddModal(true);
  };

  // Handle CSV import
  const handleCSVImport = async () => {
    if (!csvFile) return;

    setImporting(true);
    try {
      await validateCSVFile(csvFile);
      const parsedGuests = await parseGuestCSV(csvFile);
      
      // Add all guests to Firestore
      const batch = [];
      for (const guest of parsedGuests) {
        const guestData = {
          ...guest,
          eventId: eventId,
          createdBy: currentUser.uid
        };
        batch.push(addDoc(collection(db, 'events', eventId, 'guests'), guestData));
      }
      
      await Promise.all(batch);
      
      setCsvFile(null);
      showToast(`Successfully imported ${parsedGuests.length} guests!`, 'success');
    } catch (error) {
      console.error('Error importing CSV:', error);
      showToast(error.message || 'Failed to import guests', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Export guests to CSV
  const handleExportCSV = () => {
    try {
      exportGuestsToCSV(filteredGuests, event?.name || 'event');
      showToast('Guests exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting guests:', error);
      showToast('Failed to export guests', 'error');
    }
  };

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || guest.category === filterCategory;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'checked-in' && guest.checkedIn) ||
                         (filterStatus === 'not-checked-in' && !guest.checkedIn);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories
  const categories = [...new Set(guests.map(guest => guest.category))];

  // Toast notification function
  const showToast = (message, type) => {
    console.log(`${type}: ${message}`);
  };

  if (!event) {
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
                to="/events"
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Guests Management</h1>
                <p className="text-gray-400">{event.name} • {guests.length} guests</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={downloadGuestTemplate}
                className="flex items-center space-x-2 px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-lg transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                <span>Template</span>
              </button>
              
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={() => {
                  setEditingGuest(null);
                  setNewGuest({
                    name: '',
                    email: '',
                    phone: '',
                    category: 'General',
                    company: '',
                    title: '',
                    notes: ''
                  });
                  setShowAddModal(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Add Guest</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Guests</p>
                  <p className="text-2xl font-bold text-white">{guests.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Checked In</p>
                  <p className="text-2xl font-bold text-green-400">
                    {guests.filter(g => g.checkedIn).length}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Not Checked In</p>
                  <p className="text-2xl font-bold text-red-400">
                    {guests.filter(g => !g.checkedIn).length}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-red-400" />
              </div>
            </div>
            
            <div className="glass-dark p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Check-in Rate</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {guests.length > 0 ? Math.round((guests.filter(g => g.checkedIn).length / guests.length) * 100) : 0}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* CSV Import Section */}
          <div className="glass-dark p-6 rounded-2xl border border-white/10 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Import Guests from CSV
            </h3>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:cursor-pointer"
                />
              </div>
              
              <button
                onClick={handleCSVImport}
                disabled={!csvFile || importing}
                className="px-6 py-3 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
            >
              <option value="all">All Status</option>
              <option value="checked-in">Checked In</option>
              <option value="not-checked-in">Not Checked In</option>
            </select>
          </div>

          {/* Guests Table */}
          {loading ? (
            <div className="glass-dark rounded-2xl border border-white/10 p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-600 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="glass-dark rounded-2xl border border-white/10 p-16 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No guests found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add guests to get started'
                }
              </p>
            </div>
          ) : (
            <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-medium">Guest</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Contact</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Category</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((guest) => (
                      <tr key={guest.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-white">{guest.name}</div>
                            {guest.company && (
                              <div className="text-sm text-gray-400">{guest.title ? `${guest.title} at ${guest.company}` : guest.company}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            {guest.email && (
                              <div className="flex items-center text-sm text-gray-400">
                                <Mail className="w-4 h-4 mr-2" />
                                {guest.email}
                              </div>
                            )}
                            {guest.phone && (
                              <div className="flex items-center text-sm text-gray-400">
                                <Phone className="w-4 h-4 mr-2" />
                                {guest.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm">
                            {guest.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {guest.checkedIn ? (
                              <>
                                <UserCheck className="w-5 h-5 text-green-400" />
                                <div>
                                  <div className="text-green-400 text-sm font-medium">Checked In</div>
                                  {guest.checkInTime && (
                                    <div className="text-gray-400 text-xs">
                                      {new Date(guest.checkInTime).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <UserX className="w-5 h-5 text-red-400" />
                                <span className="text-red-400 text-sm font-medium">Not Checked In</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/events/${eventId}/qr-generator?guestId=${guest.id}`}
                              className="p-2 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-lg transition-all duration-200"
                              title="Generate QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openEditModal(guest)}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-all duration-200"
                              title="Edit Guest"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(guest.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all duration-200"
                              title="Delete Guest"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-dark p-8 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingGuest ? 'Edit Guest' : 'Add New Guest'}
            </h2>
            
            <form onSubmit={editingGuest ? handleUpdateGuest : handleAddGuest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({...newGuest, name: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                  placeholder="Enter full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({...newGuest, email: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newGuest.category}
                    onChange={(e) => setNewGuest({...newGuest, category: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="General">General</option>
                    <option value="VIP">VIP</option>
                    <option value="Speaker">Speaker</option>
                    <option value="Sponsor">Sponsor</option>
                    <option value="Staff">Staff</option>
                    <option value="Media">Media</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={newGuest.company}
                    onChange={(e) => setNewGuest({...newGuest, company: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={newGuest.title}
                  onChange={(e) => setNewGuest({...newGuest, title: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                  placeholder="Job title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={newGuest.notes}
                  onChange={(e) => setNewGuest({...newGuest, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingGuest(null);
                  }}
                  className="flex-1 px-6 py-3 border border-white/20 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 netflix-gradient hover:netflix-gradient-hover text-white rounded-xl transition-all duration-300"
                >
                  {editingGuest ? 'Update Guest' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guests;
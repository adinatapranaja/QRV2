// src/pages/Events.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { generateEventId } from '../utils/uuid';
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  QrCode,
  BarChart3,
  Edit3,
  Trash2,
  Eye,
  Clock,
  Search,
  Filter
} from 'lucide-react';

const Events = () => {
  const { currentUser, userRole } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Conference',
    maxGuests: 100
  });

  // Listen to events in real-time
  useEffect(() => {
    const eventsQuery = userRole === 'owner' 
      ? query(collection(db, 'events'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'events'), 
          where('createdBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.uid, userRole]);

  // Create new event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    try {
      const eventData = {
        ...newEvent,
        eventId: generateEventId(),
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'upcoming',
        totalGuests: 0,
        checkedInGuests: 0
      };

      await addDoc(collection(db, 'events'), eventData);
      
      // Reset form
      setNewEvent({
        name: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: 'Conference',
        maxGuests: 100
      });
      setShowCreateModal(false);
      
      // Show success toast
      showToast('Event created successfully!', 'success');
    } catch (error) {
      console.error('Error creating event:', error);
      showToast('Failed to create event', 'error');
    }
  };

  // Update event
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    
    try {
      const eventRef = doc(db, 'events', editingEvent.id);
      await updateDoc(eventRef, {
        ...newEvent,
        updatedAt: new Date().toISOString()
      });
      
      setEditingEvent(null);
      setShowCreateModal(false);
      showToast('Event updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating event:', error);
      showToast('Failed to update event', 'error');
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', eventId));
      showToast('Event deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    }
  };

  // Open edit modal
  const openEditModal = (event) => {
    setEditingEvent(event);
    setNewEvent({
      name: event.name,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      maxGuests: event.maxGuests
    });
    setShowCreateModal(true);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filterStatus === 'upcoming') {
      return matchesSearch && eventDate >= today;
    } else if (filterStatus === 'past') {
      return matchesSearch && eventDate < today;
    }
    
    return matchesSearch;
  });

  // Toast notification function
  const showToast = (message, type) => {
    // You can implement toast notification here
    console.log(`${type}: ${message}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Sidebar />
      <div className="ml-64 flex flex-col">
        <Navbar />
        
        <main className="flex-1 p-8 pt-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Events Management</h1>
              <p className="text-gray-400">Create and manage your events</p>
            </div>
            
            <button
              onClick={() => {
                setEditingEvent(null);
                setNewEvent({
                  name: '',
                  description: '',
                  date: '',
                  time: '',
                  location: '',
                  category: 'Conference',
                  maxGuests: 100
                });
                setShowCreateModal(true);
              }}
              className="flex items-center space-x-2 px-6 py-3 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600 appearance-none"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past Events</option>
              </select>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-dark p-6 rounded-2xl border border-white/10 animate-pulse">
                  <div className="h-4 bg-gray-600 rounded mb-4"></div>
                  <div className="h-3 bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-600 rounded flex-1"></div>
                    <div className="h-8 bg-gray-600 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first event to get started'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 netflix-gradient hover:netflix-gradient-hover rounded-lg text-white font-semibold transition-all duration-300"
                >
                  Create Your First Event
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.id} className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                        {event.name}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{event.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-all duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{event.checkedInGuests || 0} / {event.totalGuests || 0} guests</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      to={`/events/${event.id}/guests`}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-all duration-200 text-sm"
                    >
                      <Users className="w-4 h-4" />
                      <span>Guests</span>
                    </Link>
                    
                    <Link
                      to={`/events/${event.id}/scanner`}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-all duration-200 text-sm"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Scan</span>
                    </Link>
                    
                    <Link
                      to={`/events/${event.id}/stats`}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg transition-all duration-200 text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Stats</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create/Edit Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-dark p-8 rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            
            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                  placeholder="Enter event name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                  placeholder="Event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                  placeholder="Event location"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Meetup">Meetup</option>
                    <option value="Party">Party</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newEvent.maxGuests}
                    onChange={(e) => setNewEvent({...newEvent, maxGuests: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                  }}
                  className="flex-1 px-6 py-3 border border-white/20 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 netflix-gradient hover:netflix-gradient-hover text-white rounded-xl transition-all duration-300"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
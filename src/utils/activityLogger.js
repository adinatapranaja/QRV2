// src/utils/activityLogger.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

/**
 * Log user activity to Firestore
 * @param {Object} activityData - Activity data to log
 */
export const logActivity = async (activityData) => {
  try {
    const {
      type,
      userId,
      userName,
      userEmail,
      eventId,
      eventName,
      description,
      metadata = {},
      location = null
    } = activityData;

    // Validate required fields
    if (!type || !userId) {
      throw new Error('Activity type and userId are required');
    }

    const activity = {
      type,
      userId,
      userName: userName || userEmail || 'Unknown User',
      userEmail: userEmail || '',
      eventId: eventId || null,
      eventName: eventName || null,
      description: description || generateDescription(type, userName, eventName),
      metadata,
      location,
      timestamp: serverTimestamp(),
      isNew: true,
      createdAt: new Date().toISOString()
    };

    // Add to activities collection
    await addDoc(collection(db, 'activities'), activity);
    
    console.log('Activity logged successfully:', activity);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

/**
 * Generate automatic description based on activity type
 * @param {string} type - Activity type
 * @param {string} userName - User name
 * @param {string} eventName - Event name
 * @returns {string} Generated description
 */
const generateDescription = (type, userName, eventName) => {
  const user = userName || 'User';
  const event = eventName || 'an event';
  
  switch (type) {
    case 'check_in':
      return `${user} checked in to ${event}`;
    case 'user_registered':
      return `${user} registered for an account`;
    case 'event_created':
      return `${user} created a new event: ${event}`;
    case 'event_updated':
      return `${user} updated event: ${event}`;
    case 'event_deleted':
      return `${user} deleted event: ${event}`;
    case 'qr_generated':
      return `${user} generated QR codes for ${event}`;
    case 'qr_scanned':
      return `${user} scanned a QR code for ${event}`;
    case 'guest_added':
      return `${user} added a guest to ${event}`;
    case 'guest_removed':
      return `${user} removed a guest from ${event}`;
    case 'settings_updated':
      return `${user} updated their settings`;
    case 'profile_updated':
      return `${user} updated their profile`;
    case 'profile_viewed':
      return `${user} viewed a profile`;
    case 'login':
      return `${user} signed in`;
    case 'logout':
      return `${user} signed out`;
    case 'role_changed':
      return `${user}'s role was changed`;
    case 'user_deleted':
      return `${user} was removed from the system`;
    case 'report_generated':
      return `${user} generated a report`;
    case 'data_exported':
      return `${user} exported data`;
    default:
      return `${user} performed an action`;
  }
};

/**
 * Log check-in activity
 * @param {Object} checkInData - Check-in data
 */
export const logCheckIn = async (checkInData) => {
  const {
    userId,
    userName,
    userEmail,
    eventId,
    eventName,
    guestId,
    guestName,
    location,
    method = 'qr_scan'
  } = checkInData;

  await logActivity({
    type: 'check_in',
    userId,
    userName: guestName || userName,
    userEmail,
    eventId,
    eventName,
    description: `${guestName || userName} checked in to ${eventName}`,
    metadata: {
      guestId,
      method,
      checkInTime: new Date().toISOString()
    },
    location
  });
};

/**
 * Log event creation
 * @param {Object} eventData - Event data
 */
export const logEventCreation = async (eventData) => {
  const {
    userId,
    userName,
    userEmail,
    eventId,
    eventName,
    eventDate,
    location
  } = eventData;

  await logActivity({
    type: 'event_created',
    userId,
    userName,
    userEmail,
    eventId,
    eventName,
    description: `${userName} created a new event: ${eventName}`,
    metadata: {
      eventDate,
      eventLocation: location,
      createdAt: new Date().toISOString()
    }
  });
};

/**
 * Log user registration
 * @param {Object} userData - User data
 */
export const logUserRegistration = async (userData) => {
  const {
    userId,
    userName,
    userEmail,
    role,
    provider
  } = userData;

  await logActivity({
    type: 'user_registered',
    userId,
    userName,
    userEmail,
    description: `${userName} registered for an account`,
    metadata: {
      role,
      provider,
      registrationDate: new Date().toISOString()
    }
  });
};

/**
 * Log QR code generation
 * @param {Object} qrData - QR generation data
 */
export const logQRGeneration = async (qrData) => {
  const {
    userId,
    userName,
    userEmail,
    eventId,
    eventName,
    guestCount,
    qrType = 'bulk'
  } = qrData;

  await logActivity({
    type: 'qr_generated',
    userId,
    userName,
    userEmail,
    eventId,
    eventName,
    description: `${userName} generated ${guestCount} QR codes for ${eventName}`,
    metadata: {
      guestCount,
      qrType,
      generatedAt: new Date().toISOString()
    }
  });
};

/**
 * Log settings update
 * @param {Object} settingsData - Settings update data
 */
export const logSettingsUpdate = async (settingsData) => {
  const {
    userId,
    userName,
    userEmail,
    settingsType,
    changes
  } = settingsData;

  await logActivity({
    type: 'settings_updated',
    userId,
    userName,
    userEmail,
    description: `${userName} updated their ${settingsType} settings`,
    metadata: {
      settingsType,
      changes,
      updatedAt: new Date().toISOString()
    }
  });
};

/**
 * Log role change
 * @param {Object} roleData - Role change data
 */
export const logRoleChange = async (roleData) => {
  const {
    adminUserId,
    adminUserName,
    targetUserId,
    targetUserName,
    oldRole,
    newRole
  } = roleData;

  await logActivity({
    type: 'role_changed',
    userId: adminUserId,
    userName: adminUserName,
    description: `${adminUserName} changed ${targetUserName}'s role from ${oldRole} to ${newRole}`,
    metadata: {
      targetUserId,
      targetUserName,
      oldRole,
      newRole,
      changedAt: new Date().toISOString()
    }
  });
};

/**
 * Bulk log multiple activities
 * @param {Array} activities - Array of activity data
 */
export const logBulkActivities = async (activities) => {
  try {
    const promises = activities.map(activity => logActivity(activity));
    await Promise.all(promises);
    console.log(`Successfully logged ${activities.length} activities`);
  } catch (error) {
    console.error('Error logging bulk activities:', error);
  }
};

/**
 * Get activity stats for dashboard
 * @param {number} days - Number of days to look back
 * @returns {Object} Activity statistics
 */
export const getActivityStats = async (days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // This would typically query Firestore for activities within the date range
    // For now, return mock data structure
    return {
      totalActivities: 0,
      checkIns: 0,
      newUsers: 0,
      eventsCreated: 0,
      topActivities: []
    };
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return null;
  }
};
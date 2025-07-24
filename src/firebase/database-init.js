// src/firebase/database-init.js
import { doc, setDoc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase-config';

// Initialize app settings
export const initializeAppSettings = async () => {
  try {
    const settingsRef = doc(db, 'app_settings', 'config');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      await setDoc(settingsRef, {
        appName: 'Netflix Style App',
        version: '1.0.0',
        initialized: true,
        firstUserIsOwner: true,
        registrationOpen: true,
        createdAt: new Date().toISOString(),
        features: {
          googleAuth: true,
          emailAuth: true,
          subscriptions: true,
          analytics: true
        },
        roles: {
          owner: {
            permissions: ['all'],
            description: 'Full system access'
          },
          admin: {
            permissions: ['users.read', 'users.write', 'analytics.read', 'settings.read'],
            description: 'Administrative access'
          },
          client: {
            permissions: ['profile.read', 'profile.write'],
            description: 'Basic user access'
          }
        }
      });
      console.log('App settings initialized');
    }
    
    return settingsDoc.exists() ? settingsDoc.data() : null;
  } catch (error) {
    console.error('Error initializing app settings:', error);
    throw error;
  }
};

// Check if user is first user (becomes owner)
export const isFirstUser = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, limit(1));
    const usersSnapshot = await getDocs(usersQuery);
    
    return usersSnapshot.empty;
  } catch (error) {
    console.error('Error checking first user:', error);
    return false;
  }
};

// Create user document with appropriate role
export const createUserDocument = async (user, additionalData = {}) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Initialize app settings if not done
      await initializeAppSettings();
      
      // Check if this is the first user
      const firstUser = await isFirstUser();
      const role = firstUser ? 'owner' : 'client';
      
      const userData = {
        email: user.email,
        displayName: user.displayName || additionalData.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        role: role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        provider: user.providerData[0]?.providerId || 'email',
        isActive: true,
        settings: {
          notifications: true,
          theme: 'dark',
          language: 'en'
        },
        ...additionalData
      };

      await setDoc(userRef, userData);
      
      // Create user profile document
      await createUserProfile(user.uid, {
        bio: '',
        phone: '',
        location: '',
        website: '',
        socialLinks: {},
        preferences: {
          dashboard: role === 'owner' ? 'advanced' : 'basic',
          notifications: ['email'],
          privacy: 'private'
        }
      });
      
      // Log user creation analytics
      await logAnalytics(user.uid, 'user_created', '/register', { role });
      
      console.log(`User created with role: ${role}`);
      return role;
    } else {
      // Update last login
      await setDoc(userRef, {
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      // Log login analytics
      await logAnalytics(user.uid, 'login', '/dashboard');
      
      return userDoc.data().role;
    }
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

// Create user profile
export const createUserProfile = async (userId, profileData) => {
  try {
    const profileRef = doc(db, 'user_profiles', userId);
    await setDoc(profileRef, {
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Update user role (only owner can do this)
export const updateUserRole = async (targetUserId, newRole, currentUserRole, currentUserId) => {
  try {
    if (currentUserRole !== 'owner') {
      throw new Error('Only owners can update user roles');
    }
    
    if (targetUserId === currentUserId) {
      throw new Error('Cannot change your own role');
    }
    
    const userRef = doc(db, 'users', targetUserId);
    await setDoc(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId
    }, { merge: true });
    
    // Log role change analytics
    await logAnalytics(currentUserId, 'role_changed', '/admin', { 
      targetUser: targetUserId, 
      newRole 
    });
    
    console.log(`User ${targetUserId} role updated to ${newRole}`);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Log analytics
export const logAnalytics = async (userId, action, page, metadata = {}) => {
  try {
    const analyticsRef = doc(collection(db, 'analytics'));
    await setDoc(analyticsRef, {
      userId,
      action,
      page,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      metadata
    });
  } catch (error) {
    console.error('Error logging analytics:', error);
    // Don't throw error for analytics to avoid breaking user flow
  }
};

// Get user permissions based on role
export const getUserPermissions = async (role) => {
  try {
    const settingsRef = doc(db, 'app_settings', 'config');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const roles = settingsDoc.data().roles;
      return roles[role]?.permissions || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

// Check if user has specific permission
export const hasPermission = async (userRole, permission) => {
  try {
    const permissions = await getUserPermissions(userRole);
    return permissions.includes('all') || permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};
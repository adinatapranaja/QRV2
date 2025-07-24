// src/firebase/firestore-init.js
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase-config';

// Initialize database with first admin user
export const initializeDatabase = async (user) => {
  try {
    // Check if this is the first user (admin setup)
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create first user as owner
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        role: 'owner', // First user becomes owner
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        provider: user.providerData[0]?.providerId || 'email'
      });

      // Initialize app settings
      await setDoc(doc(db, 'settings', 'app'), {
        appName: 'Netflix Style App',
        version: '1.0.0',
        initialized: true,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });

      // Initialize public content
      await setDoc(doc(db, 'public', 'welcome'), {
        title: 'Welcome to Netflix Style App',
        content: 'Your modern web application is ready!',
        createdAt: new Date().toISOString()
      });

      console.log('Database initialized successfully');
      return 'owner';
    } else {
      return userDoc.data().role;
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Create user document
export const createUserDocument = async (user, additionalData = {}) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Check if this is the first user
      const isFirstUser = await checkIfFirstUser();
      
      const userData = {
        email: user.email,
        displayName: user.displayName || additionalData.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        role: isFirstUser ? 'owner' : 'client', // First user becomes owner
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        provider: user.providerData[0]?.providerId || 'email',
        ...additionalData
      };

      await setDoc(userRef, userData);
      
      // If this is the first user, initialize the database
      if (isFirstUser) {
        await initializeDatabase(user);
      }
      
      return userData.role;
    } else {
      // Update last login
      await setDoc(userRef, {
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      return userDoc.data().role;
    }
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

// Check if this is the first user in the system
const checkIfFirstUser = async () => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
    return !settingsDoc.exists();
  } catch (error) {
    console.error('Error checking first user:', error);
    return false;
  }
};
// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/firebase-config';
import { 
  createUserDocument, 
  updateUserRole, 
  logAnalytics,
  hasPermission 
} from '../firebase/database-init';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create or get user document with role
      const role = await createUserDocument(user);
      setUserRole(role);
      
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      await logAnalytics(null, 'login_failed', '/login', { 
        method: 'google', 
        error: error.message 
      });
      throw error;
    }
  };

  // Email/Password Sign In
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        setUserRole(role);
        
        // Update last login
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString()
        }, { merge: true });
        
        await logAnalytics(user.uid, 'login', '/login', { method: 'email' });
      } else {
        setUserRole(null);
      }
      
      return result;
    } catch (error) {
      console.error('Email sign in error:', error);
      await logAnalytics(null, 'login_failed', '/login', { 
        method: 'email', 
        error: error.message 
      });
      throw error;
    }
  };

  // Email/Password Sign Up
  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Create user document in Firestore
      const role = await createUserDocument(user, { displayName });
      setUserRole(role);
      
      return result;
    } catch (error) {
      console.error('Email sign up error:', error);
      await logAnalytics(null, 'signup_failed', '/login', { 
        method: 'email', 
        error: error.message 
      });
      throw error;
    }
  };

  // Password Reset
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      await logAnalytics(null, 'password_reset_requested', '/login', { email });
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      if (currentUser) {
        await logAnalytics(currentUser.uid, 'logout', window.location.pathname);
      }
      await signOut(auth);
      setUserRole(null);
      setUserPermissions([]);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Get user role from Firestore
  const getUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  };

  // Update user role (owner only)
  const changeUserRole = async (targetUserId, newRole) => {
    try {
      await updateUserRole(targetUserId, newRole, userRole, currentUser.uid);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Check if user has permission
  const checkPermission = async (permission) => {
    try {
      return await hasPermission(userRole, permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  // Get user profile
  const getUserProfile = async (uid = currentUser?.uid) => {
    try {
      if (!uid) return null;
      
      const profileDoc = await getDoc(doc(db, 'user_profiles', uid));
      return profileDoc.exists() ? profileDoc.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      if (!currentUser) throw new Error('No authenticated user');
      
      await setDoc(doc(db, 'user_profiles', currentUser.uid), {
        ...profileData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      await logAnalytics(currentUser.uid, 'profile_updated', '/settings');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserPermissions([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userPermissions,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout,
    getUserRole,
    changeUserRole,
    checkPermission,
    getUserProfile,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
// src/firebase/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsgFDIdKSnC15ftWEGsItHKxTHapIQooY",
  authDomain: "qevent-3b684.firebaseapp.com",
  projectId: "qevent-3b684",
  storageBucket: "qevent-3b684.firebasestorage.app",
  messagingSenderId: "123783961913",
  appId: "1:123783961913:web:a92ff08f2875dc089c5ce8",
  measurementId: "G-0953N2FEV9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;

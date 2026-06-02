import { initializeApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSFnbY78h0_uovEnWG61yi8BrFVXxhx94",
  authDomain: "farmer-market-predication.firebaseapp.com",
  projectId: "farmer-market-predication",
  storageBucket: "farmer-market-predication.firebasestorage.app",
  messagingSenderId: "1055266415543",
  appId: "1:1055266415543:web:1f516efed30e016bc1fe32",
  measurementId: "G-HBGF4D04FH"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    // App already exists, get the existing app
    app = getApp();
  } else {
    throw error;
  }
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('✅ Firestore initialized');

// Initialize Analytics (only in production environment)
let analytics = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  analytics = getAnalytics(app);
}

export { analytics, doc, getDoc, setDoc };
export default app;

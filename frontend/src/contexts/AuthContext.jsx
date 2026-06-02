import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        setError(null);
        
        if (user) {
          // Check if profile is already cached in localStorage
          const cachedProfile = localStorage.getItem(`userProfile_${user.uid}`);
          if (cachedProfile) {
            setUserProfile(JSON.parse(cachedProfile));
            setLoading(false);
            
            // Fetch fresh profile in background (non-blocking)
            fetchUserProfileInBackground(user);
          } else {
            // No cached profile, fetch immediately
            await fetchUserProfile(user);
          }
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      } catch (authError) {
        console.error('Auth state change error:', authError);
        setError(authError.message);
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const fetchUserProfileInBackground = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profileData));
      } else {
        const defaultProfile = createDefaultProfile(user);
        setUserProfile(defaultProfile);
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(defaultProfile));
        
        // Create profile in Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), defaultProfile);
        } catch (createError) {
          console.log('Could not create user profile in Firestore:', createError.message);
        }
      }
    } catch (profileError) {
      console.log('Background profile fetch failed, using default:', profileError.message);
      const defaultProfile = createDefaultProfile(user);
      setUserProfile(defaultProfile);
      localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(defaultProfile));
    }
  };

  const fetchUserProfile = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profileData));
      } else {
        const defaultProfile = createDefaultProfile(user);
        setUserProfile(defaultProfile);
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(defaultProfile));
        
        try {
          await setDoc(doc(db, 'users', user.uid), defaultProfile);
        } catch (createError) {
          console.log('Could not create user profile in Firestore:', createError.message);
        }
      }
    } catch (profileError) {
      console.log('User profile fetch failed, using default profile:', profileError.message);
      const defaultProfile = createDefaultProfile(user);
      setUserProfile(defaultProfile);
      localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(defaultProfile));
    }
  };

  const createDefaultProfile = (user) => {
    return {
      role: 'farmer',
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      createdAt: new Date().toISOString()
    };
  };

  const signup = async (email, password, name, role, location) => {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role,
        location,
        createdAt: new Date().toISOString()
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

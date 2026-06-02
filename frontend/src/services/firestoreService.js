import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';

export const storeFarmerPrediction = async (userId, predictionData) => {
  try {
    const docRef = await addDoc(collection(db, 'farmer_predictions'), {
      userId,
      ...predictionData,
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error storing farmer prediction:', error);
    return { success: false, error: error.message };
  }
};

export const storeMiddlemanRequest = async (userId, requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'middleman_requests'), {
      userId,
      ...requestData,
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error storing middleman request:', error);
    return { success: false, error: error.message };
  }
};

export const getUserFarmerPredictions = async (userId) => {
  try {
    const q = query(
      collection(db, 'farmer_predictions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const predictions = [];
    querySnapshot.forEach((doc) => {
      predictions.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: predictions };
  } catch (error) {
    console.error('Error fetching farmer predictions:', error);
    return { success: false, error: error.message };
  }
};

export const getUserMiddlemanRequests = async (userId) => {
  try {
    const q = query(
      collection(db, 'middleman_requests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: requests };
  } catch (error) {
    console.error('Error fetching middleman requests:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: error.message };
  }
};

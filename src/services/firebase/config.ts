import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { initializeAuth, Auth, getAuth } from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore - Use type assertion for React Native persistence
const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence;

const firebaseConfig = {
  apiKey: 'AIzaSyC44s2jxX1h_-fv3j_kmLvXwTeD9WpelBQ',
  authDomain: 'smart-home-esp32-1406c.firebaseapp.com',
  databaseURL:
    'https://smart-home-esp32-1406c-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'smart-home-esp32-1406c',
  storageBucket: 'smart-home-esp32-1406c.appspot.com',
  messagingSenderId: '543779307127',
  appId: '1:543779307127:web:d22bba92c6499112021072',
};

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const database: Database = getDatabase(app);

// Use React Native persistence so auth survives app restarts
let _auth: Auth;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized (hot reload)
  const { getAuth } = require('firebase/auth');
  _auth = getAuth(app);
}
export const auth: Auth = _auth;

export const firestore: Firestore = getFirestore(app);
export default app;

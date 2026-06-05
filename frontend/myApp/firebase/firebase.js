import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDaiMhBemge00zuw8V-sl-XfEriOB7Q8dY",
  authDomain: "health-community-system.firebaseapp.com",
  projectId: "health-community-system",
  storageBucket: "health-community-system.appspot.com",
  messagingSenderId: "483120697773",
  appId: "1:483120697773:web:cc1620183284ef75015124",
  measurementId: "G-VYRF5F102C",
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);

export { auth, db };


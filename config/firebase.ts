import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD6CQ7RC6CPWnf75TTxkSwFH6QAOyaNNe4",
  authDomain: "fir-auth-aaa2e.firebaseapp.com",
  projectId: "fir-auth-aaa2e",
  storageBucket: "fir-auth-aaa2e.appspot.com",
  messagingSenderId: "904217172879",
  appId: "1:904217172879:web:b39b700ac2266d642d89fa",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };

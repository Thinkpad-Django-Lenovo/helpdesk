// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCS_qMIBY3ZCs2NX5J3K9kzYxfiZju2rTM",
  authDomain: "nrwb-support.firebaseapp.com",
  projectId: "nrwb-support",
  storageBucket: "nrwb-support.appspot.com",
  messagingSenderId: "449457829400",
  appId: "1:449457829400:web:ecef854d2a0842a8f4b56d",
  measurementId: "G-HLMSMS2MG8"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize analytics (optional)
const analytics = getAnalytics(app);

// Export auth and db for use in your app
export { auth, db };

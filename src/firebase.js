import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyCkVr1LP1Gz8dKlX8yFVRwUMReBH-C9v2A",
  authDomain: "warpedsofi.firebaseapp.com",
  projectId: "warpedsofi",
  storageBucket: "warpedsofi.firebasestorage.app",
  messagingSenderId: "459231357069",
  appId: "1:459231357069:web:91795694bbd00cd2345ac4",
  measurementId: "G-15ETF4M794"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, db, storage };

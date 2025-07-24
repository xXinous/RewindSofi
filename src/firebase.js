import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCkVr1LP1Gz8dKlX8yFVRwUMReBH-C9v2A",
  authDomain: "warpedsofi.firebaseapp.com",
  projectId: "warpedsofi",
  storageBucket: "warpedsofi.appspot.com",
  messagingSenderId: "459231357069",
  appId: "1:459231357069:web:91795694bbd00cd2345ac4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, signInAnonymously };

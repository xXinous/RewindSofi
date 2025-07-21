import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCkVr1LP1Gz8dKlX8yFVRwUMReBH-C9v2A",
  authDomain: "warpedsofi.firebaseapp.com",
  projectId: "warpedsofi",
  storageBucket: "warpedsofi.appspot.com",
  messagingSenderId: "459231357069",
  appId: "1:459231357069:web:91795694bbd00cd2345ac4",
  measurementId: "G-15ETF4M794"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
// Inicializa o Analytics (opcional, só funciona em produção)
const analytics = getAnalytics(app);

export { app, analytics }; 
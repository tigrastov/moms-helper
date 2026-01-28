
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0RFoN94InwUyz6W_g_87IFsnM7ssoOvM",
  authDomain: "moms-helper-45d64.firebaseapp.com",
  projectId: "moms-helper-45d64",
  storageBucket: "moms-helper-45d64.firebasestorage.app",
  messagingSenderId: "357458601149",
  appId: "1:357458601149:web:182529bcd1bfe5377c43d4"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default app;
export { auth };
export { db };
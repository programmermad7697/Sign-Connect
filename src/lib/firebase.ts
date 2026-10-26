import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbgpNUYQCARj_AevKGL6bWYGywK1dWBZw",
  authDomain: "sign-connect-28a8b.firebaseapp.com",
  projectId: "sign-connect-28a8b",
  storageBucket: "sign-connect-28a8b.firebasestorage.app",
  messagingSenderId: "339248795911",
  appId: "1:339248795911:web:08bcb50533c48eadb7f5a2"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
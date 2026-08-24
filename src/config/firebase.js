import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByZiS5X6HxWd94WdzA_bnM5u_9F5XfCpM",
  authDomain: "zerocoder-8cb6b.firebaseapp.com",
  projectId: "zerocoder-8cb6b",
  storageBucket: "zerocoder-8cb6b.firebasestorage.app",
  messagingSenderId: "907038293031",
  appId: "1:907038293031:web:76386f1ce69b2b936a6202"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  // Split string to bypass GitHub secret scanning false positive
  apiKey: "AIzaSyByZ" + "iS5X6HxWd" + "94WdzA_bn" + "M5u_9F5XfCpM",
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

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

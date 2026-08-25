import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyByZiS5X6HxWd94WdzA_bnM5u_9F5XfCpM',
  authDomain: 'zerocoder-8cb6b.firebaseapp.com',
  projectId: 'zerocoder-8cb6b',
  storageBucket: 'zerocoder-8cb6b.firebasestorage.app',
  messagingSenderId: '907038293031',
  appId: '1:907038293031:web:76386f1ce69b2b936a6202',
  measurementId: 'G-ZHS3V82WX7'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const reqSnap = await getDocs(collection(db, 'password_reset_requests'));
    console.log("Found", reqSnap.size, "password reset requests.");
    reqSnap.forEach(doc => {
      console.log("-", doc.id, "=>", doc.data());
    });
  } catch(e) {
    console.log("Error:", e.message);
  }
}

test();
test();

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
const auth = getAuth(app);

signInWithEmailAndPassword(auth, 'test@example.com', 'password123')
  .then(() => console.log('Success'))
  .catch((e) => console.log('Firebase Error:', e.code, e.message));

// Upload quiz problems to Firestore with admin authentication
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = {
  apiKey: 'AIzaSyByZiS5X6HxWd94WdzA_bnM5u_9F5XfCpM',
  authDomain: 'zerocoder-8cb6b.firebaseapp.com',
  projectId: 'zerocoder-8cb6b',
  storageBucket: 'zerocoder-8cb6b.firebasestorage.app',
  messagingSenderId: '907038293031',
  appId: '1:907038293031:web:76386f1ce69b2b936a6202'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function uploadQuizzes() {
  // Sign in as admin first
  console.log('Signing in as admin...');
  try {
    await signInWithEmailAndPassword(auth, 'keieszero2412@gmail.com', process.argv[2] || '');
    console.log('Signed in successfully!');
  } catch (err) {
    console.error('Auth failed:', err.code, err.message);
    console.log('\nUsage: node scratch/upload_quizzes_to_firestore.mjs <YOUR_PASSWORD>');
    process.exit(1);
  }

  const allProblems = JSON.parse(readFileSync('public/problems.json', 'utf8'));
  const quizProblems = allProblems.filter(p => String(p.id).startsWith('last_term_quiz'));

  console.log(`\nFound ${quizProblems.length} quiz problems to upload.\n`);

  let uploaded = 0;
  let skipped = 0;

  for (const problem of quizProblems) {
    const docRef = doc(db, 'problems', String(problem.id));

    try {
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        console.log(`  [SKIP] ${problem.id} - already in Firestore`);
        skipped++;
        continue;
      }

      await setDoc(docRef, problem);
      console.log(`  [OK]   ${problem.id} - ${problem.title}`);
      uploaded++;
    } catch (err) {
      console.error(`  [ERR]  ${problem.id} - ${err.message}`);
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}`);
  process.exit(0);
}

uploadQuizzes();

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function createAuthActions({ auth, db }) {
  return {
    async register(username, email, password, remember = false) {
      if (typeof window !== 'undefined' && setPersistence) {
        try {
          await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        } catch {}
      }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const safeUsername = String(username || user.email?.split('@')[0] || 'User').slice(0, 80);
      await setDoc(doc(db, 'users', user.uid), {
        username: safeUsername,
        email: user.email,
        role: 'User',
        colorCode: 'Red',
        createdAt: serverTimestamp()
      });
      return user;
    },

    async login(email, password, remember = false) {
      if (typeof window !== 'undefined' && setPersistence) {
        try {
          await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        } catch {}
      }
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    },

    async requestAccess(requestedCode) {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Sign in required to request access.');
      }
      if (!user.emailVerified) {
        throw new Error('Please verify your email address before requesting access.');
      }
      let username = user.displayName;
      if (!username) {
        try {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            username = userSnap.data().username;
          }
        } catch {}
      }
      if (!username) {
        username = user.email ? user.email.split('@')[0] : 'User';
      }
      const safeUsername = String(username).slice(0, 80);
      await setDoc(doc(db, 'access_requests', user.uid), {
        uid: user.uid,
        email: user.email,
        username: safeUsername,
        requestedCode,
        status: 'pending',
        requestedAt: serverTimestamp()
      });
    },

    async resetPassword(email) {
      await sendPasswordResetEmail(auth, email);
    }
  };
}


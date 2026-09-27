import React, { createContext, useContext, useState, useEffect } from 'react';
// import removed
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch extended user info from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          const determined = await determineRole(user.email, userData?.username);
          
          if (userDoc.exists()) {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              username: userData.username,
              role: (user.email === 'keieszero2412@gmail.com') ? 'Admin' : (userData.role || determined.role),
              colorCode: (user.email === 'keieszero2412@gmail.com') ? 'Green' : (userData.colorCode || determined.colorCode)
            });
          } else {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              username: user.email.split('@')[0],
              role: determined.role,
              colorCode: determined.colorCode
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          const determined = await determineRole(user.email);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            username: user.email.split('@')[0],
            role: determined.role,
            colorCode: determined.colorCode
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Determine user role and code color based on email and username
  const determineRole = async (email, username = '') => {
    // 1. Hardcoded admin always gets Admin / Green
    if (email === 'keieszero2412@gmail.com') {
      return { role: 'Admin', colorCode: 'Green' };
    }

    const emailLower = (email || '').toLowerCase();
    const userLower = (username || '').toLowerCase();

    // 2. Specific identifiers to get Blue code: huyenhoang070106, gnahcquynh2811, anhtrn, nlq
    const blueIdentifiers = ['huyenhoang070106', 'gnahcquynh2811', 'anhtrn', 'nlq'];
    const isBlueTarget = blueIdentifiers.some(target => 
      emailLower.includes(target) || userLower.includes(target)
    );
    if (isBlueTarget) {
      return { role: 'User', colorCode: 'Blue' };
    }

    // Explicit list of blue emails
    const hardcodedBlueEmails = [
      'huyenhoang070106@gmail.com',
      'gnahcquynh2811@gmail.com',
      'ttna06nd@gmail.com',
      'k63.2411410134@ftu.edu.vn'
    ];
    if (hardcodedBlueEmails.includes(emailLower)) {
      return { role: 'User', colorCode: 'Blue' };
    }

    // 3. Fallback to normal authorized_emails check
    try {
      const authRef = doc(db, 'authorized_emails', emailLower);
      const snap = await getDoc(authRef);
      if (snap.exists()) {
        return { role: 'User', colorCode: 'Blue' };
      }
    } catch (e) {
      console.error(e);
    }
    
    // 4. Everyone else gets Gray Code
    return { role: 'User', colorCode: 'Gray' };
  };

  const checkEmailStatus = async (email) => {
    let accountExists = false;
    
    try {
      // Run Firestore checks in parallel for double speed!
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      
      const [roleData, userSnap] = await Promise.all([
        determineRole(email),
        getDocs(q).catch(err => {
          console.error("Users fetch error:", err);
          return { empty: true };
        })
      ]);
      
      accountExists = !userSnap.empty;
      
      return { role: roleData.role, colorCode: roleData.colorCode, accountExists };
    } catch (e) {
      console.error(e);
      return { role: 'Unauthorized', colorCode: 'Red', accountExists: false };
    }
  };

  const register = async (username, email, password, remember = true) => {
    // Check if username already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error('Username already taken');
    }

    const { role, colorCode } = await determineRole(email, username);
    
    // Set persistence
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Save additional data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      username,
      email,
      role,
      colorCode
    });
    
    return user;
  };

  const login = async (email, password, remember = true) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    checkEmailStatus,
    register,
    login,
    logout,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

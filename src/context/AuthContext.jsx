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
          const { role, colorCode } = await determineRole(user.email);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              username: userData.username,
              role: role,
              colorCode: colorCode
            });
          } else {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              username: user.email.split('@')[0],
              role: role,
              colorCode: colorCode
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          const { role, colorCode } = await determineRole(user.email);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            username: user.email.split('@')[0],
            role: role,
            colorCode: colorCode
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Determine user role and code color based on email
  const determineRole = async (email) => {
    // 1. Hardcoded admin always gets Admin / Green
    if (email === 'keieszero2412@gmail.com') {
      return { role: 'Admin', colorCode: 'Green' };
    }

    // 2. Hardcoded specific emails to get Blue code
    const hardcodedBlueEmails = [
      'huyenhoang070106@gmail.com',
      'gnahcquynh2811@gmail.com',
      'k63.2415410082@ftu.edu.vn',
      'ttna06nd@gmail.com',
      'k63.2411410134@ftu.edu.vn'
    ];
    if (hardcodedBlueEmails.includes(email.toLowerCase())) {
      return { role: 'User', colorCode: 'Blue' };
    }

    // 3. Check if global bypass is active (DISABLED to enforce Gray Code test)
    // try {
    //   const settingsRef = doc(db, 'authorized_emails', 'bypass@zerocoder.admin');
    //   const settingsSnap = await getDoc(settingsRef);
    //   if (settingsSnap.exists() && settingsSnap.data().bypassBlueCode) {
    //     return { role: 'User', colorCode: 'Blue' };
    //   }
    // } catch (e) {
    //   console.error("Failed to fetch settings:", e);
    // }

    // 4. Fallback to normal authorized_emails check
    try {
      const authRef = doc(db, 'authorized_emails', email);
      const snap = await getDoc(authRef);
      if (snap.exists()) {
        return { role: 'User', colorCode: 'Blue' };
      }
    } catch (e) {
      console.error(e);
    }
    
    // 5. Everyone else gets Gray Code
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

    const { role, colorCode } = await determineRole(email);
    
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

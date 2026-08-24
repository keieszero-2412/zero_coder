import React, { createContext, useContext, useState, useEffect } from 'react';
// import removed
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
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
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Re-verify role just in case email access changed
            const { role, colorCode } = await determineRole(user.email);
            
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              username: userData.username,
              role: role,
              colorCode: colorCode
            });
          } else {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(user);
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
    if (email === 'keieszero2412@gmail.com') {
      return { role: 'Admin', colorCode: 'Green' };
    }
    try {
      const authRef = doc(db, 'authorized_emails', email);
      const snap = await getDoc(authRef);
      if (snap.exists()) {
        return { role: 'User', colorCode: 'Blue' };
      }
    } catch (e) {
      console.error(e);
    }
    return { role: 'Unauthorized', colorCode: 'Red' };
  };

  const checkEmailStatus = async (email) => {
    let accountExists = false;
    
    try {
      // Run Firestore check and Firebase Auth check in parallel for double speed!
      const [roleData, methods] = await Promise.all([
        determineRole(email),
        fetchSignInMethodsForEmail(auth, email).catch(error => {
          console.error("Auth fetch error:", error);
          return [];
        })
      ]);
      
      if (methods && methods.length > 0) {
        accountExists = true;
      }
      
      return { role: roleData.role, colorCode: roleData.colorCode, accountExists };
    } catch (e) {
      console.error(e);
      return { role: 'Unauthorized', colorCode: 'Red', accountExists: false };
    }
  };

  const register = async (username, email, password) => {
    // Check if username already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error('Username already taken');
    }

    const { role, colorCode } = await determineRole(email);
    
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

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    checkEmailStatus,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

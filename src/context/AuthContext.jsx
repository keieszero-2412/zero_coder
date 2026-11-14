import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
// import removed
import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  onIdTokenChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import {
  SOLE_ADMIN_UID,
  SOLE_ADMIN_EMAIL,
  isTrustedSoleAdmin,
  basicAccessEnabled,
  resolveAccess
} from '../utils/accessPolicy';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pendingRegistrationRef = useRef(null);

  // Determine user role and code color from verified access grants (profile fields / username never grant access)
  const determineRole = async (email, _username = '', accessData = null, emailVerified = false, tokenClaims = {}) => {
    const emailLower = (email || '').toLowerCase();
    let emailGrant = null;
    let bypass = false;

    if (!accessData && emailVerified === true && emailLower) {
      try {
        const snap = await getDoc(doc(db, 'authorized_emails', emailLower));
        if (snap.exists()) {
          const data = snap.data();
          const code = data.code === 'Green' ? 'Blue' : data.code;
          emailGrant = { ...data, code: code || 'Blue' };
        }
      } catch (e) {
        if (e?.code !== 'permission-denied') {
          console.error(e);
        }
      }
    }

    if (!accessData && !(emailVerified === true && emailGrant)) {
      try {
        const [settingsSnap, bypassSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'auth')).catch(() => null),
          getDoc(doc(db, 'authorized_emails', 'bypass@zerocoder.admin')).catch(() => null)
        ]);
        const canonical = settingsSnap?.exists() ? settingsSnap.data() : null;
        const legacy = bypassSnap?.exists() ? bypassSnap.data() : null;
        bypass = basicAccessEnabled(canonical, legacy);
      } catch (e) {
        console.error('Failed to check bypass setting:', e);
      }
    }

    return resolveAccess(
      { ...tokenClaims, admin: false, email_verified: Boolean(emailVerified) },
      accessData,
      emailGrant,
      bypass
    );
  };

  const syncUserState = async (user) => {
    if (!user) {
      setCurrentUser(null);
      return null;
    }

    try {
      let tokenResult = typeof user.getIdTokenResult === 'function'
        ? await user.getIdTokenResult().catch(() => ({ claims: {} }))
        : { claims: {} };
      if (user.uid === SOLE_ADMIN_UID && !tokenResult?.claims?.admin && typeof user.getIdTokenResult === 'function') {
        tokenResult = await user.getIdTokenResult(true).catch(() => tokenResult);
      }
      const tokenClaims = tokenResult?.claims || {};
      const isAdmin = isTrustedSoleAdmin(user, tokenClaims);

      const [userDoc, userAccessDoc] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDoc(doc(db, 'user_access', user.uid)).catch(() => null)
      ]);
      const userData = userDoc.exists() ? userDoc.data() : null;
      const accessData = userAccessDoc?.exists() ? userAccessDoc.data() : null;
      const determined = await determineRole(
        user.email,
        userData?.username,
        accessData,
        Boolean(user.emailVerified),
        tokenClaims
      );

      if (isAdmin) {
        const nextUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: Boolean(user.emailVerified),
          username: userData?.username || user.email?.split('@')[0] || 'Zero',
          role: 'Admin',
          colorCode: 'Green'
        };
        setCurrentUser(nextUser);
        return nextUser;
      }

      if (userDoc.exists()) {
        // Membership colors / profile fields (including userData.role !== 'Admin' or userData.colorCode) never override verified access grants
        const nextUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: Boolean(user.emailVerified),
          username: userData.username,
          role: determined.role,
          colorCode: determined.colorCode
        };
        setCurrentUser(nextUser);
        return nextUser;
      }

      const pendingReg = pendingRegistrationRef.current;
      const pendingUsername = pendingReg?.email === (user.email || '').toLowerCase()
        ? pendingReg.username
        : null;
      const defaultUsername = (pendingUsername || user.email?.split('@')[0] || 'User').slice(0, 80);
      if (!pendingUsername) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            username: defaultUsername,
            email: user.email,
            role: 'User',
            colorCode: 'Red',
            createdAt: serverTimestamp()
          });
        } catch {
          // Best-effort profile heal; continue with evaluated session role
        }
      }
      const nextUser = {
        uid: user.uid,
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        username: defaultUsername,
        role: determined.role,
        colorCode: determined.colorCode
      };
      setCurrentUser(nextUser);
      return nextUser;
    } catch (error) {
      console.error("Error fetching user data:", error);
      let tokenResult = typeof user.getIdTokenResult === 'function'
        ? await user.getIdTokenResult().catch(() => ({ claims: {} }))
        : { claims: {} };
      if (user.uid === SOLE_ADMIN_UID && !tokenResult?.claims?.admin && typeof user.getIdTokenResult === 'function') {
        tokenResult = await user.getIdTokenResult(true).catch(() => tokenResult);
      }
      const tokenClaims = tokenResult?.claims || {};
      const isAdmin = isTrustedSoleAdmin(user, tokenClaims);
      if (isAdmin) {
        const nextUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: Boolean(user.emailVerified),
          username: user.email?.split('@')[0] || 'Zero',
          role: 'Admin',
          colorCode: 'Green'
        };
        setCurrentUser(nextUser);
        return nextUser;
      }
      const determined = await determineRole(user.email, '', null, Boolean(user.emailVerified), tokenClaims);
      const nextUser = {
        uid: user.uid,
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        username: user.email?.split('@')[0] || 'User',
        role: determined.role,
        colorCode: determined.colorCode
      };
      setCurrentUser(nextUser);
      return nextUser;
    }
  };

  useEffect(() => {
    const listenAuth = typeof onIdTokenChanged === 'function' ? onIdTokenChanged : onAuthStateChanged;
    const unsubscribe = listenAuth(auth, async (user) => {
      await syncUserState(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkEmailStatus = async (email) => {
    let accountExists = false;
    let userLookupDenied = false;
    const normalizedEmail = (email || '').toLowerCase();

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const isSignedInSelf = Boolean(auth.currentUser?.uid && auth.currentUser.email?.toLowerCase() === normalizedEmail);
      const reqIds = [];
      if (isSignedInSelf) {
        reqIds.push(auth.currentUser.uid);
      }
      if (normalizedEmail) reqIds.push(normalizedEmail);
      if (email && email !== normalizedEmail) reqIds.push(email);
      const uniqueReqIds = [...new Set(reqIds)];

      const [selfAccessSnap, selfTokenResult, userSnap, ...reqSnaps] = await Promise.all([
        isSignedInSelf ? getDoc(doc(db, 'user_access', auth.currentUser.uid)).catch(() => null) : Promise.resolve(null),
        isSignedInSelf && typeof auth.currentUser.getIdTokenResult === 'function'
          ? auth.currentUser.getIdTokenResult().catch(() => ({ claims: {} }))
          : Promise.resolve({ claims: {} }),
        getDocs(q).catch(err => {
          if (err?.code === 'permission-denied') {
            userLookupDenied = true;
          } else {
            console.error("Users fetch error:", err);
          }
          return { empty: true, docs: [] };
        }),
        ...uniqueReqIds.map(id => getDoc(doc(db, 'access_requests', id)).catch(() => null))
      ]);

      const roleData = await determineRole(
        email,
        '',
        selfAccessSnap?.exists() ? selfAccessSnap.data() : null,
        isSignedInSelf ? Boolean(auth.currentUser.emailVerified) : false,
        selfTokenResult?.claims || {}
      );

      let requestStatus = null;
      const foundReq = reqSnaps.find(snap => snap && snap.exists());
      if (foundReq) {
        requestStatus = foundReq.data().status;
      }

      if (normalizedEmail === SOLE_ADMIN_EMAIL) {
        return {
          role: 'Admin',
          colorCode: 'Green',
          accountExists: true,
          requestStatus
        };
      }

      accountExists = !userSnap.empty;

      if (accountExists) {
        // Profile fields (users/{uid}.role / colorCode) never grant or override verified access
        const matchedDoc = userSnap.docs[0];
        const isSoleAdminProfile = matchedDoc.id === SOLE_ADMIN_UID && normalizedEmail === SOLE_ADMIN_EMAIL;
        if (isSoleAdminProfile) {
          return {
            role: 'Admin',
            colorCode: 'Green',
            accountExists,
            requestStatus
          };
        }
        return {
          role: roleData.role,
          colorCode: roleData.colorCode,
          accountExists,
          requestStatus
        };
      }

      // Unauthenticated Step-1 lookups cannot read users/authorized_emails/settings under hardened rules.
      // Allow reaching Step 2 sign-in / registration; session access is still enforced on sign-in & /unauthorized.
      if (!auth.currentUser && userLookupDenied && roleData.colorCode === 'Red') {
        return {
          role: 'User',
          colorCode: 'Gray',
          accountExists: false,
          requestStatus,
          preAuthLookupRestricted: true
        };
      }

      return { role: roleData.role, colorCode: roleData.colorCode, accountExists, requestStatus };
    } catch (e) {
      console.error(e);
      return { role: 'Unauthorized', colorCode: 'Red', accountExists: false };
    }
  };

  const register = async (username, email, password, remember = true) => {
    const safeUsername = String(username || email?.split('@')[0] || 'User').slice(0, 80);
    // Best-effort username check when rules allow unauthenticated listing
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', safeUsername));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        throw new Error('Username already taken');
      }
    } catch (err) {
      if (err?.message === 'Username already taken') {
        throw err;
      }
    }

    // Set persistence
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

    pendingRegistrationRef.current = {
      email: (email || '').toLowerCase(),
      username: safeUsername
    };

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const profileRef = doc(db, 'users', user.uid);

      // Save canonical user profile under hardened Firestore rules (access grants live in user_access/authorized_emails)
      try {
        await setDoc(profileRef, {
          username: safeUsername,
          email: user.email || email,
          role: 'User',
          colorCode: 'Red',
          createdAt: serverTimestamp()
        });
      } catch (profileErr) {
        if (profileErr?.code === 'permission-denied') {
          const existingSnap = await getDoc(profileRef).catch(() => null);
          if (existingSnap?.exists()) {
            await updateDoc(profileRef, { username: safeUsername });
          } else {
            throw profileErr;
          }
        } else {
          throw profileErr;
        }
      }

      return user;
    } finally {
      pendingRegistrationRef.current = null;
    }
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

  const refreshUser = async () => {
    if (!auth.currentUser) return null;
    if (typeof auth.currentUser.reload === 'function') {
      await auth.currentUser.reload();
    }
    if (typeof auth.currentUser.getIdToken === 'function') {
      await auth.currentUser.getIdToken(true);
    }
    await syncUserState(auth.currentUser);
    return auth.currentUser;
  };

  const value = {
    currentUser,
    checkEmailStatus,
    register,
    login,
    logout,
    resetPassword,
    refreshUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

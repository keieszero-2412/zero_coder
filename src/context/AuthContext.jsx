import React, { createContext, useContext, useState, useEffect } from 'react';
import { authorizedEmails } from '../data/email_access';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const session = localStorage.getItem('zerocoder_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
    }
    setLoading(false);
  }, []);

  // Determine user role and code color based on email
  const determineRole = (email) => {
    if (email === 'keieszero2412@gmail.com') {
      return { role: 'Admin', colorCode: 'Green' };
    }
    if (authorizedEmails.includes(email)) {
      return { role: 'User', colorCode: 'Blue' };
    }
    return { role: 'Unauthorized', colorCode: 'Red' };
  };

  const checkEmailStatus = (email) => {
    const { role, colorCode } = determineRole(email);
    const users = JSON.parse(localStorage.getItem('zerocoder_users') || '[]');
    const accountExists = users.some(u => u.email === email);
    
    return {
      isAuthorized: role !== 'Unauthorized',
      colorCode,
      accountExists
    };
  };

  const register = (username, email, password) => {
    const users = JSON.parse(localStorage.getItem('zerocoder_users') || '[]');
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
      throw new Error('Username already taken');
    }

    const { role, colorCode } = determineRole(email);
    const newUser = { username, email, password, role, colorCode };
    
    users.push(newUser);
    localStorage.setItem('zerocoder_users', JSON.stringify(users));
    
    // Auto login after register
    setCurrentUser(newUser);
    localStorage.setItem('zerocoder_session', JSON.stringify(newUser));
    return newUser;
  };

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('zerocoder_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Refresh role in case email_access.js has changed since last login
    const { role, colorCode } = determineRole(user.email);
    user.role = role;
    user.colorCode = colorCode;
    
    setCurrentUser(user);
    localStorage.setItem('zerocoder_session', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('zerocoder_session');
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

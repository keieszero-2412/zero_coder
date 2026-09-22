import { createContext, useContext, useState, useEffect } from 'react';

const TermContext = createContext();

export function useTerm() {
  return useContext(TermContext);
}

export function TermProvider({ children }) {
  const [activeTerm, setActiveTerm] = useState(() => {
    return localStorage.getItem('active_term') || 'mid';
  });

  useEffect(() => {
    localStorage.setItem('active_term', activeTerm);
  }, [activeTerm]);

  return (
    <TermContext.Provider value={{ activeTerm, setActiveTerm }}>
      {children}
    </TermContext.Provider>
  );
}

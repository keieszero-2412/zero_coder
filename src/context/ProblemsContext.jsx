import { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const ProblemsContext = createContext();

export function useProblems() {
  return useContext(ProblemsContext);
}

const CACHE_VERSION = 'v4_summer_order';

export function ProblemsProvider({ children }) {
  // Initialize from localStorage for instant load (SWR pattern)
  const [problems, setProblems] = useState(() => {
    try {
      const version = localStorage.getItem('problems_cache_version');
      if (version === CACHE_VERSION) {
        const cached = localStorage.getItem('cached_problems');
        if (cached) {
          return JSON.parse(cached);
        }
      } else {
        localStorage.removeItem('cached_problems');
        localStorage.setItem('problems_cache_version', CACHE_VERSION);
      }
    } catch (e) {
      console.error('Failed to parse cached problems', e);
    }
    return [];
  });
  
  const [isLoading, setIsLoading] = useState(problems.length === 0);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProblems = async () => {
      setIsFetching(true);
      try {
        const isFreshVersion = localStorage.getItem('problems_cache_version') === CACHE_VERSION;
        let fetchedProblems = [];

        try {
          const q = query(collection(db, 'problems'), orderBy('order', 'asc'));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            fetchedProblems.push(doc.data());
          });
        } catch (dbErr) {
          console.warn("Could not query DB directly, falling back to local problems.json:", dbErr);
        }
        
        if (fetchedProblems.length === 0 || !isFreshVersion) {
          try {
            const res = await fetch('/problems.json');
            if (res.ok) {
              const seedData = await res.json();
              if (seedData && seedData.length > 0) {
                fetchedProblems = seedData;
                localStorage.setItem('problems_cache_version', CACHE_VERSION);
              }
            }
          } catch (e) {
            console.error("Local fetch failed:", e);
          }
        }

        if (isMounted) {
          setProblems(fetchedProblems);
          localStorage.setItem('cached_problems', JSON.stringify(fetchedProblems));
          setIsLoading(false);
          setIsFetching(false);
        }
      } catch (err) {
        console.error("Failed to fetch problems from DB:", err);
        if (isMounted) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    };

    fetchProblems();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ProblemsContext.Provider value={{ problems, isLoading, isFetching }}>
      {children}
    </ProblemsContext.Provider>
  );
}

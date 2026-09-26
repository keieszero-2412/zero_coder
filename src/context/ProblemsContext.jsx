import { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const ProblemsContext = createContext();

export function useProblems() {
  return useContext(ProblemsContext);
}

const CACHE_VERSION = 'v14_ordering_questions_sync';

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
        // Version mismatch — clear stale cache but don't block load
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
        
        // Always fetch local problems.json and merge quiz data from it
        try {
          const res = await fetch('/problems.json');
          if (res.ok) {
            const localData = await res.json();
            if (localData && localData.length > 0) {
              if (fetchedProblems.length === 0) {
                fetchedProblems = localData;
              } else {
                // For quiz/MCQ problems, prefer the local version (has latest question format)
                const localMap = new Map(localData.map(p => [String(p.id), p]));
                fetchedProblems = fetchedProblems.map(p => {
                  const localP = localMap.get(String(p.id));
                  if (localP && (localP.type === 'multiple_choice' || localP.questions)) {
                    return localP;
                  }
                  return p;
                });
                // Add any problems from local that don't exist in Firestore
                const fetchedIds = new Set(fetchedProblems.map(p => String(p.id)));
                const missing = localData.filter(p => !fetchedIds.has(String(p.id)));
                if (missing.length > 0) {
                  fetchedProblems = [...fetchedProblems, ...missing];
                }
              }
            }
          }
        } catch (e) {
          console.error("Local fetch failed:", e);
        }

        if (isMounted) {
          setProblems(fetchedProblems);
          if (fetchedProblems.length > 0) {
            localStorage.setItem('cached_problems', JSON.stringify(fetchedProblems));
            localStorage.setItem('problems_cache_version', CACHE_VERSION);
          }
          setIsLoading(false);
          setIsFetching(false);
        }
      } catch (err) {
        console.error("Failed to fetch problems:", err);
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

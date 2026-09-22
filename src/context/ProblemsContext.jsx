import { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const ProblemsContext = createContext();

export function useProblems() {
  return useContext(ProblemsContext);
}

export function ProblemsProvider({ children }) {
  // Initialize from localStorage for instant load (SWR pattern)
  const [problems, setProblems] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_problems');
      if (cached) {
        return JSON.parse(cached);
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
        const q = query(collection(db, 'problems'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedProblems = [];
        querySnapshot.forEach((doc) => {
          fetchedProblems.push(doc.data());
        });
        
        if (fetchedProblems.length === 0) {
          try {
            console.log("Database empty. Auto-seeding from /problems.json...");
            const res = await fetch('/problems.json');
            if (res.ok) {
              const seedData = await res.json();
              if (seedData && seedData.length > 0) {
                const batch = writeBatch(db);
                let index = 0;
                for (const p of seedData) {
                  const docRef = doc(db, 'problems', String(p.id));
                  batch.set(docRef, { ...p, order: index });
                  index++;
                }
                await batch.commit();
                
                if (isMounted) {
                  setProblems(seedData);
                  localStorage.setItem('cached_problems', JSON.stringify(seedData));
                  setIsLoading(false);
                  setIsFetching(false);
                }
                return;
              }
            }
          } catch (e) {
            console.error("Auto-seed failed:", e);
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

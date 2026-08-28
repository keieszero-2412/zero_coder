import { useState, useEffect, useCallback, useRef } from 'react';

// We import the worker using Vite's ?worker syntax
import PythonWorker from './python.worker.js?worker';

export function usePython() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [output, setOutput] = useState([]);
  const [error, setError] = useState(null);
  
  const workerRef = useRef(null);
  const messageIdRef = useRef(0);
  const pendingRequestsRef = useRef(new Map());

  // Helper to create and initialize the worker
  const initWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    const worker = new PythonWorker();
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, text, error, results, id } = event.data;
      
      if (type === 'STDOUT') {
        setOutput((prev) => [...prev, { type: 'stdout', text }]);
      } else if (type === 'STDERR') {
        setOutput((prev) => [...prev, { type: 'stderr', text }]);
      } else {
        // Resolve pending requests for specific message IDs
        const pending = pendingRequestsRef.current.get(id);
        if (pending) {
          if (type === 'INIT_DONE') {
            setIsLoaded(true);
            pending.resolve();
          } else if (type === 'INIT_ERROR') {
            setError(error);
            pending.reject(new Error(error));
          } else if (type === 'RUN_CODE_DONE') {
            pending.resolve();
          } else if (type === 'RUN_CODE_ERROR') {
            setOutput((prev) => [...prev, { type: 'stderr', text: error }]);
            pending.resolve(); // resolve so the UI isn't blocked
          } else if (type === 'RUN_TESTS_DONE') {
            pending.resolve(results);
          } else if (type === 'RUN_TESTS_ERROR') {
            setOutput((prev) => [...prev, { type: 'stderr', text: error }]);
            pending.resolve([]); // fallback
          }
          pendingRequestsRef.current.delete(id);
        }
      }
    };

    // Initialize Pyodide inside the worker
    const id = ++messageIdRef.current;
    return new Promise((resolve, reject) => {
      pendingRequestsRef.current.set(id, { resolve, reject });
      worker.postMessage({ type: 'INIT', id });
    });
  }, []);

  useEffect(() => {
    initWorker().catch(console.error);
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [initWorker]);

  // Execute a command with timeout
  const executeWithTimeout = useCallback(async (messageData, timeoutMs = 10000) => {
    if (!workerRef.current) return;
    
    return new Promise((resolve, reject) => {
      const id = ++messageIdRef.current;
      
      const timeoutId = setTimeout(() => {
        // Terminate worker if it takes too long
        workerRef.current.terminate();
        pendingRequestsRef.current.delete(id);
        setOutput((prev) => [...prev, { type: 'stderr', text: 'Error: Execution timed out (infinite loop?). Worker terminated.' }]);
        
        // Re-initialize worker for future runs
        setIsLoaded(false);
        initWorker();
        
        reject(new Error('Timeout'));
      }, timeoutMs);

      pendingRequestsRef.current.set(id, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      });

      workerRef.current.postMessage({ ...messageData, id });
    });
  }, [initWorker]);

  const runCode = useCallback(async (code) => {
    setOutput([]);
    setError(null);
    try {
      await executeWithTimeout({ type: 'RUN_CODE', code }, 10000);
    } catch (err) {
      if (err.message !== 'Timeout') {
        console.error(err);
      }
    }
  }, [executeWithTimeout]);

  const runTests = useCallback(async (code, testCases) => {
    setOutput([]);
    try {
      const results = await executeWithTimeout({ type: 'RUN_TESTS', code, testCases }, 10000);
      return results || [];
    } catch (err) {
      if (err.message === 'Timeout') {
        // Mark all tests as failed due to timeout
        return testCases.map(test => ({ ...test, passed: false, error: 'Execution timed out.' }));
      }
      console.error(err);
      return [];
    }
  }, [executeWithTimeout]);

  const clearOutput = useCallback(() => setOutput([]), []);

  return { isLoaded, output, error, runCode, runTests, clearOutput };
}

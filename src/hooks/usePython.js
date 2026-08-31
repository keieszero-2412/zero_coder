import { useState, useEffect, useCallback, useRef } from 'react';

// We import the worker using Vite's ?worker syntax
import PythonWorker from './python.worker.js?worker';

// Global shared worker instance to prevent reloading on navigation
let sharedWorker = null;
let sharedIsLoaded = false;
let messageIdCounter = 0;
let pendingRequests = new Map();
let activeOutputHandler = null;
let activeLoadHandler = null;

function initSharedWorker() {
  if (sharedWorker) return sharedWorker;
  
  sharedWorker = new PythonWorker();
  
  sharedWorker.onmessage = (event) => {
    const { type, text, error, results, id } = event.data;
    
    if (type === 'STDOUT') {
      if (activeOutputHandler) activeOutputHandler({ type: 'stdout', text });
    } else if (type === 'STDERR') {
      if (activeOutputHandler) activeOutputHandler({ type: 'stderr', text });
    } else {
      const pending = pendingRequests.get(id);
      if (pending) {
        if (type === 'INIT_DONE') {
          sharedIsLoaded = true;
          if (activeLoadHandler) activeLoadHandler(true, null);
          pending.resolve();
        } else if (type === 'INIT_ERROR') {
          sharedIsLoaded = false;
          if (activeLoadHandler) activeLoadHandler(false, error);
          pending.reject(new Error(error));
        } else if (type === 'RUN_CODE_DONE') {
          pending.resolve();
        } else if (type === 'RUN_CODE_ERROR') {
          if (activeOutputHandler) activeOutputHandler({ type: 'stderr', text: error });
          pending.resolve();
        } else if (type === 'RUN_TESTS_DONE') {
          pending.resolve(results);
        } else if (type === 'RUN_TESTS_ERROR') {
          if (activeOutputHandler) activeOutputHandler({ type: 'stderr', text: error });
          pending.resolve([]);
        }
        pendingRequests.delete(id);
      }
    }
  };
  
  // Start initializing immediately to pre-warm the environment
  const id = ++messageIdCounter;
  pendingRequests.set(id, {
    resolve: () => {},
    reject: (err) => console.error("Global init error", err)
  });
  sharedWorker.postMessage({ type: 'INIT', id });
  
  return sharedWorker;
}

// Pre-warm the environment as soon as this file is evaluated
initSharedWorker();

export function usePython() {
  const [isLoaded, setIsLoaded] = useState(sharedIsLoaded);
  const [output, setOutput] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Register this component as the active handler
    activeOutputHandler = (msg) => setOutput((prev) => [...prev, msg]);
    activeLoadHandler = (loaded, err) => {
      setIsLoaded(loaded);
      if (err) setError(`Lỗi Môi Trường Python: ${err}`);
    };
    
    // Sync initial state in case it loaded before mount
    setIsLoaded(sharedIsLoaded);
    
    // If worker was terminated (e.g. timeout), restart it
    if (!sharedWorker) {
      initSharedWorker();
    }
    
    return () => {
      // Don't terminate the worker! Just detach handlers to prevent memory leaks
      activeOutputHandler = null;
      activeLoadHandler = null;
    };
  }, []);

  const executeWithTimeout = useCallback(async (messageData, timeoutMs = 10000) => {
    if (!sharedWorker) return;
    
    return new Promise((resolve, reject) => {
      const id = ++messageIdCounter;
      
      const timeoutId = setTimeout(() => {
        // Terminate worker if it takes too long (e.g., infinite loop)
        sharedWorker.terminate();
        sharedWorker = null;
        sharedIsLoaded = false;
        pendingRequests.delete(id);
        
        if (activeOutputHandler) {
          activeOutputHandler({ type: 'stderr', text: 'Error: Execution timed out (infinite loop?). Worker terminated.' });
        }
        
        setIsLoaded(false);
        initSharedWorker(); // Restart for future runs
        
        reject(new Error('Timeout'));
      }, timeoutMs);

      pendingRequests.set(id, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      });

      sharedWorker.postMessage({ ...messageData, id });
    });
  }, []);

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
        return testCases.map(test => ({ ...test, passed: false, error: 'Execution timed out.' }));
      }
      console.error(err);
      return [];
    }
  }, [executeWithTimeout]);

  const clearOutput = useCallback(() => setOutput([]), []);

  return { isLoaded, output, error, runCode, runTests, clearOutput };
}

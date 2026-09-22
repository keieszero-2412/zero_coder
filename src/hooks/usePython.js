import { useState, useEffect, useCallback } from 'react';

// We import the worker using Vite's ?worker syntax
import PythonWorker from './python.worker.js?worker';

// Global shared worker instance to prevent reloading on navigation
let sharedWorker = null;
let sharedIsLoaded = false;
let messageIdCounter = 0;
let pendingRequests = new Map();
let activeOutputHandler = null;
let activeLoadHandler = null;
let sharedInitPromise = null;
let requestQueue = Promise.resolve();

let currentRunOutput = [];

function initSharedWorker() {
  if (sharedWorker) return sharedWorker;
  
  sharedWorker = new PythonWorker();
  
  sharedWorker.onmessage = (event) => {
    const { type, text, error, results, id } = event.data;
    
    if (type === 'STDOUT') {
      const msg = { type: 'stdout', text };
      currentRunOutput.push(msg);
      if (activeOutputHandler) activeOutputHandler(msg);
    } else if (type === 'STDERR') {
      const msg = { type: 'stderr', text };
      currentRunOutput.push(msg);
      if (activeOutputHandler) activeOutputHandler(msg);
    } else {
      const pending = pendingRequests.get(id);
      if (pending) {
        if (type === 'INIT_DONE') {
          sharedIsLoaded = true;
          if (activeLoadHandler) activeLoadHandler(true, null);
          pending.resolve();
        } else if (type === 'INIT_ERROR') {
          sharedIsLoaded = false;
          sharedInitPromise = null;
          if (activeLoadHandler) activeLoadHandler(false, error);
          pending.reject(new Error(error));
        } else if (type === 'RUN_CODE_DONE') {
          pending.resolve([...currentRunOutput]);
        } else if (type === 'RUN_CODE_ERROR') {
          const errObj = { type: 'stderr', text: error };
          currentRunOutput.push(errObj);
          if (activeOutputHandler) activeOutputHandler(errObj);
          pending.resolve([...currentRunOutput]);
        } else if (type === 'PRELOAD_PACKAGES_DONE') {
          pending.resolve();
        } else if (type === 'MOUNT_FILES_DONE') {
          pending.resolve();
        } else if (type === 'MOUNT_FILES_ERROR') {
          if (activeOutputHandler) activeOutputHandler({ type: 'stderr', text: error });
          pending.reject(new Error(error));
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
  sharedInitPromise = new Promise((resolve, reject) => {
    pendingRequests.set(id, {
      resolve,
      reject: (err) => {
        console.error("Global init error", err);
        reject(err);
      }
    });
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
    const execute = async () => {
      if (!sharedWorker) initSharedWorker();
      await sharedInitPromise;

      return new Promise((resolve, reject) => {
        const worker = sharedWorker;
        const id = ++messageIdCounter;
        let settled = false;

        const settle = (callback, value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          callback(value);
        };

        const timeoutId = setTimeout(() => {
          if (worker) worker.terminate();
          sharedWorker = null;
          sharedInitPromise = null;
          sharedIsLoaded = false;

          for (const [requestId, pending] of pendingRequests) {
            if (requestId === id) continue;
            pendingRequests.delete(requestId);
            pending.reject(new Error('Worker terminated while executing a request.'));
          }
          pendingRequests.delete(id);

          if (activeOutputHandler) {
            activeOutputHandler({ type: 'stderr', text: 'Error: Execution timed out (infinite loop?). Worker terminated.' });
          }

          setIsLoaded(false);
          initSharedWorker();
          settle(reject, new Error('Timeout'));
        }, timeoutMs);

        pendingRequests.set(id, {
          resolve: (data) => settle(resolve, data),
          reject: (err) => settle(reject, err)
        });

        if (messageData.type === 'RUN_CODE') {
          currentRunOutput = [];
        }

        worker.postMessage({ ...messageData, id });
      });
    };

    const request = requestQueue.then(execute, execute);
    requestQueue = request.catch(() => {});
    return request;
  }, []);

  const preloadPackages = useCallback(async (code) => {
    try {
      await executeWithTimeout({ type: 'PRELOAD_PACKAGES', code }, 45000);
      return true;
    } catch (err) {
      console.warn("Preload packages warning:", err);
      return false;
    }
  }, [executeWithTimeout]);

  const runCode = useCallback(async (code) => {
    setOutput([]);
    setError(null);
    try {
      const res = await executeWithTimeout({ type: 'RUN_CODE', code }, 300000);
      return res || [];
    } catch (err) {
      if (err.message !== 'Timeout') {
        console.error(err);
      }
      const errItem = { type: 'stderr', text: err.message === 'Timeout' ? 'Error: Execution timed out.' : String(err) };
      return [errItem];
    }
  }, [executeWithTimeout]);

  const mountFiles = useCallback(async (files) => {
    try {
      const formattedFiles = files.map(file => {
        if (typeof file === 'object') return file;
        return {
          url: file,
          path: file.replace(/^\/lectures\/[^\/]+\//, 'datasets/').replace(/^\/problems\/[^\/]+\//, 'datasets/')
        };
      });
      await executeWithTimeout({ type: 'MOUNT_FILES', files: formattedFiles }, 30000);
    } catch (err) {
      if (err.message !== 'Timeout') {
        console.error("Failed to mount files:", err);
      }
    }
  }, [executeWithTimeout]);

  const runTests = useCallback(async (code, testCases) => {
    setOutput([]);
    try {
      const results = await executeWithTimeout({ type: 'RUN_TESTS', code, testCases }, 30000);
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

  return { isLoaded, output, error, runCode, runTests, mountFiles, clearOutput, preloadPackages };
}


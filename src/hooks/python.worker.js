// src/hooks/python.worker.js

let pyodideReadyPromise = null;

async function loadPyodideLocally() {
  try {
    try {
      // In some browsers, importScripts exists but throws in ESM workers
      importScripts('/pyodide/pyodide.js');
      return await loadPyodide({
        indexURL: '/pyodide/',
      });
    } catch (e) {
      if (e.message && e.message.includes('importScripts')) {
        // Fallback for ESM workers, use new Function to hide from Vite's static analyzer
        const pyodideModule = await new Function('return import("/pyodide/pyodide.mjs")')();
        return await pyodideModule.loadPyodide({
          indexURL: '/pyodide/',
        });
      }
      throw e;
    }
  } catch (err) {
    throw new Error('Failed to load Pyodide from local public folder: ' + err.message);
  }
}

async function initPyodide() {
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = (async () => {
      // 30 seconds timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Khởi tạo Python quá thời gian (30s). Vui lòng thử lại.')), 30000)
      );
      
      const loadPromise = async () => {
        const pyodide = await loadPyodideLocally();
        
        pyodide.setStdout({
          batched: (msg) => {
            self.postMessage({ type: 'STDOUT', text: msg });
          }
        });
        
        pyodide.setStderr({
          batched: (msg) => {
            self.postMessage({ type: 'STDERR', text: msg });
          }
        });
        
        return pyodide;
      };
      
      return Promise.race([loadPromise(), timeoutPromise]);
    })();
  }
  return pyodideReadyPromise;
}

// Ensure message handler is registered immediately
self.onmessage = async (event) => {
  const { type, id, code, testCases } = event.data;
  
  if (type === 'INIT') {
    try {
      await initPyodide();
      self.postMessage({ type: 'INIT_DONE', id });
    } catch (error) {
      // Clear promise so it can be retried
      pyodideReadyPromise = null;
      self.postMessage({ type: 'INIT_ERROR', error: error.toString(), id });
    }
    return;
  }
  
  if (type === 'RUN_CODE') {
    try {
      const pyodide = await initPyodide();
      await pyodide.runPythonAsync(code);
      self.postMessage({ type: 'RUN_CODE_DONE', id });
    } catch (error) {
      self.postMessage({ type: 'RUN_CODE_ERROR', error: error.toString(), id });
    }
    return;
  }
  
  if (type === 'RUN_TESTS') {
    try {
      const pyodide = await initPyodide();
      const results = [];
      
      // Execute the user code ONCE to load functions
      try {
        await pyodide.runPythonAsync(code);
      } catch (err) {
        // If there's a global error, all tests fail
        const failedResults = testCases.map(test => ({ ...test, passed: false, error: err.toString() }));
        self.postMessage({ type: 'RUN_TESTS_DONE', results: failedResults, id });
        return;
      }
      
      // Run each test
      for (const test of testCases) {
        try {
          const pyCode = `
import sys
import json
import traceback
from io import StringIO
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()
err_msg = ""
try:
${test.code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    err_msg = traceback.format_exc()
finally:
    sys.stdout = old_stdout
json.dumps({"got": mystdout.getvalue().strip(), "error": err_msg})
`;
          const jsonResult = await pyodide.runPythonAsync(pyCode);
          const resultObj = JSON.parse(jsonResult);
          
          if (resultObj.error) {
            results.push({ ...test, passed: false, error: resultObj.error });
          } else {
            const passed = (resultObj.got === test.expected);
            results.push({ ...test, passed, got: resultObj.got });
          }
        } catch (err) {
          results.push({ ...test, passed: false, error: err.toString() });
        }
      }
      
      self.postMessage({ type: 'RUN_TESTS_DONE', results, id });
    } catch (error) {
      self.postMessage({ type: 'RUN_TESTS_ERROR', error: error.toString(), id });
    }
  }
};

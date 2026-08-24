import { useState, useEffect, useCallback, useRef } from 'react';

export function usePython() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [output, setOutput] = useState([]);
  const [error, setError] = useState(null);
  const pyodideRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    
    const initPyodide = async () => {
      try {
        // Use a global promise to ensure Pyodide is only loaded once across unmounts/remounts
        if (!window.__pyodidePromise__) {
          window.__pyodidePromise__ = window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
          });
        }
        
        const pyodide = await window.__pyodidePromise__;
        
        // Setup sys.stdout and sys.stderr interception
        pyodide.setStdout({
          batched: (msg) => {
            if (mounted) setOutput((prev) => [...prev, { type: 'stdout', text: msg }]);
          }
        });
        
        pyodide.setStderr({
          batched: (msg) => {
            if (mounted) setOutput((prev) => [...prev, { type: 'stderr', text: msg }]);
          }
        });

        if (mounted) {
          pyodideRef.current = pyodide;
          setIsLoaded(true);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      }
    };

    initPyodide();

    return () => {
      mounted = false;
    };
  }, []);

  const runCode = useCallback(async (code) => {
    if (!pyodideRef.current) return;
    
    // Clear previous output
    setOutput([]);
    setError(null);
    
    try {
      await pyodideRef.current.runPythonAsync(code);
    } catch (err) {
      setOutput((prev) => [...prev, { type: 'stderr', text: err.toString() }]);
    }
  }, []);

  const runTests = useCallback(async (code, testCases) => {
      if (!pyodideRef.current) return [];

      const pyodide = pyodideRef.current;
      const results = [];

      for (const test of testCases) {
          // Reset stdout/stderr for each test case
          setOutput([]);
          
          try {
              // We execute the user code once
              await pyodide.runPythonAsync(code);
              
              // Run the test code and capture stdout
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
      return results;
  }, []);

  const clearOutput = useCallback(() => setOutput([]), []);

  return { isLoaded, output, error, runCode, runTests, clearOutput };
}

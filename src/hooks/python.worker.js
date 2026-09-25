// src/hooks/python.worker.js

let pyodideReadyPromise = null;

function prepareInteractiveCode(code) {
  return code
    // Strip IPython shell commands (e.g. !pip install requests, !pip install openpyxl)
    .replace(/^\s*!(?!=).*$/gm, '# [auto-stripped shell command]')
    // Strip IPython magics (e.g. %matplotlib inline, %%time)
    .replace(/^\s*%.*$/gm, '# [auto-stripped magic command]')
    // Neutralize exit(...) and quit(...) calls that crash Pyodide runtime
    .replace(/\b(sys\.)?(exit|quit)\s*\([^)]*\)/g, 'print("[Program terminated]")')
    .replace(/\bfig\.show\(\s*[^)]*\)/g, 'print("[Plotly Chart rendered]")')
    .replace(/\bplt\.show\(\s*\)/g, '_zerocoder_show_plot(plt)')
    .replace(/\bpyplot\.show\(\s*\)/g, '_zerocoder_show_plot(pyplot)')
    .replace(/\bplt\.show\(\s*[^)]*\)/g, '_zerocoder_show_plot(plt)')
    .replace(/\bpyplot\.show\(\s*[^)]*\)/g, '_zerocoder_show_plot(pyplot)');
}

// Set of standard library modules and built-ins that never require package loading or network requests
const STDLIB_MODULES = new Set([
  'abc', 'aifc', 'antigravity', 'argparse', 'array', 'ast', 'asynchat', 'asyncio', 'asyncore',
  'atexit', 'audioop', 'base64', 'bdb', 'binascii', 'binhex', 'bisect', 'builtins',
  'bz2', 'calendar', 'cgi', 'cgitb', 'chunk', 'cmath', 'cmd', 'code', 'codecs',
  'codeop', 'collections', 'colorsys', 'compileall', 'concurrent', 'configparser',
  'contextlib', 'contextvars', 'copy', 'copyreg', 'cProfile', 'crypt', 'csv',
  'ctypes', 'curses', 'dataclasses', 'datetime', 'dbm', 'decimal', 'difflib',
  'dis', 'distutils', 'doctest', 'dummy_threading', 'email', 'encodings',
  'ensurepip', 'enum', 'errno', 'faulthandler', 'fcntl', 'filecmp', 'fileinput',
  'fnmatch', 'formatter', 'fractions', 'ftplib', 'functools', 'gc', 'getopt',
  'getpass', 'gettext', 'glob', 'graphlib', 'grp', 'gzip', 'hashlib', 'heapq',
  'hmac', 'html', 'http', 'idlelib', 'imaplib', 'imghdr', 'imp', 'importlib', 'inspect',
  'io', 'ipaddress', 'itertools', 'json', 'keyword', 'lib2to3', 'linecache',
  'locale', 'logging', 'lzma', 'mailbox', 'mailcap', 'marshal', 'math', 'mimetypes',
  'mmap', 'modulefinder', 'msilib', 'msvcrt', 'multiprocessing', 'netrc', 'nis',
  'nntplib', 'numbers', 'operator', 'optparse', 'os', 'ossaudiodev', 'parser',
  'pathlib', 'pdb', 'pickle', 'pickletools', 'pipes', 'pkgutil', 'platform',
  'plistlib', 'poplib', 'posix', 'posixpath', 'pprint', 'profile', 'pstats',
  'pty', 'pwd', 'py_compile', 'pyclbr', 'pydoc', 'pydoc_data', 'pyexpat', 'queue', 'quopri', 'random',
  're', 'readline', 'reprlib', 'resource', 'rlcompleter', 'runpy', 'sched',
  'secrets', 'select', 'selectors', 'shelve', 'shlex', 'shutil', 'signal',
  'site', 'smtpd', 'smtplib', 'sndhdr', 'socket', 'socketserver', 'spwd',
  'sqlite3', 'sre', 'sre_compile', 'sre_constants', 'sre_parse', 'ssl',
  'stat', 'statistics', 'string', 'stringprep', 'struct', 'subprocess', 'sunau',
  'symbol', 'symtable', 'sys', 'sysconfig', 'syslog', 'tabnanny', 'tarfile',
  'telnetlib', 'tempfile', 'termios', 'test', 'textwrap', 'threading', 'time',
  'timeit', 'tkinter', 'token', 'tokenize', 'trace', 'traceback', 'tracemalloc',
  'tty', 'turtle', 'turtledemo', 'types', 'typing', 'unicodedata', 'unittest',
  'urllib', 'uu', 'uuid', 'venv', 'warnings', 'wave', 'weakref', 'webbrowser',
  'wsgiref', 'xdrlib', 'xml', 'xmlrpc', 'zipapp', 'zipfile', 'zipimport',
  'zlib', 'zoneinfo',
  // In-memory shims mocked directly in Pyodide
  'pymssql', 'ipywidgets', 'plotly'
]);

// Map common Python import names to pyodide package names
const IMPORT_TO_PKG = {
  'sklearn': 'scikit-learn',
  'cv2': 'opencv-python',
  'PIL': 'pillow',
  'bs4': 'beautifulsoup4',
  'dateutil': 'python-dateutil',
  'yaml': 'pyyaml',
  'serial': 'pyserial'
};

function normalizePkgName(name) {
  return String(name || '').toLowerCase().replace(/[-_]/g, '');
}

// Track loaded packages in memory
const _loadedPackages = new Set();

function isPackageLoaded(pyodide, pkg) {
  const norm = normalizePkgName(pkg);
  if (_loadedPackages.has(norm)) return true;
  if (!pyodide || !pyodide.loadedPackages) return false;
  for (const loaded of Object.keys(pyodide.loadedPackages)) {
    if (normalizePkgName(loaded) === norm) {
      _loadedPackages.add(norm);
      return true;
    }
  }
  return false;
}

function syncLoadedPackages(pyodide) {
  if (pyodide && pyodide.loadedPackages) {
    for (const loaded of Object.keys(pyodide.loadedPackages)) {
      _loadedPackages.add(normalizePkgName(loaded));
    }
  }
}

// Fast JS parser to extract non-standard-library imports without touching Python runtime
function extractThirdPartyImports(code) {
  if (!code || !/\b(import|from)\b/.test(code)) return [];
  const thirdParty = new Set();
  const lines = code.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // from <module> import ...
    const fromMatch = line.match(/^from\s+([a-zA-Z0-9_]+)/);
    if (fromMatch) {
      const mod = fromMatch[1];
      if (!STDLIB_MODULES.has(mod)) {
        thirdParty.add(IMPORT_TO_PKG[mod] || mod);
      }
      continue;
    }

    // import <mod1> [as ...], <mod2> ...
    const importMatch = line.match(/^import\s+([^#;]+)/);
    if (importMatch) {
      const parts = importMatch[1].split(',');
      for (const part of parts) {
        const mod = part.trim().split(/\s+/)[0]?.split('.')[0];
        if (mod && /^[a-zA-Z0-9_]+$/.test(mod) && !STDLIB_MODULES.has(mod)) {
          thirdParty.add(IMPORT_TO_PKG[mod] || mod);
        }
      }
    }
  }
  return Array.from(thirdParty);
}

// Detect hidden dependencies required at runtime by library internals
function detectHiddenDependencies(code) {
  const deps = [];
  // openpyxl: needed by pandas for .xlsx read/write, plus its sub-dependency et_xmlfile
  if (/\b(read_excel|to_excel|openpyxl)\b|\.xlsx\b/i.test(code)) {
    deps.push('et_xmlfile', 'openpyxl');
  }
  // lxml, beautifulsoup4, html5lib: needed by pandas for read_html
  if (/\bread_html\b/i.test(code)) {
    deps.push('soupsieve', 'beautifulsoup4', 'lxml', 'html5lib', 'pyodide-http');
  }
  // requests: needed for HTTP API calls
  if (/\b(requests\b|pyodide_http)/i.test(code)) {
    deps.push('certifi', 'idna', 'charset-normalizer', 'urllib3', 'requests', 'pyodide-http');
  }
  // seaborn: needed for data visualization in Lecture 7
  if (/\b(seaborn|sns)\b/i.test(code)) {
    deps.push('matplotlib', 'seaborn');
  }
  // scikit-learn: needed for ML lectures
  if (/\b(sklearn|scikit-learn)\b/i.test(code)) {
    deps.push('threadpoolctl', 'joblib', 'scikit-learn');
  }
  // scipy: needed only when scipy is explicitly imported or called (avoid false positives with generic words like 'stats')
  if (/\bscipy\b/i.test(code)) {
    deps.push('scipy');
  }
  // mlxtend: needed for Lecture 12 Association Rules
  if (/\bmlxtend\b/i.test(code)) {
    deps.push('threadpoolctl', 'joblib', 'scikit-learn', 'scipy', 'mlxtend');
  }
  return deps;
}

// Local wheel mappings for offline Pyodide loading
const localWheels = {
  // mlxtend is not in pyodide-lock.json so it must be loaded via direct wheel URL
  'mlxtend': '/pyodide/mlxtend-0.25.0-py3-none-any.whl'
};

let _pyodideHttpPatched = false;

// Parallel install and loading for hidden dependencies
async function installHiddenDeps(pyodide, code) {
  const deps = detectHiddenDependencies(code);
  if (deps.length === 0) return;
  const toInstall = deps.filter(d => !isPackageLoaded(pyodide, d));
  if (toInstall.length === 0) return;

  const customWheels = [];
  const standardPackages = [];

  for (const dep of toInstall) {
    if (localWheels[dep]) {
      customWheels.push(localWheels[dep]);
    } else {
      standardPackages.push(dep);
    }
  }

  // Batch load standard packages in parallel (pyodide.loadPackage accepts an array)
  if (standardPackages.length > 0) {
    try {
      await pyodide.loadPackage(standardPackages);
      for (const p of standardPackages) {
        _loadedPackages.add(normalizePkgName(p));
      }
    } catch (e) {
      console.warn("Batch loadPackage failed, falling back to sequential:", e);
      for (const dep of standardPackages) {
        try {
          await pyodide.loadPackage(dep);
          _loadedPackages.add(normalizePkgName(dep));
        } catch (err) {
          console.warn(`Could not install ${dep} natively:`, err);
          try {
            if (!_loadedPackages.has(normalizePkgName('micropip'))) {
              await pyodide.loadPackage('/pyodide/micropip-0.5.0-py3-none-any.whl');
              _loadedPackages.add(normalizePkgName('micropip'));
            }
            const micropip = pyodide.pyimport('micropip');
            await micropip.install(dep);
            micropip.destroy();
            _loadedPackages.add(normalizePkgName(dep));
          } catch (micropipErr) {
            console.warn(`Could not install ${dep} via micropip:`, micropipErr);
          }
        }
      }
    }
  }

  // Load custom wheels (e.g. mlxtend)
  for (const wheel of customWheels) {
    try {
      await pyodide.loadPackage(wheel);
    } catch (e) {
      console.warn("Could not load custom wheel:", wheel, e);
    }
  }

  syncLoadedPackages(pyodide);

  // If read_html or pyodide-http is used, ensure urllib and pandas use patched urlopen (only patch once)
  if ((deps.includes('pyodide-http') || deps.includes('lxml')) && !_pyodideHttpPatched) {
    _pyodideHttpPatched = true;
    try {
      await pyodide.runPythonAsync(`
try:
    import warnings
    warnings.filterwarnings("ignore", category=UserWarning, module="bs4")
except Exception:
    pass

try:
    import pyodide_http
    pyodide_http.patch_all()
    try:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    except Exception:
        pass
    try:
        import pandas.io.common
        import urllib.request
        pandas.io.common.urlopen = urllib.request.urlopen
    except Exception:
        pass
except Exception:
    pass
`);
    } catch (_e) {
      // ignore
    }
  }
}

// Unified, high-speed package assurance function
async function ensurePackagesLoaded(pyodide, code) {
  if (!code) return;

  const thirdPartyImports = extractThirdPartyImports(code);
  const hiddenDeps = detectHiddenDependencies(code);

  const missingImports = thirdPartyImports.filter(pkg => !isPackageLoaded(pyodide, pkg));
  const missingHidden = hiddenDeps.filter(dep => !isPackageLoaded(pyodide, dep));

  // Fast-path: If all imports and hidden deps are already loaded in memory (or only stdlib is used), return immediately!
  if (missingImports.length === 0 && missingHidden.length === 0) {
    return;
  }

  // Load missing third-party imports via Pyodide
  if (missingImports.length > 0) {
    try {
      await pyodide.loadPackagesFromImports(code);
    } catch (e) {
      console.warn("loadPackagesFromImports warning:", e);
    }
    syncLoadedPackages(pyodide);
  }

  // Load missing hidden dependencies in parallel
  if (missingHidden.length > 0) {
    await installHiddenDeps(pyodide, code);
    syncLoadedPackages(pyodide);
  }
}

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
        
        // --- MOCK PYMSSQL FOR LECTURE 5.2 ---
        // Pyodide does not support raw TCP sockets, so we mock pymssql to return static data
        // for the "adventureworks" educational database used in the course.
        await pyodide.runPythonAsync(`
import sys
import os
import types
import datetime as _mock_dt

os.environ['MPLBACKEND'] = 'AGG'

import warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

class MockUUID:
    def __init__(self, uuid_str):
        self.uuid_str = uuid_str
    def __str__(self): return self.uuid_str
    def __repr__(self): return f"UUID('{self.uuid_str}')"

pymssql = types.ModuleType("pymssql")
class MockCursor:
    def __init__(self):
        self.mode = 'customer'
        self.description = [('CustomerID',)]
    def execute(self, query):
        if 'FactInternetSales' in query:
            self.mode = 'sales'
            self.description = [
                ('SalesOrderNumber',), ('OrderDate',), ('ShipDate',), ('OrderQuantity',), ('UnitPrice',), ('TotalProductCost',)
            ]
        else:
            self.mode = 'customer'
            self.description = [
                ('CustomerID',), ('NameStyle',), ('Title',), ('FirstName',), ('MiddleName',), 
                ('LastName',), ('Suffix',), ('CompanyName',), ('SalesPerson',), ('EmailAddress',), 
                ('Phone',), ('PasswordHash',), ('PasswordSalt',), ('rowguid',), ('ModifiedDate',)
            ]
    def fetchall(self):
        if self.mode == 'sales':
            rows = [
                ('SO43697', _mock_dt.datetime(2010, 12, 29), _mock_dt.datetime(2011, 1, 5), 1, 3399.99, 1912.1544),
                ('SO43698', _mock_dt.datetime(2010, 12, 29), _mock_dt.datetime(2011, 1, 5), 1, 3399.99, 1912.1544),
                ('SO43699', _mock_dt.datetime(2010, 12, 29), _mock_dt.datetime(2011, 1, 5), 1, 3399.99, 1912.1544),
                ('SO43700', _mock_dt.datetime(2010, 12, 29), _mock_dt.datetime(2011, 1, 5), 1, 3399.99, 1912.1544),
                ('SO43701', _mock_dt.datetime(2010, 12, 29), _mock_dt.datetime(2011, 1, 5), 1, 3399.99, 1912.1544)
            ]
            return (rows * 20)[:100]
        else:
            rows = [
                (1, False, 'Mr.', 'Orlando', 'N.', 'Gee', None, 'A Bike Store', 'adventure-works\\\\pamela0', None, '245-555-0173', 'L/Rlwxzp4w7RWmEgXX+/A7cXaePEPcp+KwQhl2fJL7w=', '1KjXYs4=', MockUUID('3f5ae95e-b87d-4aed-95b4-c3797afcb74f'), _mock_dt.datetime(2005, 8, 1)),
                (2, False, 'Mr.', 'Keith', None, 'Harris', None, 'Progressive Sports', 'adventure-works\\\\david8', 'keith0@adventure-works.com', '170-555-0127', 'YPdtRdvqeAhj6wyxEsFdshBDNXxkCXn+CRgbvJItknw=', 'fs1ZGhY=', MockUUID('e552f657-a9af-4a7d-a645-c429d6e02491'), _mock_dt.datetime(2006, 8, 1)),
                (3, False, 'Ms.', 'Donna', 'F.', 'Carreras', None, 'Advanced Bike Components', 'adventure-works\\\\jillian0', 'donna0@adventure-works.com', '279-555-0130', 'LNoK27abGQo48gGue3EBV/UrlYSToV0/s87dCRV7uJk=', 'YTNH5Rw=', MockUUID('130774b1-db21-4ef3-98c8-c104bcd6ed6d'), _mock_dt.datetime(2005, 9, 1)),
                (4, False, 'Ms.', 'Janet', 'M.', 'Gates', None, 'Modular Cycle Systems', 'adventure-works\\\\jillian0', 'janet1@adventure-works.com', '710-555-0173', 'ElzTpSNbUW1Ut+L5cWlfR7MF6nBZia8WpmGaQPjLOJA=', 'nm7D5e4=', MockUUID('ff862851-1daa-4044-be7c-3e85583c054d'), _mock_dt.datetime(2006, 7, 1)),
                (5, False, 'Mr.', 'Lucy', None, 'Harrington', None, 'Metropolitan Sports Supply', 'adventure-works\\\\shu0', 'lucy0@adventure-works.com', '828-555-0186', 'KJqV15wsX3PG8TS5GSddp6LFFVdd3CoRftZM/tP0+R4=', 'cNFKU4w=', MockUUID('83905bdc-6f5e-4f71-b162-c98da069f38a'), _mock_dt.datetime(2006, 9, 1))
            ]
            return (rows * 170)[:847]
    def close(self): pass

class MockConn:
    def cursor(self): return MockCursor()
    def close(self): pass

def mock_connect(*args, **kwargs): return MockConn()
pymssql.connect = mock_connect
sys.modules['pymssql'] = pymssql

# --- SHIMS FOR LECTURES 9-12 (display, ipywidgets, plotly) ---
import builtins
if not hasattr(builtins, 'display'):
    builtins.display = print

def _zerocoder_show_plot(plt_module):
    try:
        import io, base64
        buf = io.BytesIO()
        plt_module.savefig(buf, format='png', bbox_inches='tight', dpi=100)
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        print(f"__IMAGE_BASE64__{img_str}__IMAGE_END__")
        plt_module.close('all')
    except Exception as e:
        print("Error capturing plot:", e)
builtins._zerocoder_show_plot = _zerocoder_show_plot

# ipywidgets shim for notebook compatibility
ipywidgets = types.ModuleType("ipywidgets")
def _mock_decorator(*args, **kwargs):
    def wrapper(f): return f
    return wrapper
ipywidgets.interact = _mock_decorator
ipywidgets.interactive = _mock_decorator
ipywidgets.fixed = lambda x: x
ipywidgets.interact_manual = _mock_decorator
sys.modules['ipywidgets'] = ipywidgets

# plotly shim for headless Web Worker execution
plotly = types.ModuleType("plotly")
plotly_express = types.ModuleType("plotly.express")
class _MockPlotlyFig:
    def __init__(self, *args, **kwargs): pass
    def show(self, *args, **kwargs): print("[Plotly Interactive Chart Rendered]")
    def update_layout(self, *args, **kwargs): return self
    def update_traces(self, *args, **kwargs): return self

plotly_express.treemap = lambda *args, **kwargs: _MockPlotlyFig()
plotly_express.bar = lambda *args, **kwargs: _MockPlotlyFig()
plotly_express.scatter = lambda *args, **kwargs: _MockPlotlyFig()
plotly_express.line = lambda *args, **kwargs: _MockPlotlyFig()
plotly.express = plotly_express
sys.modules['plotly'] = plotly
sys.modules['plotly.express'] = plotly_express
        `);
        // ------------------------------------

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
        
        syncLoadedPackages(pyodide);
        return pyodide;
      };
      
      return Promise.race([loadPromise(), timeoutPromise]);
    })();
  }
  return pyodideReadyPromise;
}

// Ensure message handler is registered immediately
self.onmessage = async (event) => {
  const { type, id, code, testCases, files } = event.data;
  
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
  
  if (type === 'MOUNT_FILES') {
    try {
      const pyodide = await initPyodide();
      if (files && Array.isArray(files)) {
        for (const file of files) {
          const response = await fetch(file.url);
          if (!response.ok) throw new Error(`Failed to fetch ${file.url}`);
          const buffer = await response.arrayBuffer();
          
          const parts = file.path.split('/');
          let currentPath = '';
          for (let i = 0; i < parts.length - 1; i++) {
            currentPath += (currentPath ? '/' : '') + parts[i];
            try {
              pyodide.FS.mkdir(currentPath);
            } catch (e) {
              // Ignore if already exists
            }
          }
          
          pyodide.FS.writeFile(file.path, new Uint8Array(buffer));
        }
      }
      self.postMessage({ type: 'MOUNT_FILES_DONE', id });
    } catch (error) {
      self.postMessage({ type: 'MOUNT_FILES_ERROR', error: error.toString(), id });
    }
    return;
  }
  
  if (type === 'PRELOAD_PACKAGES') {
    try {
      const pyodide = await initPyodide();
      const executableCode = prepareInteractiveCode(code || '');
      await ensurePackagesLoaded(pyodide, executableCode);
      self.postMessage({ type: 'PRELOAD_PACKAGES_DONE', id });
    } catch (_err) {
      self.postMessage({ type: 'PRELOAD_PACKAGES_DONE', id });
    }
    return;
  }

  if (type === 'RUN_CODE') {
    try {
      const pyodide = await initPyodide();
      const executableCode = prepareInteractiveCode(code);
      await ensurePackagesLoaded(pyodide, executableCode);
      const result = await pyodide.runPythonAsync(executableCode);
      
      // Auto-display any dangling plots if plt.show() was omitted
      await pyodide.runPythonAsync(`
try:
    import sys
    if 'matplotlib.pyplot' in sys.modules:
        plt = sys.modules['matplotlib.pyplot']
        if plt.get_fignums():
            _zerocoder_show_plot(plt)
except Exception:
    pass
`);
      
      if (result !== undefined) {
        let resultStr = '';
        if (typeof result === 'object' && result !== null && typeof result.toString === 'function') {
           resultStr = result.toString();
           if (typeof result.destroy === 'function') {
             result.destroy();
           }
        } else {
           resultStr = String(result);
        }
        self.postMessage({ type: 'STDOUT', text: resultStr + '\n' });
      }
      
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
        const executableCode = prepareInteractiveCode(code);
        await ensurePackagesLoaded(pyodide, executableCode);
        await pyodide.runPythonAsync(executableCode);
        // Clear any plots generated during test setup so they don't pollute output
        await pyodide.runPythonAsync(`
try:
    import sys
    if 'matplotlib.pyplot' in sys.modules:
        sys.modules['matplotlib.pyplot'].close('all')
except Exception:
    pass
`);
      } catch (err) {
        // If there's a global error, all tests fail
        const failedResults = testCases.map(test => ({ ...test, passed: false, error: err.toString() }));
        self.postMessage({ type: 'RUN_TESTS_DONE', results: failedResults, id });
        return;
      }
      
      // Run each test
      for (const test of testCases) {
        try {
          const testSnippet = (test.code || (test.input ? `print(${test.input})` : '')).trim();
          const pyCode = `
import sys
import json
import traceback
from io import StringIO
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()
err_msg = ""
try:
${testSnippet.split('\n').map(line => '    ' + line).join('\n')}
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
            const expNorm = String(test.expected ?? '').trim();
            const gotNorm = String(resultObj.got ?? '').trim();
            const passed = (gotNorm === expNorm) || (gotNorm.replace(/"/g, "'") === expNorm.replace(/"/g, "'"));
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

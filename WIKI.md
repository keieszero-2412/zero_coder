# 📚 ZeroCoder Wiki

Welcome to the **ZeroCoder** Wiki. This documentation provides a detailed overview of the system architecture, directory structure, and the core mechanisms behind its key features.

## 🏗 System Architecture

ZeroCoder operates entirely on the client-side, supported by Firebase (BaaS) for storage and authentication.

1. **Python Execution:** Any Python code entered by the user is executed directly in the browser via **Pyodide** (WebAssembly). This significantly reduces server load, eliminates sandbox security concerns on the backend, and minimizes network latency.
2. **Authentication & Data:** **Firebase Authentication** manages user logins and registrations. **Firestore** stores exams, user submissions, learning progress, and personal settings.
3. **AI Hints:** The `@google/genai` library is used to call the Gemini API, providing code corrections or algorithmic hints based on the user's current source code, without exposing the complete solution.

## 📂 Directory Structure (`src/`)

```
src/
├── assets/          # Images, icons (favicon, logo, etc.)
├── components/      # Reusable UI components
│   ├── AdminPanel.jsx      # Admin interface
│   ├── SettingsModal.jsx   # Application settings modal
│   ├── ProtectedRoute.jsx  # Protected route wrapper (requires authentication)
│   └── ...
├── config/          # System configuration (Firebase, API...)
│   └── firebase.js         # Firebase initialization
├── context/         # React Context API (Global State Management)
│   ├── AuthContext.jsx         # User & authentication state
│   ├── SettingsContext.jsx     # App settings (Dark mode, Editor font, etc.)
│   └── NotificationContext.jsx # Notification manager (Toasts)
├── data/            # Mock data or data structure definitions
│   └── problems.js         # Sample questions/exercises list
├── hooks/           # Custom React Hooks
├── pages/           # Main application pages
│   ├── Auth.jsx            # Login/Registration page
│   ├── Dashboard.jsx       # Main dashboard, list of exams
│   ├── Workspace.jsx       # Coding workspace (IDE, Problem Description, Terminal)
│   └── Unauthorized.jsx    # Access denied error page
├── App.jsx          # Root component, routing definitions (React Router)
├── main.jsx         # React application entry point
└── index.css / App.css # Global CSS and App-specific styles
```

## ⚙️ Core Features

### 1. Code Editor
Powered by **CodeMirror 6**, featuring:
- Python-specific syntax highlighting.
- Deeply integrated Theme switching (Github Light / VSCode Dark).
- Configurable Keymaps (Standard / Vim) for developers accustomed to Vim.

### 2. Pyodide Integration (Python Environment)
The system loads Pyodide (via CDN or local files) and initializes a virtual Python environment directly in the browser.
- **Autograding:** Upon submission, the user's code is concatenated with hidden Unit Tests (typically using `assert` statements) and passed to `pyodide.runPythonAsync()` for evaluation.
- Syntax errors or Runtime Errors are caught using a Javascript `try-catch` block and printed to the virtual console on the user's screen.

### 3. AI Hint System (Gemini)
When a user struggles and requests a hint:
1. The system collects: The current problem description, the written code, and the execution error (if any).
2. It packages this data into a standardized Prompt.
3. The prompt is sent to the **Gemini API** to fetch advice. This advice is carefully designed to point out logical flaws or syntax issues rather than providing the straight answer.

---

*This document serves as a quick reference for members looking to maintain, upgrade, or understand the workflow of the ZeroCoder application.*

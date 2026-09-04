# ZeroCoder

ZeroCoder is an online platform, designed specifically for Foreign Trade University students to review and prepare for their programming course (TIN314). The system allows students to write and execute Python code directly in the browser and features automated grading for exercises and exams.

## Key Features
- **In-browser IDE**: Write and execute Python directly in the browser without installing a server, powered by Pyodide.
- **Autograding**: Integrates hidden and public test cases to instantly evaluate and grade code.
- **AI Hints**: Provides smart AI-driven hints to help students solve difficult problems.
- **Account Management**: Seamless Login/Registration.

## Technology Stack
- **Frontend:** React.js, Vite, React Router, Context API
- **Editor:** CodeMirror 6 (with themes and Vim mode)
- **Python Runtime:** Pyodide
- **Backend & Database:** Firebase (Authentication, Firestore)
- **AI Integration:** Google Gemini API
- **Others:** KaTeX (Math formula rendering), Lucide React (Icons)

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ZEROCODER
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration (.env):**
   Create a `.env` file in the root directory and fill in your Firebase & Gemini API credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

## 📖 Documentation (Wiki)
Check out detailed information about the system architecture, directory structure, and technical guides in [WIKI.md](./WIKI.md).

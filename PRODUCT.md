# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** Foreign Trade University (FTU) students taking and preparing for course TIN314 (Python programming), studying for midterm and final exams.
- **Secondary / Future:** Broader university students and self-learners learning Python programming and computational problem-solving.
- **Admin / Instructors:** Course administrators reviewing student access, managing problem banks, and monitoring student submissions.

## Product Purpose

ZeroCoder provides a zero-setup, in-browser learning and coding platform where students can write Python code, run tests, complete exams, interact with Jupyter Notebooks, and receive pedagogical AI guidance—without managing local Python installations or server infrastructure. Success means students build confidence, debug effectively, pass coursework exams, and experience instant feedback loops.

## Positioning

Pure client-side Python execution via Pyodide WebAssembly paired with Firebase BaaS. Unlike cloud IDEs (e.g. Replit, Codespaces) or backend sandbox judging platforms (e.g. LeetCode, HackerRank), ZeroCoder runs all computations, datasets, and autograding directly inside the student's browser worker thread:
- Zero backend sandbox costs or security risks.
- Instant code execution latency with pre-warmed Shared Web Worker.
- Complete privacy and offline-capable execution.
- Pedagogical AI hints engineered to stimulate algorithmic thinking rather than spoil complete solutions.

## Operating Context

- **Environment:** Web browsers on both laptops/desktops and mobile devices, across diverse zoom levels and network speeds.
- **Tools & Workflows:**
  - Coding workspace: CodeMirror 6 editor (supporting Vim mode and syntax highlighting), integrated terminal, hidden and public test case autograding.
  - Interactive learning: Jupyter Notebook (`.ipynb`) reader with cell-by-cell execution, Markdown rendering, and KaTeX mathematical formulas.
  - Multi-provider AI assistant: Context-aware hints, automated diff review, and code fixing powered by fallback routing (Gemini, Groq, Mistral, OpenRouter).
  - Dataset inspection: Floating file preview modal for CSV, JSON, and images mounted in the Pyodide virtual filesystem (`pyodide.FS`).

## Capabilities and Constraints

- **Execution Engine:** Pyodide WASM running via a singleton Shared Web Worker (`src/hooks/python.worker.js`), with packages loaded on-demand.
- **Auth & Access Control:** Firebase Authentication with manual admin approval workflow for student accounts.
- **Data Persistence:** Cloud Firestore storing problem sets, user progress, notes, flags, and submissions with local SWR caching.
- **Styling Architecture:** Strictly Vanilla CSS in `src/index.css` (no Tailwind CSS).
- **Theming:** 6 harmonious color schemes (Midnight [default], Daylight, Blush, Oceanic, Carbon, Amber).
- **Navigation & Performance:** Instant render with client caching, persistent worker state across route transitions, zero double-scrollbar or layout shift.

## Brand Commitments

- **Name:** ZeroCoder
- **Tone & Voice:** Focused, encouraging, academic yet modern, unobtrusive.
- **Aesthetic Feel:** Premium, glassmorphic accents, dark-mode first (Midnight theme default), clean micro-animations, consistent 36x36 circular action buttons on mobile.

## Evidence on Hand

- Problem banks and test cases: `public/problems.json` and Firestore collections.
- Lecture notebooks and datasets: `public/lectures/` containing real `.ipynb` files, CSV datasets, and index `lectures.json`.
- System documentation: [README.md](file:///d:/PROJECT/ZEROCODER/README.md), [WIKI.md](file:///d:/PROJECT/ZEROCODER/WIKI.md), and [.agents/rules/zerocoder-rules.md](file:///d:/PROJECT/ZEROCODER/.agents/rules/zerocoder-rules.md).

## Product Principles

1. **Zero Barrier to Execution:** Any student with a web browser can run code instantly with zero environment setup or installation delays.
2. **Pedagogy Over Spoilers:** AI assistance points out logical edge cases and syntax bugs to promote active learning instead of replacing student problem solving.
3. **Resilient Fluidity:** Route navigation, code execution, and theme transitions must be instantaneous, cached, and never flicker or freeze.
4. **Cohesive Theme Fidelity:** All UI components, CodeMirror editors, modals, and test runners must harmonize seamlessly across all 6 themes without visual regression.

## Accessibility & Inclusion

- Responsive layout adapting seamlessly across mobile phones, tablets, laptops, and various browser zoom levels.
- High contrast and legible typography using custom theme tokens.
- Custom accessible modal and toast notification system replacing intrusive browser native alerts.

const fs = require('fs');
const css = `
/* Mobile Responsiveness */
@media (max-width: 768px) {
  #root, .app-container {
    height: auto;
    min-height: 100vh;
  }
  .main-content {
    flex-direction: column !important;
    overflow-y: visible;
  }
  
  /* Sidebar */
  .sidebar {
    width: 100% !important;
    max-height: none;
    border-right: none !important;
    border-bottom: 1px solid var(--border-color);
  }
  
  /* Workspace */
  .workspace {
    flex-direction: column !important;
  }
  
  /* Left Panel (Editor + Terminal) */
  .workspace > div:first-child {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
  }
  
  /* Editor Section */
  .editor-section {
    min-height: 50vh !important;
  }
  
  /* Terminal Section */
  .terminal-section {
    min-height: 350px !important;
  }

  /* Right Panel (AI Assistant) */
  .workspace > div:last-child {
    width: 100% !important;
    padding-left: 1rem !important;
    min-height: 50vh !important;
  }

  /* Hide drag handles */
  .drag-handle {
    display: none !important;
  }
  
  /* Header Adjustments */
  .header {
    height: auto;
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .header > div {
    flex-wrap: wrap;
  }
  
  .hide-on-mobile {
    display: none !important;
  }
}
`;
fs.appendFileSync('src/index.css', css);
console.log('Appended mobile CSS to index.css');

import fs from 'fs';
import path from 'path';

const cssPath = path.resolve('src/index.css');
let content = fs.readFileSync(cssPath, 'utf8');

// Find the start of the bad block. We know it starts after the spin keyframes
const spinKeyframes = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
const idx = content.indexOf(spinKeyframes);

if (idx !== -1) {
  // Keep everything up to the spin keyframes
  const goodContent = content.substring(0, idx + spinKeyframes.length);
  
  const aiCSS = `

/* AI Assistant Styles */
.button-ai {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.2);
}

.button-ai:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
  background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
}

.ai-chat-bubble {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  max-width: 85%;
  line-height: 1.5;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  word-break: break-word;
}

.ai-chat-bubble.user {
  background-color: var(--bg-surface-highlight);
  color: var(--text-primary);
  align-self: flex-end;
  border-bottom-right-radius: 2px;
}

.ai-chat-bubble.assistant {
  background-color: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: var(--text-primary);
  align-self: flex-start;
  border-bottom-left-radius: 2px;
}
`;

  fs.writeFileSync(cssPath, goodContent + aiCSS, 'utf8');
  console.log('Fixed index.css successfully.');
} else {
  console.log('Could not find spin keyframes in index.css');
}

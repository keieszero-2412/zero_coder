import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * Distilled Six-Theme CodeMirror Engine for ZeroCoder
 * 
 * Strips away redundant third-party theme packages (@uiw/vscode, @uiw/github)
 * in favor of a single, unified, CSS-variable-driven syntax engine:
 * 1. 100% transparent canvas and gutters (Translucent Editor Doctrine)
 * 2. Caret and selection dynamically styled via var(--accent-primary)
 * 3. Line numbers and borders inherit from var(--text-tertiary) and var(--border-color)
 * 4. Tonal Python syntax tokens calibrated for Midnight, Daylight, Blush, Oceanic, Carbon, Amber
 */

// Core Editor Chrome & Ergonomics
const editorChromeTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent !important",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)"
  },
  ".cm-content": {
    caretColor: "var(--accent-primary)",
    fontFamily: "var(--font-mono)"
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--accent-primary) !important",
    borderLeftWidth: "2px !important"
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "color-mix(in srgb, var(--accent-primary) 22%, transparent) !important"
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in srgb, var(--text-primary) 4%, transparent) !important"
  },
  ".cm-gutters": {
    backgroundColor: "transparent !important",
    color: "var(--text-tertiary) !important",
    borderRight: "1px solid var(--border-color) !important"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent !important",
    color: "var(--text-primary) !important"
  },
  ".cm-lineNumbers .cm-gutterElement": {
    color: "var(--text-tertiary)"
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "var(--bg-surface-elevated)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    padding: "0 4px"
  }
});

// Distilled Semantic Syntax Highlighting
const distilledHighlightStyle = HighlightStyle.define([
  // Keywords & Flow Control (def, class, return, if, for, in, is, etc.)
  { tag: [tags.keyword, tags.operatorKeyword, tags.controlKeyword, tags.definitionKeyword, tags.moduleKeyword], 
    color: "var(--syntax-keyword)", 
    fontWeight: "600" 
  },
  // Function & Method Definitions and Invocations
  { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], 
    color: "var(--syntax-function)" 
  },
  // Standard Built-ins & Types (len, range, print, int, str, list, dict, etc.)
  { tag: [tags.standard(tags.variableName), tags.typeName, tags.className], 
    color: "var(--syntax-builtin)" 
  },
  // Strings & Character Literals
  { tag: [tags.string, tags.special(tags.string)], 
    color: "var(--syntax-string)" 
  },
  // Numbers & Numeric Constants
  { tag: [tags.number, tags.integer, tags.float], 
    color: "var(--syntax-number)" 
  },
  // Booleans & Special Atoms (True, False, None)
  { tag: [tags.bool, tags.atom, tags.special(tags.variableName)], 
    color: "var(--syntax-atom)" 
  },
  // Comments (docstrings, line comments)
  { tag: [tags.comment, tags.lineComment, tags.blockComment], 
    color: "var(--syntax-comment)", 
    fontStyle: "italic" 
  },
  // Operators (+, -, *, /, ==, !=, =, etc.)
  { tag: [tags.operator, tags.compareOperator, tags.arithmeticOperator, tags.logicOperator], 
    color: "var(--syntax-operator)" 
  },
  // Punctuation & Structural Delimiters
  { tag: [tags.punctuation, tags.bracket], 
    color: "var(--syntax-punct)" 
  },
  // Variables & Parameter Identifiers
  { tag: tags.variableName, 
    color: "var(--text-primary)" 
  }
]);

const distilledSyntaxExtension = syntaxHighlighting(distilledHighlightStyle);

/**
 * Returns the unified CodeMirror theme extension.
 * The system is fully reactive via CSS variables, so it remains lightweight,
 * eliminates external preset imports, and blends seamlessly into all 6 themes.
 */
export function getCodeTheme(_settingsTheme) {
  return [editorChromeTheme, distilledSyntaxExtension];
}


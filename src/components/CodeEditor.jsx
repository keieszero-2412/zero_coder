import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { unifiedMergeView } from '@codemirror/merge';
import { EditorView } from '@codemirror/view';

export function CodeEditor({ value, originalCode, onChange }) {
  const extensions = [python(), EditorView.lineWrapping];
  if (originalCode !== undefined && originalCode !== null) {
    extensions.push(unifiedMergeView({ original: originalCode, mergeControls: false }));
  }

  return (
    <div className="editor-wrapper" style={{ height: '100%', width: '100%' }}>
      <CodeMirror
        value={value}
        height="100%"
        extensions={extensions}
        onChange={(val) => onChange(val)}
        theme={vscodeDark}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </div>
  );
}

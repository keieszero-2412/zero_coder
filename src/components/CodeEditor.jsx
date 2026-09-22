import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { unifiedMergeView } from '@codemirror/merge';
import { EditorView } from '@codemirror/view';
import { useSettings } from '../context/SettingsContext';
import { getCodeTheme } from '../theme/CodeTheme';
import { vim } from '@replit/codemirror-vim';

export function CodeEditor({ value, originalCode, onChange }) {
  const { settings } = useSettings();
  
  const extensions = [python(), EditorView.lineWrapping];
  
  if (settings?.vimMode) {
    extensions.push(vim());
  }
  if (originalCode !== undefined && originalCode !== null) {
    extensions.push(unifiedMergeView({ original: originalCode, mergeControls: false }));
  }

  return (
    <div className="editor-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', fontSize: settings?.editorFontSize || '14px' }}>
      <CodeMirror
        value={value}
        height="100%"
        extensions={extensions}
        onChange={(val) => onChange(val)}
        theme={getCodeTheme(settings?.theme)}
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

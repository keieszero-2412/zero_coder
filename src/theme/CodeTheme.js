import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { githubLight } from '@uiw/codemirror-theme-github';
import { EditorView } from '@codemirror/view';

// Transparent background override so it blends perfectly with the 6 UI themes
const transparentTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent !important"
  },
  ".cm-gutters": {
    backgroundColor: "transparent !important",
    borderRight: "1px solid var(--border-color) !important"
  }
});

export function getCodeTheme(settingsTheme) {
  const lightThemes = ['daylight', 'blush', 'amber'];
  const baseTheme = lightThemes.includes(settingsTheme) ? githubLight : vscodeDark;
  
  return [baseTheme, transparentTheme];
}

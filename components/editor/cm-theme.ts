import { Compartment, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { EditorSettings } from './CodeMirrorEditor.js';

export const darkTheme = EditorView.theme({}, { dark: true });
export const themeSelection = new Compartment();

export type Theme = 'dark' | 'light';

export function getTheme(theme: Theme, settings: EditorSettings = {}): Extension {
  return [
    getEditorTheme(settings),
    theme === 'dark' ? themeSelection.of([getDarkTheme()]) : themeSelection.of([getLightTheme()]),
  ];
}

export function reconfigureTheme(theme: Theme) {
  return themeSelection.reconfigure(theme === 'dark' ? getDarkTheme() : getLightTheme());
}

function getEditorTheme(settings: EditorSettings) {
  return EditorView.theme({
    '&': {
      fontSize: settings.fontSize ?? '14px',
    },
    '&.cm-editor': {
      height: '100%',
      background: theme === 'dark' ? '#1e1e1e' : '#ffffff',
      color: theme === 'dark' ? '#d4d4d4' : '#333333',
    },
    '.cm-cursor': {
      borderLeft: '2px solid',
      borderColor: theme === 'dark' ? '#ffffff' : '#000000',
    },
    '.cm-scroller': {
      lineHeight: '1.5',
      '&:focus-visible': {
        outline: 'none',
      },
    },
    '.cm-line': {
      padding: '0 0 0 4px',
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: theme === 'dark' ? '#264f78' : '#add6ff',
    },
    '&:not(.cm-focused) > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: theme === 'dark' ? '#3a3d41' : '#e5ebf1',
    },
    '.cm-activeLine': {
      background: theme === 'dark' ? '#2a2d2e' : '#f5f5f5',
    },
    '.cm-gutters': {
      background: theme === 'dark' ? '#252526' : '#f8f8f8',
      borderRight: 0,
      color: theme === 'dark' ? '#858585' : '#999999',
    },
    '.cm-gutter': {
      '&.cm-lineNumbers': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: settings.gutterFontSize ?? settings.fontSize ?? '14px',
        minWidth: '40px',
      },
      '& .cm-activeLineGutter': {
        background: 'transparent',
        color: theme === 'dark' ? '#c6c6c6' : '#333333',
      },
    },
    '.cm-foldGutter .cm-gutterElement': {
      padding: '0 4px',
    },
    '.cm-tooltip': {
      background: theme === 'dark' ? '#252526' : '#f8f8f8',
      border: '1px solid',
      borderColor: theme === 'dark' ? '#454545' : '#c8c8c8',
      color: theme === 'dark' ? '#cccccc' : '#333333',
    },
    '.cm-tooltip.cm-tooltip-autocomplete ul li[aria-selected]': {
      background: theme === 'dark' ? '#094771' : '#0078d4',
      color: '#ffffff',
    },
    '.cm-searchMatch': {
      backgroundColor: theme === 'dark' ? '#515c6a' : '#ffcc00',
    },
  });
}

function getLightTheme() {
  return EditorView.theme({
    '.cm-content': {
      color: '#333333',
    },
    '.cm-keyword': { color: '#0000ff' },
    '.cm-atom': { color: '#221199' },
    '.cm-number': { color: '#164' },
    '.cm-def': { color: '#00f' },
    '.cm-variable': { color: '#000000' },
    '.cm-variable-2': { color: '#05a' },
    '.cm-variable-3': { color: '#085' },
    '.cm-property': { color: '#000000' },
    '.cm-operator': { color: '#000000' },
    '.cm-comment': { color: '#008000' },
    '.cm-string': { color: '#a31515' },
    '.cm-string-2': { color: '#f50' },
    '.cm-meta': { color: '#555' },
    '.cm-qualifier': { color: '#555' },
    '.cm-builtin': { color: '#30a' },
    '.cm-bracket': { color: '#997' },
    '.cm-tag': { color: '#170' },
    '.cm-attribute': { color: '#00c' },
    '.cm-hr': { color: '#999' },
    '.cm-link': { color: '#00c' },
  });
}

function getDarkTheme() {
  return EditorView.theme({
    '.cm-content': {
      color: '#d4d4d4',
    },
    '.cm-keyword': { color: '#569cd6' },
    '.cm-atom': { color: '#569cd6' },
    '.cm-number': { color: '#b5cea8' },
    '.cm-def': { color: '#4fc1ff' },
    '.cm-variable': { color: '#9cdcfe' },
    '.cm-variable-2': { color: '#9cdcfe' },
    '.cm-variable-3': { color: '#9cdcfe' },
    '.cm-property': { color: '#9cdcfe' },
    '.cm-operator': { color: '#d4d4d4' },
    '.cm-comment': { color: '#6a9955' },
    '.cm-string': { color: '#ce9178' },
    '.cm-string-2': { color: '#ce9178' },
    '.cm-meta': { color: '#569cd6' },
    '.cm-qualifier': { color: '#d7ba7d' },
    '.cm-builtin': { color: '#569cd6' },
    '.cm-bracket': { color: '#ffd700' },
    '.cm-tag': { color: '#569cd6' },
    '.cm-attribute': { color: '#92c5f8' },
    '.cm-hr': { color: '#999' },
    '.cm-link': { color: '#3794ff' },
  });
}
'use client';

import { useState, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { FileTree, type FileMap } from './FileTree';
import { Terminal, type TerminalRef } from './terminal/Terminal';
import CodeMirrorEditor, { type EditorDocument } from '../editor/CodeMirrorEditor';
import { Button } from '../ui/button';
import { Play, Terminal as TerminalIcon, FolderOpen, FileText } from 'lucide-react';

export interface WorkbenchProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export default function Workbench({ className = '', theme = 'light' }: WorkbenchProps) {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [files, setFiles] = useState<FileMap>({
    '/package.json': {
      type: 'file',
      content: JSON.stringify({
        name: 'my-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0'
        }
      }, null, 2)
    },
    '/src': { type: 'folder' },
    '/src/App.tsx': {
      type: 'file',
      content: `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Hello World!</h1>
    </div>
  );
}

export default App;`
    },
    '/src/index.tsx': {
      type: 'file',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />);`
    }
  });
  
  const [showTerminal, setShowTerminal] = useState(false);
  const terminalRef = useRef<TerminalRef>(null);

  const currentDocument: EditorDocument | undefined = selectedFile && files[selectedFile]?.type === 'file' 
    ? {
        value: files[selectedFile].content || '',
        isBinary: false,
        filePath: selectedFile
      }
    : undefined;

  const handleFileSelect = (filePath: string) => {
    if (files[filePath]?.type === 'file') {
      setSelectedFile(filePath);
    }
  };

  const handleEditorChange = ({ content }: { content: string }) => {
    if (selectedFile && files[selectedFile]?.type === 'file') {
      setFiles(prev => ({
        ...prev,
        [selectedFile]: {
          ...prev[selectedFile],
          content
        }
      }));
    }
  };

  const handleRunProject = () => {
    setShowTerminal(true);
    // Here you would integrate with WebContainer to run the project
    console.log('Running project...');
  };

  return (
    <div className={`workbench h-screen flex flex-col ${className} ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          <span className="font-semibold">Project Workspace</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTerminal(!showTerminal)}
            className="flex items-center gap-2"
          >
            <TerminalIcon className="w-4 h-4" />
            Terminal
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleRunProject}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Run
          </Button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          <Panel defaultSize={25} minSize={15}>
            <div className={`h-full border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`px-3 py-2 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className="text-sm font-medium">Files</h3>
              </div>
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                hideRoot={true}
                className="p-2"
              />
            </div>
          </Panel>

          <PanelResizeHandle className={`w-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`} />

          {/* Editor area */}
          <Panel defaultSize={75}>
            <PanelGroup direction="vertical">
              {/* Code editor */}
              <Panel defaultSize={showTerminal ? 70 : 100}>
                <div className="h-full flex flex-col">
                  {selectedFile ? (
                    <>
                      {/* Editor tab */}
                      <div className={`flex items-center px-3 py-2 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="text-sm">{selectedFile.split('/').pop()}</span>
                      </div>
                      {/* Editor */}
                      <div className="flex-1">
                        <CodeMirrorEditor
                          theme={theme}
                          doc={currentDocument}
                          onChange={handleEditorChange}
                          className="h-full"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Select a file to start editing</p>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>

              {/* Terminal panel */}
              {showTerminal && (
                <>
                  <PanelResizeHandle className={`h-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`} />
                  <Panel defaultSize={30} minSize={20}>
                    <div className="h-full flex flex-col">
                      <div className={`flex items-center justify-between px-3 py-2 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <TerminalIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">Terminal</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTerminal(false)}
                          className="text-xs"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Terminal
                          ref={terminalRef}
                          theme={theme}
                          id="main-terminal"
                          className="h-full"
                        />
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
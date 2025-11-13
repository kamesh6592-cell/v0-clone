import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';

export interface TerminalRef {
  reloadStyles: () => void;
  getTerminal: () => HTMLDivElement | undefined;
}

export interface TerminalProps {
  className?: string;
  theme: 'light' | 'dark';
  readonly?: boolean;
  id: string;
  onTerminalReady?: (terminal: HTMLDivElement) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
}

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>(
    ({ className = '', theme, readonly, id, onTerminalReady, onTerminalResize }, ref) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        const element = terminalElementRef.current;
        if (element) {
          onTerminalReady?.(element);
        }
      }, [onTerminalReady]);

      useImperativeHandle(ref, () => {
        return {
          reloadStyles: () => {
            // Placeholder for style reloading
          },
          getTerminal: () => {
            return terminalElementRef.current || undefined;
          },
        };
      }, []);

      return (
        <div 
          className={`terminal-container ${className} ${theme === 'dark' ? 'bg-gray-900 text-green-400' : 'bg-white text-gray-800'} font-mono text-sm p-4 overflow-auto`} 
          ref={terminalElementRef}
        >
          <div className="mb-2">
            <span className={theme === 'dark' ? 'text-green-400' : 'text-blue-600'}>$</span> 
            <span className="ml-2">Terminal ready (ID: {id})</span>
          </div>
          {readonly && (
            <div className="text-yellow-500 mb-2">
              Terminal is in read-only mode
            </div>
          )}
          <div className="text-gray-500">
            Advanced terminal features will be available when xterm.js dependencies are installed.
          </div>
        </div>
      );
    },
  ),
);

Terminal.displayName = 'Terminal';
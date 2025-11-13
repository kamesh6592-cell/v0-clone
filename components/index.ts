import React from 'react';

// Lazy loaded components for better performance
export const CodeMirrorEditor = React.lazy(() => import('./editor/CodeMirrorEditor'));
export const Workbench = React.lazy(() => import('./workbench/Workbench'));
export const Terminal = React.lazy(() => import('./workbench/terminal/Terminal'));
export const FileTree = React.lazy(() => import('./workbench/FileTree'));

// Git components
export const GitCloneDialog = React.lazy(() => import('./git/GitCloneDialog'));

// AI components
export const ModelSelector = React.lazy(() => import('./ai/ModelSelector'));

// Settings
export const SettingsDialog = React.lazy(() => import('./settings/SettingsDialog'));

// Deployment
export const DeploymentDialog = React.lazy(() => import('./deployment/DeploymentDialog'));

// Templates
export const TemplateGallery = React.lazy(() => import('./templates/TemplateGallery'));

// MCP Tools
export const MCPTools = React.lazy(() => import('./mcp/MCPTools'));

// Screenshot
export const ScreenshotCapture = React.lazy(() => import('./screenshot/ScreenshotCapture'));

// Speech Recognition
export const SpeechRecognition = React.lazy(() => import('./speech/SpeechRecognition'));

// Production Components
export const ProgressCompilation = React.lazy(() => import('./compilation/ProgressCompilation'));
export const ProductionErrorBoundary = React.lazy(() => import('./error/ProductionErrorBoundary'));
export const PerformanceMonitor = React.lazy(() => import('./performance/PerformanceMonitor'));
export const ProductionDashboard = React.lazy(() => import('./production/ProductionDashboard'));

// Loading fallback component
export const ComponentLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense fallback={
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  }>
    {children}
  </React.Suspense>
);

// Bundle size optimization utilities
export const preloadComponent = (componentImport: () => Promise<any>) => {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = componentImport.toString();
  document.head.appendChild(link);
};

// Chunk splitting configuration for webpack
export const chunkConfig = {
  editor: ['./editor/CodeMirrorEditor'],
  workbench: ['./workbench/Workbench', './workbench/FileTree', './workbench/terminal/Terminal'],
  ai: ['./ai/ModelSelector'],
  deployment: ['./deployment/DeploymentDialog'],
  templates: ['./templates/TemplateGallery'],
  production: [
    './compilation/ProgressCompilation',
    './error/ProductionErrorBoundary', 
    './performance/PerformanceMonitor',
    './production/ProductionDashboard'
  ],
};
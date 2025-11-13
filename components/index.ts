import React from 'react';

// Lazy loaded components for better performance
export const CodeMirrorEditor = React.lazy(() => import('./editor/CodeMirrorEditor'));
export const Workbench = React.lazy(() => import('./workbench/Workbench'));
export const Terminal = React.lazy(() => import('./workbench/terminal/Terminal').then(module => ({ default: module.Terminal })));
export const FileTree = React.lazy(() => import('./workbench/FileTree'));

// Git components
export const GitCloneDialog = React.lazy(() => import('./git/GitCloneDialog').then(module => ({ default: module.GitCloneDialog })));

// AI components
export const ModelSelector = React.lazy(() => import('./ai/ModelSelector').then(module => ({ default: module.ModelSelector })));

// Settings
export const SettingsDialog = React.lazy(() => import('./settings/SettingsDialog').then(module => ({ default: module.SettingsDialog })));

// Deployment
export const DeploymentDialog = React.lazy(() => import('./deployment/DeploymentDialog').then(module => ({ default: module.DeploymentDialog })));

// Templates
export const TemplateGallery = React.lazy(() => import('./templates/TemplateGallery').then(module => ({ default: module.TemplateGallery })));

// MCP Tools
export const MCPTools = React.lazy(() => import('./mcp/MCPTools').then(module => ({ default: module.MCPTools })));

// Screenshot
export const ScreenshotCapture = React.lazy(() => import('./screenshot/ScreenshotCapture').then(module => ({ default: module.ScreenshotCapture })));

// Speech Recognition
export const SpeechInterface = React.lazy(() => import('./speech/SpeechRecognition').then(module => ({ default: module.SpeechInterface })));

// Production Components
export const ProgressCompilation = React.lazy(() => import('./compilation/ProgressCompilation').then(module => ({ default: module.ProgressCompilation })));
export const ProductionErrorBoundary = React.lazy(() => import('./error/ProductionErrorBoundary'));
export const PerformanceMonitor = React.lazy(() => import('./performance/PerformanceMonitor').then(module => ({ default: module.PerformanceMonitor })));
export const ProductionDashboard = React.lazy(() => import('./production/ProductionDashboard').then(module => ({ default: module.ProductionDashboard })));

// Loading fallback component (moved to separate tsx file for JSX support)

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
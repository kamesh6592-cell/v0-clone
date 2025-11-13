'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Workbench from '@/components/workbench/Workbench';
import GitCloneDialog from '@/components/git/GitCloneDialog';
import { SettingsButton } from '@/components/settings/SettingsDialog';
import { ModelSelector } from '@/components/ai/ModelSelector';
import { 
  Code2, 
  Terminal, 
  GitBranch, 
  Zap, 
  FileText, 
  Settings, 
  Cpu,
  Globe,
  Layers,
  Sparkles
} from 'lucide-react';

export default function EnhancedHomePage() {
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  if (showWorkbench) {
    return <Workbench theme={theme} />;
  }

  const features = [
    {
      icon: Code2,
      title: 'Advanced Code Editor',
      description: 'CodeMirror-powered editor with syntax highlighting, autocomplete, and multi-language support',
      badge: 'Enhanced',
      color: 'bg-blue-500'
    },
    {
      icon: Terminal,
      title: 'Integrated Terminal',
      description: 'Built-in terminal with WebContainer support for running code directly in the browser',
      badge: 'New',
      color: 'bg-green-500'
    },
    {
      icon: GitBranch,
      title: 'Git Integration', 
      description: 'Clone repositories, manage version control, and collaborate seamlessly',
      badge: 'New',
      color: 'bg-purple-500'
    },
    {
      icon: Cpu,
      title: 'Multi-Provider AI',
      description: 'Support for OpenAI, Anthropic, Google, Cohere, Mistral, and DeepSeek models',
      badge: 'Enhanced',
      color: 'bg-orange-500'
    },
    {
      icon: FileText,
      title: 'File Tree Explorer',
      description: 'Advanced file management with search, filtering, and project structure visualization',
      badge: 'Enhanced', 
      color: 'bg-teal-500'
    },
    {
      icon: Settings,
      title: 'Comprehensive Settings',
      description: 'Customizable preferences, API key management, and personalization options',
      badge: 'New',
      color: 'bg-red-500'
    }
  ];

  const aiProviders = [
    { name: 'OpenAI', models: ['GPT-4o', 'GPT-4o Mini', 'GPT-3.5 Turbo'] },
    { name: 'Anthropic', models: ['Claude 3.5 Sonnet', 'Claude 3.5 Haiku'] },
    { name: 'Google', models: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro'] },
    { name: 'Cohere', models: ['Command R+', 'Command R'] },
    { name: 'Mistral', models: ['Mistral Large', 'Mistral Medium'] },
    { name: 'DeepSeek', models: ['DeepSeek Chat', 'DeepSeek Coder'] }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      {/* Header */}
      <header className={`border-b transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white/80 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'}`}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  V0-Clone Enhanced
                </h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Powered by Bolt.diy Features
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </Button>
              <SettingsButton />
              <GitCloneDialog onCloneComplete={(data) => {
                console.log('Repository cloned:', data);
                setShowWorkbench(true);
              }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
              <Zap className="w-4 h-4" />
              Enhanced with Bolt.diy Components
            </div>
          </div>
          
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Next-Generation
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Code Editor</span>
          </h1>
          
          <p className={`text-xl mb-8 max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            A comprehensive development environment with advanced code editing, terminal integration, 
            Git support, and multi-provider AI assistance - all integrated from bolt.diy's powerful components.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setShowWorkbench(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              <Code2 className="w-5 h-5 mr-2" />
              Launch Workbench
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-3"
            >
              <Globe className="w-5 h-5 mr-2" />
              View Documentation
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className={`group hover:shadow-lg transition-all duration-200 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white hover:shadow-blue-100'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${feature.color} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI Providers Section */}
        <div className={`rounded-2xl p-8 mb-12 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-r from-purple-50 to-blue-50'}`}>
          <div className="text-center mb-8">
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Multi-Provider AI Support
            </h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Choose from leading AI providers and models for the best coding assistance
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {aiProviders.map((provider, index) => (
              <Card key={index} className={`text-center p-4 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}>
                <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {provider.name}
                </h3>
                <div className="space-y-1">
                  {provider.models.slice(0, 2).map((model, idx) => (
                    <div key={idx} className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {model}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Specs */}
        <Card className={`p-8 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="text-center mb-6">
            <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Integrated Technologies
            </h2>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Built with cutting-edge tools and frameworks from bolt.diy
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'CodeMirror 6', 'WebContainer API', 'Isomorphic Git', 'React Resizable Panels',
              'Radix UI', 'TailwindCSS', 'Next.js 15', 'TypeScript 5'
            ].map((tech, index) => (
              <div key={index} className={`flex items-center gap-2 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Layers className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {tech}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className={`border-t mt-16 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Enhanced V0-Clone with components and features from{' '}
              <a 
                href="https://github.com/stackblitz-labs/bolt.diy" 
                className="text-blue-600 hover:text-blue-800 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                bolt.diy
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  Code2, 
  Terminal, 
  GitBranch, 
  Settings, 
  Rocket, 
  Image, 
  Mic, 
  Gauge,
  Shield,
  Wrench,
  Palette,
  Globe,
  FileCode,
  Layers,
  ExternalLink
} from 'lucide-react';

// Direct imports for now to avoid lazy loading complexity
import { MCPTools } from '../mcp/MCPTools';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<any> | null;
  category: 'development' | 'ai' | 'deployment' | 'media' | 'productivity';
  badge?: string;
  action?: () => void;
}

const features: Feature[] = [
  {
    id: 'mcp-tools',
    name: 'MCP Tools',
    description: 'Model Context Protocol integration for enhanced AI capabilities',
    icon: <Wrench className="w-5 h-5" />,
    component: MCPTools,
    category: 'ai',
    badge: 'Advanced'
  },
  {
    id: 'codemirror-editor',
    name: 'Code Editor',
    description: 'Advanced code editor with syntax highlighting and IntelliSense',
    icon: <Code2 className="w-5 h-5" />,
    component: null,
    category: 'development',
    badge: 'IDE',
    action: () => alert('Code editor is available in the IDE workspace mode!')
  },
  {
    id: 'terminal',
    name: 'Integrated Terminal',
    description: 'Browser-based terminal with WebContainer integration',
    icon: <Terminal className="w-5 h-5" />,
    component: null,
    category: 'development',
    badge: 'CLI',
    action: () => alert('Terminal is available in the IDE workspace mode!')
  },
  {
    id: 'file-tree',
    name: 'File Explorer',
    description: 'Project file tree with creation, deletion, and navigation',
    icon: <FileCode className="w-5 h-5" />,
    component: null,
    category: 'development',
    action: () => alert('File explorer is available in the IDE workspace mode!')
  },
  {
    id: 'git-integration',
    name: 'Git Integration',
    description: 'Version control with clone, commit, push, and pull operations',
    icon: <GitBranch className="w-5 h-5" />,
    component: null,
    category: 'development',
    action: () => alert('Git integration coming soon!')
  },
  {
    id: 'deployment-tools',
    name: 'Deployment Tools',
    description: 'Deploy to Vercel, Netlify, and other platforms',
    icon: <Rocket className="w-5 h-5" />,
    component: null,
    category: 'deployment',
    badge: 'Production',
    action: () => alert('Deployment tools coming soon!')
  },
  {
    id: 'ai-models',
    name: 'AI Model Switching',
    description: 'Switch between v0, Claude, and Grok AI models',
    icon: <Layers className="w-5 h-5" />,
    component: null,
    category: 'ai',
    badge: 'Multi-AI',
    action: () => alert('AI model selection is available in the provider settings!')
  },
  {
    id: 'performance',
    name: 'Performance Analytics',
    description: 'Monitor app performance with Core Web Vitals',
    icon: <Gauge className="w-5 h-5" />,
    component: null,
    category: 'development',
    badge: 'Analytics',
    action: () => alert('Performance monitoring coming soon!')
  },
  {
    id: 'speech-input',
    name: 'Voice Input',
    description: 'Speech-to-text for natural language interactions',
    icon: <Mic className="w-5 h-5" />,
    component: null,
    category: 'productivity',
    badge: 'Voice',
    action: () => alert('Voice input is available in the chat interface!')
  },
  {
    id: 'screenshot-tools',
    name: 'Screenshot Tools',
    description: 'Capture and analyze screenshots for design inspiration',
    icon: <Image className="w-5 h-5" />,
    component: null,
    category: 'media',
    action: () => alert('Screenshot tools coming soon!')
  }
];

const categoryColors = {
  development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ai: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  deployment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  media: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  productivity: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

const categoryNames = {
  development: 'Development',
  ai: 'AI & ML',
  deployment: 'Deployment',
  media: 'Media',
  productivity: 'Productivity'
};

export function FeaturesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const categories = ['all', ...Object.keys(categoryNames)] as const;
  
  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const handleFeatureAction = (feature: Feature) => {
    if (feature.action) {
      feature.action();
    } else if (feature.component) {
      setActiveFeature(activeFeature === feature.id ? null : feature.id);
    } else {
      alert(`${feature.name} is coming soon!`);
    }
  };

  const renderFeatureComponent = (feature: Feature) => {
    if (!feature.component) return null;
    
    const Component = feature.component;
    return <Component />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Features
          <Badge variant="secondary" className="text-xs">
            {features.length}
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Advanced Features & Tools
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-[70vh]">
          {/* Category Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'All Features' : categoryNames[category as keyof typeof categoryNames]}
              </Button>
            ))}
          </div>

          {/* Features Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFeatures.map((feature) => (
                <Card key={feature.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {feature.icon}
                        <CardTitle className="text-base">{feature.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${categoryColors[feature.category]}`}
                        >
                          {categoryNames[feature.category]}
                        </Badge>
                        {feature.badge && (
                          <Badge variant="outline" className="text-xs">
                            {feature.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        onClick={() => handleFeatureAction(feature)}
                        className="w-full"
                        variant={feature.component ? "default" : "outline"}
                      >
                        {activeFeature === feature.id ? 'Close' : feature.component ? 'Open' : 'View'} {feature.name}
                        {!feature.component && <ExternalLink className="w-3 h-3 ml-2" />}
                      </Button>
                      
                      {activeFeature === feature.id && feature.component && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                          {renderFeatureComponent(feature)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
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
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Rapid development shortcuts and code generators',
    icon: <Code2 className="w-5 h-5" />,
    component: null,
    category: 'development',
    badge: 'Live',
    action: () => {
      const actions = [
        '🎨 Create a beautiful landing page',
        '📱 Build a responsive navbar',
        '💳 Design a pricing card component',
        '📝 Make a contact form',
        '🎮 Create an interactive button'
      ];
      const selected = actions[Math.floor(Math.random() * actions.length)];
      navigator.clipboard.writeText(selected).then(() => {
        alert(`Copied to clipboard: "${selected}"\nPaste this in the chat to get started!`);
      });
    }
  },
  {
    id: 'component-library',
    name: 'Component Library',
    description: 'Pre-built React components ready to use',
    icon: <Layers className="w-5 h-5" />,
    component: null,
    category: 'development',
    badge: 'Ready',
    action: () => {
      const components = [
        'Modern dashboard layout',
        'Authentication forms',
        'Data table with sorting',
        'Chart components',
        'Modal dialogs',
        'Loading spinners',
        'Progress bars',
        'Toast notifications'
      ];
      const selected = components[Math.floor(Math.random() * components.length)];
      navigator.clipboard.writeText(`Create a ${selected} component`).then(() => {
        alert(`Copied: "Create a ${selected} component"\nPaste in chat to generate!`);
      });
    }
  },
  {
    id: 'ai-models',
    name: 'AI Models (4 Available)',
    description: 'v0 • Claude • Grok • DeepSeek - Switch in header',
    icon: <Globe className="w-5 h-5" />,
    component: null,
    category: 'ai',
    badge: 'Multi-AI',
    action: () => {
      alert('🤖 4 AI Models Available!\n\n🔵 v0: UI/UX specialized\n🟣 Claude: Detailed & thoughtful\n🟢 Grok: Fast & creative\n🔴 DeepSeek: Advanced reasoning\n\nSwitch models using the header buttons!');
    }
  },
  {
    id: 'export-import',
    name: 'Code Export/Import',
    description: 'Save and load your projects easily',
    icon: <FileCode className="w-5 h-5" />,
    component: null,
    category: 'productivity',
    badge: 'Active',
    action: () => {
      alert('💾 Export Features:\n\n• Copy generated code\n• Download as files\n• Share via URL\n• Import existing projects\n\nLook for export buttons in chat messages!');
    }
  },
  {
    id: 'live-preview',
    name: 'Live Preview',
    description: 'Real-time preview with responsive testing',
    icon: <Settings className="w-5 h-5" />,
    component: null,
    category: 'development',
    badge: 'Live',
    action: () => {
      alert('👁️ Live Preview Features:\n\n• Instant code updates\n• Mobile/Tablet/Desktop views\n• Fullscreen mode\n• Refresh controls\n• Open in new tab\n\nGenerate a component to see it in action!');
    }
  },
  {
    id: 'speech-input',
    name: 'Voice Input',
    description: 'Speech-to-text for natural conversations',
    icon: <Mic className="w-5 h-5" />,
    component: null,
    category: 'productivity',
    badge: 'Voice',
    action: () => {
      alert('🎤 Voice Input:\n\nClick the microphone button in the chat input to:\n• Speak your requests naturally\n• Convert speech to text\n• Hands-free development\n\nSupported in modern browsers!');
    }
  },
  {
    id: 'templates',
    name: 'Project Templates',
    description: 'Pre-configured project setups and examples',
    icon: <Palette className="w-5 h-5" />,
    component: null,
    category: 'productivity',
    badge: 'Ready',
    action: () => {
      const templates = [
        'E-commerce product page',
        'SaaS landing page',
        'Portfolio website',
        'Admin dashboard',
        'Blog template',
        'Authentication flow'
      ];
      const selected = templates[Math.floor(Math.random() * templates.length)];
      navigator.clipboard.writeText(`Build a ${selected} with modern design`).then(() => {
        alert(`Template copied: "${selected}"\nPaste in chat to create a full template!`);
      });
    }
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
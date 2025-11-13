'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Settings, Key, Palette, Code, Database } from 'lucide-react';
import { ModelSelector, type ModelInfo, type ProviderInfo } from '../ai/ModelSelector';

interface SettingsDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: '',
    cohere: '',
    mistral: '',
    deepseek: '',
  });
  
  const [preferences, setPreferences] = useState({
    theme: 'system',
    fontSize: '14',
    tabSize: '2',
    wordWrap: true,
    minimap: true,
    autoSave: true,
  });

  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo>({ name: 'OpenAI' });
  const [selectedModel, setSelectedModel] = useState('gpt-4o');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'ai', label: 'AI Models', icon: Database },
    { id: 'editor', label: 'Editor', icon: Code },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'api-keys', label: 'API Keys', icon: Key },
  ];

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">General Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Auto-save</label>
                <input
                  type="checkbox"
                  checked={preferences.autoSave}
                  onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                  className="rounded"
                />
                <span className="ml-2 text-sm">Automatically save files</span>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">AI Model Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Default AI Provider & Model</label>
                <ModelSelector
                  provider={selectedProvider}
                  setProvider={setSelectedProvider}
                  model={selectedModel}
                  setModel={setSelectedModel}
                  providerList={[
                    { name: 'OpenAI', label: 'OpenAI' },
                    { name: 'Anthropic', label: 'Anthropic' },
                    { name: 'Google', label: 'Google' },
                  ]}
                  modelList={[
                    { name: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', maxTokenAllowed: 128000 },
                    { name: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'Anthropic', maxTokenAllowed: 200000 },
                    { name: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', provider: 'Google', maxTokenAllowed: 1000000 },
                  ]}
                />
              </div>
            </div>
          </div>
        );

      case 'editor':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Editor Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <Select value={preferences.fontSize} onValueChange={(value) => handlePreferenceChange('fontSize', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12px</SelectItem>
                    <SelectItem value="14">14px</SelectItem>
                    <SelectItem value="16">16px</SelectItem>
                    <SelectItem value="18">18px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tab Size</label>
                <Select value={preferences.tabSize} onValueChange={(value) => handlePreferenceChange('tabSize', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 spaces</SelectItem>
                    <SelectItem value="4">4 spaces</SelectItem>
                    <SelectItem value="8">8 spaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.wordWrap}
                    onChange={(e) => handlePreferenceChange('wordWrap', e.target.checked)}
                    className="rounded mr-2"
                  />
                  <span className="text-sm">Word wrap</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.minimap}
                    onChange={(e) => handlePreferenceChange('minimap', e.target.checked)}
                    className="rounded mr-2"
                  />
                  <span className="text-sm">Show minimap</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <Select value={preferences.theme} onValueChange={(value) => handlePreferenceChange('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'api-keys':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">API Keys</h3>
            <div className="space-y-4">
              {Object.entries(apiKeys).map(([provider, value]) => (
                <div key={provider}>
                  <label className="block text-sm font-medium mb-2 capitalize">{provider} API Key</label>
                  <Input
                    type="password"
                    value={value}
                    onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                    placeholder={`Enter your ${provider} API key`}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 pr-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-6 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            // Save settings logic here
            console.log('Settings saved:', { apiKeys, preferences, selectedProvider, selectedModel });
            onOpenChange?.(false);
          }}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
        Settings
      </Button>
      <SettingsDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

export default SettingsDialog;
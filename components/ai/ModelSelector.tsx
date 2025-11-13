'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface ModelInfo {
  name: string;
  label: string;
  provider: string;
  maxTokenAllowed: number;
}

export interface ProviderInfo {
  name: string;
  label?: string;
}

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
}

const defaultProviders: ProviderInfo[] = [
  { name: 'OpenAI', label: 'OpenAI' },
  { name: 'Anthropic', label: 'Anthropic' },
  { name: 'Google', label: 'Google' },
  { name: 'Cohere', label: 'Cohere' },
  { name: 'Mistral', label: 'Mistral' },
  { name: 'DeepSeek', label: 'DeepSeek' },
];

const defaultModels: ModelInfo[] = [
  { name: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', maxTokenAllowed: 128000 },
  { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', maxTokenAllowed: 128000 },
  { name: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'Anthropic', maxTokenAllowed: 200000 },
  { name: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', provider: 'Anthropic', maxTokenAllowed: 200000 },
  { name: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', provider: 'Google', maxTokenAllowed: 1000000 },
  { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Google', maxTokenAllowed: 2000000 },
  { name: 'command-r-plus', label: 'Command R+', provider: 'Cohere', maxTokenAllowed: 128000 },
  { name: 'mistral-large-latest', label: 'Mistral Large', provider: 'Mistral', maxTokenAllowed: 128000 },
  { name: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'DeepSeek', maxTokenAllowed: 64000 },
];

const formatContextSize = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
};

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList = defaultModels,
  providerList = defaultProviders,
}: ModelSelectorProps) => {
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Filter models based on selected provider
  const filteredModels = modelList.filter(m => m.provider === provider?.name);

  // Set default provider and model if none selected
  useEffect(() => {
    if (!provider && providerList.length > 0) {
      setProvider?.(providerList[0]);
    }
  }, [provider, setProvider, providerList]);

  useEffect(() => {
    if (!model && filteredModels.length > 0) {
      setModel?.(filteredModels[0].name);
    }
  }, [model, setModel, filteredModels]);

  const handleProviderSelect = (selectedProvider: ProviderInfo) => {
    setProvider?.(selectedProvider);
    setIsProviderDropdownOpen(false);
    
    // Select first model of the new provider
    const providerModels = modelList.filter(m => m.provider === selectedProvider.name);
    if (providerModels.length > 0) {
      setModel?.(providerModels[0].name);
    }
  };

  const handleModelSelect = (selectedModel: string) => {
    setModel?.(selectedModel);
    setIsModelDropdownOpen(false);
  };

  if (providerList.length === 0) {
    return (
      <div className="mb-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
        <p className="text-center">
          No providers are currently available. Please configure AI providers in settings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-col sm:flex-row">
      {/* Provider Selector */}
      <div className="relative flex w-full">
        <button
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">{provider?.label || provider?.name || 'Select Provider'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isProviderDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isProviderDropdownOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {providerList.map((p) => (
              <button
                key={p.name}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center justify-between"
                onClick={() => handleProviderSelect(p)}
              >
                <span>{p.label || p.name}</span>
                {provider?.name === p.name && <Check className="w-4 h-4 text-green-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Model Selector */}
      <div className="relative flex w-full min-w-[70%]">
        <button
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          disabled={!provider}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">
              {model ? modelList.find(m => m.name === model)?.label || model : 'Select Model'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isModelDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredModels.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                No models available for this provider
              </div>
            ) : (
              filteredModels.map((m) => (
                <button
                  key={m.name}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                  onClick={() => handleModelSelect(m.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{m.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatContextSize(m.maxTokenAllowed)} tokens
                      </div>
                    </div>
                    {model === m.name && <Check className="w-4 h-4 text-green-500 ml-2" />}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
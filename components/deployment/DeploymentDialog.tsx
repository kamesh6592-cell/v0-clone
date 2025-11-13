'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ExternalLink, Rocket, Loader2, Github } from 'lucide-react';

interface DeploymentDialogProps {
  projectName?: string;
  projectFiles?: Record<string, string>;
  onDeploy?: (platform: string, config: any) => Promise<string>;
}

export function DeploymentDialog({ projectName = 'my-project', projectFiles = {}, onDeploy }: DeploymentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState('vercel');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [config, setConfig] = useState({
    name: projectName,
    framework: 'nextjs',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    installCommand: 'npm install',
    environmentVariables: {} as Record<string, string>,
  });

  const platforms = [
    { value: 'vercel', label: 'Vercel', icon: '▲' },
    { value: 'netlify', label: 'Netlify', icon: '◆' },
    { value: 'github-pages', label: 'GitHub Pages', icon: <Github className="w-4 h-4" /> },
  ];

  const frameworks = [
    { value: 'nextjs', label: 'Next.js' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'static', label: 'Static HTML' },
  ];

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    try {
      let url: string;
      
      if (onDeploy) {
        url = await onDeploy(platform, config);
      } else {
        // Mock deployment for demonstration
        await new Promise(resolve => setTimeout(resolve, 3000));
        url = `https://${config.name}-${Math.random().toString(36).substr(2, 9)}.${platform}.app`;
      }
      
      setDeploymentUrl(url);
    } catch (error) {
      console.error('Deployment failed:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Rocket className="w-4 h-4" />
          Deploy
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Deploy Project
          </DialogTitle>
        </DialogHeader>

        {!deploymentUrl ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <span>{typeof p.icon === 'string' ? p.icon : p.icon}</span>
                        <span>{p.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <Input
                value={config.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="my-awesome-project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Framework</label>
              <Select value={config.framework} onValueChange={(value) => handleConfigChange('framework', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Build Command</label>
              <Input
                value={config.buildCommand}
                onChange={(e) => handleConfigChange('buildCommand', e.target.value)}
                placeholder="npm run build"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Output Directory</label>
              <Input
                value={config.outputDirectory}
                onChange={(e) => handleConfigChange('outputDirectory', e.target.value)}
                placeholder="dist"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleDeploy} 
                disabled={isDeploying}
                className="flex items-center gap-2"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Deploy
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="text-green-600 dark:text-green-400">
              <Rocket className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Deployment Successful!</h3>
            </div>
            
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your project is live at:</p>
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-2"
              >
                {deploymentUrl}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button asChild>
                <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Site
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Settings, Database, Zap, Shield, Monitor, Bell, Download, Upload, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ProductionConfig {
  environment: 'development' | 'staging' | 'production';
  debugging: {
    enabled: boolean;
    level: 'info' | 'warn' | 'error' | 'debug';
    consoleOutput: boolean;
    errorReporting: boolean;
  };
  performance: {
    monitoring: boolean;
    vitalsTracking: boolean;
    bundleAnalysis: boolean;
    memoryProfiling: boolean;
  };
  security: {
    csrfProtection: boolean;
    rateLimit: boolean;
    sanitization: boolean;
    headers: boolean;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    strategy: 'lru' | 'lfu' | 'fifo';
    size: number;
  };
  optimization: {
    lazyLoading: boolean;
    codesplitting: boolean;
    compression: boolean;
    minification: boolean;
  };
}

interface DeploymentMetrics {
  buildTime: number;
  bundleSize: number;
  deploymentStatus: 'idle' | 'building' | 'deploying' | 'success' | 'failed';
  lastDeployment: Date | null;
  uptime: number;
  errorRate: number;
}

export function ProductionDashboard() {
  const [config, setConfig] = useState<ProductionConfig>({
    environment: 'production',
    debugging: {
      enabled: false,
      level: 'error',
      consoleOutput: false,
      errorReporting: true,
    },
    performance: {
      monitoring: true,
      vitalsTracking: true,
      bundleAnalysis: true,
      memoryProfiling: false,
    },
    security: {
      csrfProtection: true,
      rateLimit: true,
      sanitization: true,
      headers: true,
    },
    caching: {
      enabled: true,
      ttl: 3600,
      strategy: 'lru',
      size: 100,
    },
    optimization: {
      lazyLoading: true,
      codesplitting: true,
      compression: true,
      minification: true,
    },
  });

  const [metrics, setMetrics] = useState<DeploymentMetrics>({
    buildTime: 0,
    bundleSize: 0,
    deploymentStatus: 'idle',
    lastDeployment: null,
    uptime: 99.9,
    errorRate: 0.1,
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);

  // Simulate deployment process
  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentProgress(0);
    setMetrics(prev => ({ ...prev, deploymentStatus: 'building' }));

    // Simulate build and deployment steps
    const steps = [
      { name: 'Installing dependencies', duration: 2000 },
      { name: 'Building application', duration: 3000 },
      { name: 'Running tests', duration: 1500 },
      { name: 'Optimizing bundle', duration: 2000 },
      { name: 'Deploying to production', duration: 2500 },
    ];

    let progress = 0;
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      progress += 100 / steps.length;
      setDeploymentProgress(progress);
      
      if (step.name.includes('Deploying')) {
        setMetrics(prev => ({ ...prev, deploymentStatus: 'deploying' }));
      }
    }

    setMetrics(prev => ({
      ...prev,
      deploymentStatus: 'success',
      lastDeployment: new Date(),
      buildTime: steps.reduce((sum, step) => sum + step.duration, 0) / 1000,
      bundleSize: Math.random() * 500 + 200, // Simulate bundle size
    }));
    
    setIsDeploying(false);
    setDeploymentProgress(100);
  };

  const updateConfig = (section: keyof ProductionConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [key]: value,
      },
    }));
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'production-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string);
          setConfig(importedConfig);
        } catch (error) {
          console.error('Failed to import config:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const getStatusBadge = (status: DeploymentMetrics['deploymentStatus']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'building':
      case 'deploying':
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Production Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage production configuration and deployment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            {config.environment}
          </Badge>
          <Button onClick={exportConfig} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Config
          </Button>
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => document.getElementById('import-config')?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import Config
            </Button>
            <input
              id="import-config"
              type="file"
              accept=".json"
              onChange={importConfig}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Build Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.buildTime.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">
              Last build duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Bundle Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.bundleSize.toFixed(1)}KB</div>
            <p className="text-xs text-muted-foreground">
              Compressed size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uptime}%</div>
            <p className="text-xs text-muted-foreground">
              30-day average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate}%</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Deployment
              </CardTitle>
              <CardDescription>
                Deploy your application to production
              </CardDescription>
            </div>
            {getStatusBadge(metrics.deploymentStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDeploying && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deployment Progress</span>
                <span>{Math.round(deploymentProgress)}%</span>
              </div>
              <Progress value={deploymentProgress} />
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <Button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="flex items-center gap-2"
            >
              {isDeploying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isDeploying ? 'Deploying...' : 'Deploy to Production'}
            </Button>
            
            {metrics.lastDeployment && (
              <div className="text-sm text-gray-600">
                Last deployed: {metrics.lastDeployment.toLocaleDateString()} at{' '}
                {metrics.lastDeployment.toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="debugging">Debugging</TabsTrigger>
          <TabsTrigger value="caching">Caching</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
              <CardDescription>
                Configure performance monitoring and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="monitoring">Performance Monitoring</Label>
                <Switch
                  id="monitoring"
                  checked={config.performance.monitoring}
                  onCheckedChange={(checked) => updateConfig('performance', 'monitoring', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="vitals">Web Vitals Tracking</Label>
                <Switch
                  id="vitals"
                  checked={config.performance.vitalsTracking}
                  onCheckedChange={(checked) => updateConfig('performance', 'vitalsTracking', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bundle">Bundle Analysis</Label>
                <Switch
                  id="bundle"
                  checked={config.performance.bundleAnalysis}
                  onCheckedChange={(checked) => updateConfig('performance', 'bundleAnalysis', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="memory">Memory Profiling</Label>
                <Switch
                  id="memory"
                  checked={config.performance.memoryProfiling}
                  onCheckedChange={(checked) => updateConfig('performance', 'memoryProfiling', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security features and protections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="csrf">CSRF Protection</Label>
                <Switch
                  id="csrf"
                  checked={config.security.csrfProtection}
                  onCheckedChange={(checked) => updateConfig('security', 'csrfProtection', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="rateLimit">Rate Limiting</Label>
                <Switch
                  id="rateLimit"
                  checked={config.security.rateLimit}
                  onCheckedChange={(checked) => updateConfig('security', 'rateLimit', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sanitization">Input Sanitization</Label>
                <Switch
                  id="sanitization"
                  checked={config.security.sanitization}
                  onCheckedChange={(checked) => updateConfig('security', 'sanitization', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="headers">Security Headers</Label>
                <Switch
                  id="headers"
                  checked={config.security.headers}
                  onCheckedChange={(checked) => updateConfig('security', 'headers', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
              <CardDescription>
                Configure build and runtime optimizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="lazyLoading">Lazy Loading</Label>
                <Switch
                  id="lazyLoading"
                  checked={config.optimization.lazyLoading}
                  onCheckedChange={(checked) => updateConfig('optimization', 'lazyLoading', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="codeSplitting">Code Splitting</Label>
                <Switch
                  id="codeSplitting"
                  checked={config.optimization.codesplitting}
                  onCheckedChange={(checked) => updateConfig('optimization', 'codesplitting', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="compression">Compression</Label>
                <Switch
                  id="compression"
                  checked={config.optimization.compression}
                  onCheckedChange={(checked) => updateConfig('optimization', 'compression', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="minification">Minification</Label>
                <Switch
                  id="minification"
                  checked={config.optimization.minification}
                  onCheckedChange={(checked) => updateConfig('optimization', 'minification', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debugging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debugging Settings</CardTitle>
              <CardDescription>
                Configure debugging and logging options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="debugEnabled">Enable Debugging</Label>
                <Switch
                  id="debugEnabled"
                  checked={config.debugging.enabled}
                  onCheckedChange={(checked) => updateConfig('debugging', 'enabled', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logLevel">Log Level</Label>
                <Select
                  value={config.debugging.level}
                  onValueChange={(value) => updateConfig('debugging', 'level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="consoleOutput">Console Output</Label>
                <Switch
                  id="consoleOutput"
                  checked={config.debugging.consoleOutput}
                  onCheckedChange={(checked) => updateConfig('debugging', 'consoleOutput', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="errorReporting">Error Reporting</Label>
                <Switch
                  id="errorReporting"
                  checked={config.debugging.errorReporting}
                  onCheckedChange={(checked) => updateConfig('debugging', 'errorReporting', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Caching Settings</CardTitle>
              <CardDescription>
                Configure caching strategy and options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="cachingEnabled">Enable Caching</Label>
                <Switch
                  id="cachingEnabled"
                  checked={config.caching.enabled}
                  onCheckedChange={(checked) => updateConfig('caching', 'enabled', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ttl">TTL (seconds)</Label>
                <Input
                  id="ttl"
                  type="number"
                  value={config.caching.ttl}
                  onChange={(e) => updateConfig('caching', 'ttl', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy">Cache Strategy</Label>
                <Select
                  value={config.caching.strategy}
                  onValueChange={(value) => updateConfig('caching', 'strategy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lru">LRU (Least Recently Used)</SelectItem>
                    <SelectItem value="lfu">LFU (Least Frequently Used)</SelectItem>
                    <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cacheSize">Cache Size (MB)</Label>
                <Input
                  id="cacheSize"
                  type="number"
                  value={config.caching.size}
                  onChange={(e) => updateConfig('caching', 'size', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
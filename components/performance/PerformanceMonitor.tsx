'use client';

import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface PerformanceMetrics {
  fps: number;
  memoryUsed: number;
  memoryTotal: number;
  cpuUsage: number;
  networkLatency: number;
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  interactionLatency: number;
}

interface VitalsMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsed: 0,
    memoryTotal: 0,
    cpuUsage: 0,
    networkLatency: 0,
    bundleSize: 0,
    loadTime: 0,
    renderTime: 0,
    interactionLatency: 0,
  });

  const [vitals, setVitals] = useState<VitalsMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    // Performance API metrics
    const updatePerformanceMetrics = () => {
      // FPS tracking
      let fps = 60;
      let frameCount = 0;
      let lastTime = performance.now();

      const countFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 1000) {
          fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          frameCount = 0;
          lastTime = currentTime;
        }
        requestAnimationFrame(countFPS);
      };
      requestAnimationFrame(countFPS);

      // Memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsed: memory.usedJSHeapSize / 1024 / 1024,
          memoryTotal: memory.totalJSHeapSize / 1024 / 1024,
          fps,
        }));
      }

      // Network timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          networkLatency: navigation.responseStart - navigation.requestStart,
        }));
      }

      // CPU usage simulation (approximation)
      const startTime = performance.now();
      setTimeout(() => {
        const endTime = performance.now();
        const cpuUsage = Math.min(100, Math.max(0, ((endTime - startTime - 16) / 16) * 100));
        setMetrics(prev => ({ ...prev, cpuUsage }));
      }, 16);
    };

    // Web Vitals calculation
    const calculateVitals = () => {
      const newVitals: VitalsMetric[] = [
        {
          name: 'Largest Contentful Paint',
          value: metrics.loadTime,
          unit: 'ms',
          status: metrics.loadTime <= 2500 ? 'good' : metrics.loadTime <= 4000 ? 'needs-improvement' : 'poor',
          threshold: { good: 2500, poor: 4000 },
        },
        {
          name: 'First Input Delay',
          value: metrics.interactionLatency,
          unit: 'ms',
          status: metrics.interactionLatency <= 100 ? 'good' : metrics.interactionLatency <= 300 ? 'needs-improvement' : 'poor',
          threshold: { good: 100, poor: 300 },
        },
        {
          name: 'Cumulative Layout Shift',
          value: 0.1, // Simulated
          unit: '',
          status: 0.1 <= 0.1 ? 'good' : 0.1 <= 0.25 ? 'needs-improvement' : 'poor',
          threshold: { good: 0.1, poor: 0.25 },
        },
      ];
      setVitals(newVitals);
    };

    const interval = setInterval(() => {
      updatePerformanceMetrics();
      calculateVitals();
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring, metrics.loadTime, metrics.interactionLatency]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'needs-improvement': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'good': return 'default';
      case 'needs-improvement': return 'secondary';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time performance metrics and Web Vitals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Monitoring' : 'Stopped'}
          </Badge>
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FPS</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.fps}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.fps >= 60 ? 'Excellent' : metrics.fps >= 30 ? 'Good' : 'Poor'}
                </p>
                <Progress value={(metrics.fps / 60) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.memoryUsed.toFixed(1)} MB
                </div>
                <p className="text-xs text-muted-foreground">
                  of {metrics.memoryTotal.toFixed(1)} MB
                </p>
                <Progress 
                  value={(metrics.memoryUsed / metrics.memoryTotal) * 100} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cpuUsage.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.cpuUsage < 50 ? 'Low' : metrics.cpuUsage < 80 ? 'Medium' : 'High'}
                </p>
                <Progress value={metrics.cpuUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.networkLatency.toFixed(0)}ms</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.networkLatency < 100 ? 'Fast' : metrics.networkLatency < 300 ? 'Good' : 'Slow'}
                </p>
                <Progress value={Math.min(100, (300 - metrics.networkLatency) / 3)} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid gap-4">
            {vitals.map((vital, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{vital.name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(vital.status)}>
                      {vital.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-3xl font-bold ${getStatusColor(vital.status)}`}>
                      {vital.value.toFixed(vital.name === 'Cumulative Layout Shift' ? 3 : 0)}
                      <span className="text-lg text-gray-500 ml-1">{vital.unit}</span>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div>Good: ≤ {vital.threshold.good}{vital.unit}</div>
                      <div>Poor: > {vital.threshold.poor}{vital.unit}</div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={Math.min(100, (vital.value / (vital.threshold.poor * 2)) * 100)} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span className="text-green-500">Good</span>
                      <span className="text-yellow-500">Needs Improvement</span>
                      <span className="text-red-500">Poor</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Timeline
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Load Time</span>
                    <span className="text-lg">{metrics.loadTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Render Time</span>
                    <span className="text-lg">{metrics.renderTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Interaction Latency</span>
                    <span className="text-lg">{metrics.interactionLatency.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Bundle Size</span>
                    <span className="text-lg">{(metrics.bundleSize / 1024).toFixed(1)}KB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Performance Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.fps < 30 && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-red-700 dark:text-red-300 text-sm">
                        Low FPS detected ({metrics.fps}). Consider optimizing animations or reducing complexity.
                      </p>
                    </div>
                  )}
                  {metrics.memoryUsed / metrics.memoryTotal > 0.8 && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                        High memory usage ({((metrics.memoryUsed / metrics.memoryTotal) * 100).toFixed(1)}%). Consider memory optimization.
                      </p>
                    </div>
                  )}
                  {metrics.cpuUsage > 80 && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-red-700 dark:text-red-300 text-sm">
                        High CPU usage ({metrics.cpuUsage.toFixed(1)}%). Consider reducing computational load.
                      </p>
                    </div>
                  )}
                  {vitals.filter(v => v.status === 'poor').length === 0 && 
                   metrics.fps >= 30 && 
                   metrics.memoryUsed / metrics.memoryTotal <= 0.8 && 
                   metrics.cpuUsage <= 80 && (
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        All performance metrics are within acceptable ranges.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tool, Server, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

interface MCPTool {
  name: string;
  description: string;
  schema: any;
}

interface MCPServer {
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  tools: MCPTool[];
  url?: string;
}

interface MCPToolsProps {
  servers?: MCPServer[];
  onRefresh?: () => Promise<void>;
  onExecuteTool?: (serverName: string, toolName: string, params: any) => Promise<any>;
}

const defaultServers: MCPServer[] = [
  {
    name: 'filesystem',
    status: 'connected',
    tools: [
      {
        name: 'read_file',
        description: 'Read contents of a file',
        schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' }
          },
          required: ['path']
        }
      },
      {
        name: 'write_file',
        description: 'Write contents to a file',
        schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to write' },
            content: { type: 'string', description: 'Content to write' }
          },
          required: ['path', 'content']
        }
      }
    ]
  },
  {
    name: 'web-search',
    status: 'connected',
    tools: [
      {
        name: 'search_web',
        description: 'Search the web for information',
        schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Number of results', default: 10 }
          },
          required: ['query']
        }
      }
    ]
  },
  {
    name: 'code-analysis',
    status: 'disconnected',
    tools: [
      {
        name: 'analyze_code',
        description: 'Analyze code for issues and suggestions',
        schema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Code to analyze' },
            language: { type: 'string', description: 'Programming language' }
          },
          required: ['code', 'language']
        }
      }
    ]
  }
];

export function MCPTools({ servers = defaultServers, onRefresh, onExecuteTool }: MCPToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Mock refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Failed to refresh MCP servers:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExecuteTool = async (serverName: string, toolName: string) => {
    try {
      if (onExecuteTool) {
        const result = await onExecuteTool(serverName, toolName, {});
        console.log('Tool execution result:', result);
      } else {
        console.log(`Executing ${toolName} on ${serverName}`);
      }
    } catch (error) {
      console.error('Failed to execute tool:', error);
    }
  };

  const toggleServer = (serverName: string) => {
    setExpandedServer(expandedServer === serverName ? null : serverName);
  };

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const connectedServers = servers.filter(s => s.status === 'connected');
  const totalTools = connectedServers.reduce((acc, server) => acc + server.tools.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 relative">
          <Tool className="w-4 h-4" />
          MCP Tools
          {totalTools > 0 && (
            <Badge variant="secondary" className="text-xs h-5 min-w-5 flex items-center justify-center">
              {totalTools}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tool className="w-5 h-5" />
            Model Context Protocol Tools
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {connectedServers.length} server{connectedServers.length !== 1 ? 's' : ''} connected • {totalTools} tool{totalTools !== 1 ? 's' : ''} available
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {servers.length === 0 ? (
            <div className="text-center py-8">
              <Tool className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No MCP Servers Configured</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configure MCP servers in settings to access external tools and services.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {servers.map((server) => (
                <Card key={server.name} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => toggleServer(server.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedServer === server.name ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`} />
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{server.name}</CardTitle>
                          <CardDescription>{server.tools.length} tool{server.tools.length !== 1 ? 's' : ''}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={server.status === 'connected' ? 'default' : 'secondary'}>
                        {server.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {expandedServer === server.name && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {server.tools.map((tool) => (
                          <div key={tool.name} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Tool className="w-4 h-4" />
                                <span className="font-medium">{tool.name}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExecuteTool(server.name, tool.name)}
                              disabled={server.status !== 'connected'}
                            >
                              Execute
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
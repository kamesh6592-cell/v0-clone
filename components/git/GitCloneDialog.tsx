'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { GitBranch, Download, Loader2 } from 'lucide-react';

interface GitCloneDialogProps {
  onCloneComplete?: (repoData: any) => void;
}

export function GitCloneDialog({ onCloneComplete }: GitCloneDialogProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleClone = async () => {
    if (!repoUrl.trim()) return;

    setIsCloning(true);
    
    try {
      // Simulate cloning process
      // In a real implementation, this would use isomorphic-git or similar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful clone
      const mockRepoData = {
        name: repoUrl.split('/').pop()?.replace('.git', '') || 'repository',
        url: repoUrl,
        files: {
          '/README.md': {
            type: 'file' as const,
            content: `# ${repoUrl.split('/').pop()?.replace('.git', '') || 'Repository'}\n\nCloned from: ${repoUrl}`
          },
          '/package.json': {
            type: 'file' as const,
            content: JSON.stringify({
              name: repoUrl.split('/').pop()?.replace('.git', '') || 'repository',
              version: '1.0.0',
              description: 'Cloned repository'
            }, null, 2)
          }
        }
      };

      onCloneComplete?.(mockRepoData);
      setIsOpen(false);
      setRepoUrl('');
    } catch (error) {
      console.error('Clone failed:', error);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Clone Repository
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Clone Git Repository
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="repo-url" className="block text-sm font-medium mb-2">
              Repository URL
            </label>
            <Input
              id="repo-url"
              type="url"
              placeholder="https://github.com/username/repository.git"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isCloning}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCloning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClone}
              disabled={!repoUrl.trim() || isCloning}
              className="flex items-center gap-2"
            >
              {isCloning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Clone
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GitCloneDialog;
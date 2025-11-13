'use client';

import { useState } from 'react';
import { STARTER_TEMPLATES, type Template } from './constants';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Rocket, FileCode } from 'lucide-react';

interface TemplateGalleryProps {
  onSelectTemplate?: (template: Template) => void;
}

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STARTER_TEMPLATES.map((template) => (
          <Card key={template.name} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{template.icon}</span>
                {template.label}
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button 
                onClick={() => handleTemplateSelect(template)}
                className="w-full flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedTemplate?.icon}</span>
              Create {selectedTemplate?.label} Project
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Project Structure:</h4>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm font-mono">
                  {selectedTemplate.files && Object.keys(selectedTemplate.files).map((file) => (
                    <div key={file} className="flex items-center gap-2 py-1">
                      <FileCode className="w-4 h-4" />
                      {file}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Technologies:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmSelection} className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Create Project
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StarterTemplates({ onSelectTemplate }: TemplateGalleryProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose a Template</h3>
        <p className="text-gray-600 dark:text-gray-400">Start with a pre-configured project template</p>
      </div>
      
      <TemplateGallery onSelectTemplate={onSelectTemplate} />
      
      <div className="text-center text-sm text-gray-500">
        <p>Or start with a blank project and configure it yourself</p>
      </div>
    </div>
  );
}
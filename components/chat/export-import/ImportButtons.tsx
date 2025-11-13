'use client';

import { useRef } from 'react';
import { Button } from '../../ui/button';
import { Upload, FolderOpen } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

type ChatData = {
  messages?: Message[];
  description?: string;
};

interface ImportButtonsProps {
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  importFolder?: (files: FileList) => Promise<void>;
}

export function ImportButtons({ importChat, importFolder }: ImportButtonsProps) {
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleChatImport = async (file: File) => {
    if (!importChat) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content) as ChatData;

      if (Array.isArray(data.messages)) {
        await importChat(data.description || 'Imported Chat', data.messages);
        console.log('Chat imported successfully');
      } else {
        throw new Error('Invalid chat file format');
      }
    } catch (error) {
      console.error('Failed to import chat:', error);
    }
  };

  const handleFolderImport = async (files: FileList) => {
    if (!importFolder) return;

    try {
      await importFolder(files);
      console.log('Folder imported successfully');
    } catch (error) {
      console.error('Failed to import folder:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <input
        ref={chatFileInputRef}
        type="file"
        className="hidden"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleChatImport(file);
          }
          e.target.value = '';
        }}
      />

      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        webkitdirectory=""
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            handleFolderImport(files);
          }
          e.target.value = '';
        }}
      />

      <div className="flex gap-4">
        <Button
          onClick={() => chatFileInputRef.current?.click()}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Import Chat
        </Button>

        <Button
          onClick={() => folderInputRef.current?.click()}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Import Folder
        </Button>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400 max-w-md">
        <p>Import a previous chat conversation or upload project files to continue working.</p>
      </div>
    </div>
  );
}
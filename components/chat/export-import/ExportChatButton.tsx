'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Download, MessageCircle, Code, Share } from 'lucide-react';
import { Button } from '../../ui/button';

interface ExportChatButtonProps {
  exportChat?: () => void;
  downloadCode?: () => void;
  chatId?: string;
}

export const ExportChatButton = ({ exportChat, downloadCode, chatId }: ExportChatButtonProps) => {
  const handleDownloadCode = () => {
    if (downloadCode) {
      downloadCode();
    } else {
      // Default implementation - create a ZIP of the current project
      console.log('Downloading code for chat:', chatId);
      // This would integrate with WebContainer to package files
    }
  };

  const handleExportChat = () => {
    if (exportChat) {
      exportChat();
    } else {
      // Default implementation - export chat as JSON
      console.log('Exporting chat:', chatId);
      // This would export the current chat conversation
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Content
        className="z-50 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1"
        sideOffset={5}
        align="end"
      >
        <DropdownMenu.Item
          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          onClick={handleDownloadCode}
        >
          <Code className="w-4 h-4" />
          <span>Download Code</span>
        </DropdownMenu.Item>
        
        <DropdownMenu.Item
          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          onClick={handleExportChat}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Export Chat</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
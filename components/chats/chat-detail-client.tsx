'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { ChatMessages } from '@/components/chat/chat-messages'
import { ChatInput } from '@/components/chat/chat-input'
import { PreviewPanel } from '@/components/chat/preview-panel'
import { ResizableLayout } from '@/components/shared/resizable-layout'
import { BottomToolbar } from '@/components/shared/bottom-toolbar'
import { useChat } from '@/hooks/use-chat'
import { useStreaming } from '@/contexts/streaming-context'
import { cn } from '@/lib/utils'
import {
  type ImageAttachment,
  clearPromptFromStorage,
} from '@/components/ai-elements/prompt-input'

export function ChatDetailClient() {
  const params = useParams()
  const chatId = params.chatId as string
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [attachments, setAttachments] = useState<ImageAttachment[]>([])
  const [activePanel, setActivePanel] = useState<'chat' | 'preview'>('chat')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { handoff } = useStreaming()
  const {
    message,
    setMessage,
    currentChat,
    isLoading,
    setIsLoading,
    isStreaming,
    chatHistory,
    isLoadingChat,
    handleSendMessage,
    handleStreamingComplete,
    handleChatData,
    currentProvider,
  } = useChat(chatId)

  // Wrapper function to handle attachments
  const handleSubmitWithAttachments = (
    e: React.FormEvent<HTMLFormElement>,
    attachmentUrls?: Array<{ url: string }>,
  ) => {
    // Clear sessionStorage immediately upon submission
    clearPromptFromStorage()
    // Clear attachments after sending
    setAttachments([])
    return handleSendMessage(e, attachmentUrls)
  }

  // Handle fullscreen keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Auto-focus the textarea on page load
  useEffect(() => {
    if (textareaRef.current && !isLoadingChat) {
      textareaRef.current.focus()
    }
  }, [isLoadingChat])

  return (
    <div
      className={cn(
        'min-h-screen bg-gray-50 dark:bg-black',
        isFullscreen && 'fixed inset-0 z-50',
      )}
    >
      <AppHeader />

      <div className="flex flex-col h-[calc(100vh-64px-1px)] md:h-[calc(100vh-64px-1px)]">
        <ResizableLayout
          className="flex-1 min-h-0"
          singlePanelMode={false}
          activePanel={activePanel === 'chat' ? 'left' : 'right'}
          leftPanel={
            <div className="flex flex-col h-full relative">
              {isStreaming && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-3 py-1.5 shadow-md border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    AI:
                  </span>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                    currentProvider === 'v0' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    currentProvider === 'claude' && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                    currentProvider === 'grok' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  )}>
                    {currentProvider === 'v0' ? 'v0' : currentProvider === 'claude' ? 'Claude' : 'Grok'}
                  </span>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                <ChatMessages
                  chatHistory={chatHistory}
                  isLoading={isLoading}
                  currentChat={currentChat || null}
                  onStreamingComplete={handleStreamingComplete}
                  onChatData={handleChatData}
                  onStreamingStarted={() => setIsLoading(false)}
                />
              </div>

              <ChatInput
                message={message}
                setMessage={setMessage}
                onSubmit={handleSubmitWithAttachments}
                isLoading={isLoading}
                showSuggestions={false}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                textareaRef={textareaRef}
              />
            </div>
          }
          rightPanel={
            <PreviewPanel
              currentChat={currentChat || null}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              refreshKey={refreshKey}
              setRefreshKey={setRefreshKey}
            />
          }
        />

        <div className="md:hidden">
          <BottomToolbar
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            hasPreview={!!currentChat}
          />
        </div>
      </div>
    </div>
  )
}

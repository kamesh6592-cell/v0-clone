'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  PromptInput,
  PromptInputImageButton,
  PromptInputImagePreview,
  PromptInputMicButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  createImageAttachment,
  createImageAttachmentFromStored,
  savePromptToStorage,
  loadPromptFromStorage,
  clearPromptFromStorage,
  type ImageAttachment,
} from '@/components/ai-elements/prompt-input'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { AppHeader } from '@/components/shared/app-header'
import { ChatMessages } from '@/components/chat/chat-messages'
import { ChatInput } from '@/components/chat/chat-input'
import { PreviewPanel } from '@/components/chat/preview-panel'
import { ResizableLayout } from '@/components/shared/resizable-layout'
import { BottomToolbar } from '@/components/shared/bottom-toolbar'
import { TemplatesShowcase } from '@/components/home/templates-showcase'
import { useProvider } from '@/contexts/provider-context'
import { cn } from '@/lib/utils'

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SearchParamsHandler({ onReset }: { onReset: () => void }) {
  const searchParams = useSearchParams()

  // Reset UI when reset parameter is present
  useEffect(() => {
    const reset = searchParams.get('reset')
    if (reset === 'true') {
      onReset()

      // Remove the reset parameter from URL without triggering navigation
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('reset')
      window.history.replaceState({}, '', newUrl.pathname)
    }
  }, [searchParams, onReset])

  return null
}

export function HomeClient() {
  const { provider, streaming } = useProvider()
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showChatInterface, setShowChatInterface] = useState(false)
  const [attachments, setAttachments] = useState<ImageAttachment[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [chatHistory, setChatHistory] = useState<
    Array<{
      type: 'user' | 'assistant'
      content: string | any
      isStreaming?: boolean
      stream?: ReadableStream<Uint8Array> | null
    }>
  >([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentChat, setCurrentChat] = useState<{
    id: string
    demo?: string
  } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activePanel, setActivePanel] = useState<'chat' | 'preview'>('chat')
  const [currentProvider, setCurrentProvider] = useState<string>('v0')
  const [isStreaming, setIsStreaming] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleReset = () => {
    // Reset all chat-related state
    setShowChatInterface(false)
    setChatHistory([])
    setCurrentChatId(null)
    setCurrentChat(null)
    setMessage('')
    setAttachments([])
    setIsLoading(false)
    setIsFullscreen(false)
    setRefreshKey((prev) => prev + 1)

    // Clear any stored data
    clearPromptFromStorage()

    // Focus textarea after reset
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Auto-focus the textarea on page load and restore from sessionStorage
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }

    // Restore prompt data from sessionStorage
    const storedData = loadPromptFromStorage()
    if (storedData) {
      setMessage(storedData.message)
      if (storedData.attachments.length > 0) {
        const restoredAttachments = storedData.attachments.map(
          createImageAttachmentFromStored,
        )
        setAttachments(restoredAttachments)
      }
    }
  }, [])

  // Save prompt data to sessionStorage whenever message or attachments change
  useEffect(() => {
    if (message.trim() || attachments.length > 0) {
      savePromptToStorage(message, attachments)
    } else {
      // Clear sessionStorage if both message and attachments are empty
      clearPromptFromStorage()
    }
  }, [message, attachments])

  // Image attachment handlers
  const handleImageFiles = async (files: File[]) => {
    try {
      const newAttachments = await Promise.all(
        files.map((file) => createImageAttachment(file)),
      )
      setAttachments((prev) => [...prev, ...newAttachments])
    } catch (error) {
      console.error('Error processing image files:', error)
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  const handleDragOver = () => {
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = () => {
    setIsDragOver(false)
  }

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    const currentAttachments = [...attachments]

    // Clear sessionStorage immediately upon submission
    clearPromptFromStorage()

    setMessage('')
    setAttachments([])

    // Immediately show chat interface and add user message
    setShowChatInterface(true)
    setChatHistory([
      {
        type: 'user',
        content: userMessage,
      },
    ])
    setIsLoading(true)

    try {
      console.log('Sending message with provider:', provider, 'streaming:', streaming)
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          streaming,
          provider,
          attachments: currentAttachments.map((att) => ({ url: att.dataUrl })),
        }),
      })

      console.log('API Response:', response.status, response.statusText)

      if (!response.ok) {
        // Try to get the specific error message from the response
        let errorMessage =
          'Sorry, there was an error processing your message. Please try again.'
        try {
          const errorData = await response.json()
          console.error('API Error Response:', errorData)
          if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.message) {
            errorMessage = errorData.message
          } else if (response.status === 429) {
            errorMessage =
              'You have exceeded your maximum number of messages for the day. Please try again later.'
          } else if (response.status === 503) {
            errorMessage = 'All AI providers are currently unavailable. Please try again later.'
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          if (response.status === 429) {
            errorMessage =
              'You have exceeded your maximum number of messages for the day. Please try again later.'
          } else if (response.status === 503) {
            errorMessage = 'All AI providers are currently unavailable. Please try again later.'
          }
        }
        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error('No response body for streaming')
      }

      setIsLoading(false)

      // Add streaming assistant response
      setIsStreaming(true)
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: [],
          isStreaming: true,
          stream: response.body,
        },
      ])
    } catch (error) {
      console.error('Error creating chat:', error)
      setIsLoading(false)

      // Use the specific error message if available, otherwise fall back to generic message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Sorry, there was an error processing your message. Please try again.'

      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: errorMessage,
        },
      ])
    }
  }

  const handleChatData = async (chatData: any) => {
    // Extract provider info if available
    if (chatData.provider) {
      console.log('Provider detected:', chatData.provider)
      setCurrentProvider(chatData.provider)
    }
    
    if (chatData.id) {
      // Only set currentChat if it's not already set or if this is the main chat object
      if (!currentChatId || chatData.object === 'chat') {
        setCurrentChatId(chatData.id)
        setCurrentChat({ id: chatData.id })

        // Update URL without triggering Next.js routing
        window.history.pushState(null, '', `/chats/${chatData.id}`)
      }

      // Create ownership record for new chat (only if this is a new chat)
      if (!currentChatId) {
        try {
          await fetch('/api/chat/ownership', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId: chatData.id,
            }),
          })
        } catch (error) {
          console.error('Failed to create chat ownership:', error)
          // Don't fail the UI if ownership creation fails
        }
      }
    }
  }

  const handleStreamingComplete = async (finalContent: any) => {
    setIsLoading(false)
    setIsStreaming(false)

    // Update chat history with final content
    setChatHistory((prev) => {
      const updated = [...prev]
      const lastIndex = updated.length - 1
      if (lastIndex >= 0 && updated[lastIndex].isStreaming) {
        updated[lastIndex] = {
          ...updated[lastIndex],
          content: finalContent,
          isStreaming: false,
          stream: undefined,
        }
      }
      return updated
    })

    // Fetch demo URL after streaming completes
    // Use the current state by accessing it in the state updater
    setCurrentChat((prevCurrentChat) => {
      if (prevCurrentChat?.id) {
        // Fetch demo URL asynchronously
        fetch(`/api/chats/${prevCurrentChat.id}`)
          .then((response) => {
            if (response.ok) {
              return response.json()
            } else {
              console.warn('Failed to fetch chat details:', response.status)
              return null
            }
          })
          .then((chatDetails) => {
            if (chatDetails) {
              const demoUrl =
                chatDetails?.latestVersion?.demoUrl || chatDetails?.demo

              // Update the current chat with demo URL
              if (demoUrl) {
                setCurrentChat((prev) =>
                  prev ? { ...prev, demo: demoUrl } : null,
                )
                if (window.innerWidth < 768) {
                  setActivePanel('preview')
                }
              }
            }
          })
          .catch((error) => {
            console.error('Error fetching demo URL:', error)
          })
      }

      // Return the current state unchanged for now
      return prevCurrentChat
    })
  }

  const handleChatSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() || isLoading || !currentChatId) return

    const userMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    // Add user message to chat history
    setChatHistory((prev) => [...prev, { type: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chatId: currentChatId,
          streaming,
          provider,
        }),
      })

      if (!response.ok) {
        // Try to get the specific error message from the response
        let errorMessage =
          'Sorry, there was an error processing your message. Please try again.'
        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = errorData.message
          } else if (response.status === 429) {
            errorMessage =
              'You have exceeded your maximum number of messages for the day. Please try again later.'
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          if (response.status === 429) {
            errorMessage =
              'You have exceeded your maximum number of messages for the day. Please try again later.'
          }
        }
        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error('No response body for streaming')
      }

      setIsLoading(false)

      // Add streaming response
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: [],
          isStreaming: true,
          stream: response.body,
        },
      ])
    } catch (error) {
      console.error('Error:', error)

      // Use the specific error message if available, otherwise fall back to generic message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Sorry, there was an error processing your message. Please try again.'

      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: errorMessage,
        },
      ])
      setIsLoading(false)
    }
  }

  if (showChatInterface) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
        {/* Handle search params with Suspense boundary */}
        <Suspense fallback={null}>
          <SearchParamsHandler onReset={handleReset} />
        </Suspense>

        <AppHeader />

        {/* Chat Action Buttons */}
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center gap-2 bg-white dark:bg-gray-900">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-64px-40px-48px)] md:h-[calc(100vh-64px-48px)]">
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
                    currentChat={currentChat}
                    onStreamingComplete={handleStreamingComplete}
                    onChatData={handleChatData}
                    onStreamingStarted={() => setIsLoading(false)}
                  />
                </div>

                <ChatInput
                  message={message}
                  setMessage={setMessage}
                  onSubmit={handleChatSendMessage}
                  isLoading={isLoading}
                  showSuggestions={false}
                />
              </div>
            }
            rightPanel={
              <PreviewPanel
                currentChat={currentChat}
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Bolt.new style animated background gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/20 bg-purple-300/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/20 bg-indigo-300/30 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/10 bg-blue-300/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}} />
        <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-pink-500/15 dark:bg-pink-500/15 bg-pink-300/25 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}} />
      </div>
      
      {/* Handle search params with Suspense boundary */}
      <Suspense fallback={null}>
        <SearchParamsHandler onReset={handleReset} />
      </Suspense>

      <AppHeader />

      {/* Main Content - Bolt.new Hero Style */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8 md:mb-12 space-y-6 animate-fade-in">
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src="/aj-logo.jpg"
                  alt="AJ STUDIOZ"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-2xl ring-2 ring-white/20"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-lg" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
                AJ STUDIOZ
              </h1>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 mb-3">
              What can we <span className="gradient-text">build</span> together?
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Powered by AI. Generate stunning React components, apps, and interfaces with natural language.
            </p>
          </div>

          {/* Prompt Input - Bolt.new Style */}
          <div className="max-w-3xl mx-auto">
            <PromptInput
              onSubmit={handleSendMessage}
              className="w-full relative glass-effect rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-slide-in-right"
              onImageDrop={handleImageFiles}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <PromptInputImagePreview
                attachments={attachments}
                onRemove={handleRemoveAttachment}
              />
              <PromptInputTextarea
                ref={textareaRef}
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                placeholder="✨ Describe what you want to build... (e.g., 'A modern landing page with hero section')"
                className="min-h-[100px] text-base bg-transparent resize-none focus:outline-none text-gray-100 placeholder:text-gray-500"
                disabled={isLoading}
              />
              <PromptInputToolbar>
                <PromptInputTools>
                  <PromptInputImageButton
                    onImageSelect={handleImageFiles}
                    disabled={isLoading}
                  />
                </PromptInputTools>
                <PromptInputTools>
                  <PromptInputMicButton
                    onTranscript={(transcript) => {
                      setMessage(
                        (prev) => prev + (prev ? ' ' : '') + transcript,
                      )
                    }}
                    onError={(error) => {
                      console.error('Speech recognition error:', error)
                    }}
                    disabled={isLoading}
                  />
                  <PromptInputSubmit
                    disabled={!message.trim() || isLoading}
                    status={isLoading ? 'streaming' : 'ready'}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200 disabled:opacity-50"
                  />
                </PromptInputTools>
              </PromptInputToolbar>
            </PromptInput>
          </div>

          {/* Templates Showcase */}
          <div className="mt-12">
            <TemplatesShowcase
              onSelectTemplate={(prompt) => {
                setMessage(prompt)
                // Submit after setting message
                setTimeout(() => {
                  const form = textareaRef.current?.form
                  if (form) {
                    form.requestSubmit()
                  }
                }, 100)
              }}
            />
          </div>

          {/* Suggestions */}
          <div className="mt-4 max-w-2xl mx-auto">
            <Suggestions>
              <Suggestion
                onClick={() => {
                  setMessage('Landing page')
                  // Submit after setting message
                  setTimeout(() => {
                    const form = textareaRef.current?.form
                    if (form) {
                      form.requestSubmit()
                    }
                  }, 0)
                }}
                suggestion="Landing page"
              />
              <Suggestion
                onClick={() => {
                  setMessage('Todo app')
                  // Submit after setting message
                  setTimeout(() => {
                    const form = textareaRef.current?.form
                    if (form) {
                      form.requestSubmit()
                    }
                  }, 0)
                }}
                suggestion="Todo app"
              />
              <Suggestion
                onClick={() => {
                  setMessage('Dashboard')
                  // Submit after setting message
                  setTimeout(() => {
                    const form = textareaRef.current?.form
                    if (form) {
                      form.requestSubmit()
                    }
                  }, 0)
                }}
                suggestion="Dashboard"
              />
              <Suggestion
                onClick={() => {
                  setMessage('Blog')
                  // Submit after setting message
                  setTimeout(() => {
                    const form = textareaRef.current?.form
                    if (form) {
                      form.requestSubmit()
                    }
                  }, 0)
                }}
                suggestion="Blog"
              />
              <Suggestion
                onClick={() => {
                  setMessage('E-commerce')
                  // Submit after setting message
                  setTimeout(() => {
                    const form = textareaRef.current?.form
                    if (form) {
                      form.requestSubmit()
                    }
                  }, 0)
                }}
                suggestion="E-commerce"
              />
              <Suggestion
                onClick={() => {
                  setMessage('Portfolio')
                  // Submit after setting message
                  setTimeout(() => {
                    const form = textareaRef.current?.form
                    if (form) {
                      form.requestSubmit()
                    }
                  }, 0)
                }}
                suggestion="Portfolio"
              />
              <Suggestion
                onClick={() => {
                  setMessage('Chat app')
                  // Submit after setting message
                  setTimeout(() => {
                    const form = textareaRef.current?.form
                    if (form) {
                      form.requestSubmit()
                    }
                  }, 0)
                }}
                suggestion="Chat app"
              />
              <Suggestion
                onClick={() => {
                  setMessage('Calculator')
                  // Submit after setting message
                  setTimeout(() => {
                    const form = textareaRef.current?.form
                    if (form) {
                      form.requestSubmit()
                    }
                  }, 0)
                }}
                suggestion="Calculator"
              />
            </Suggestions>
          </div>

          {/* Footer */}
          <div className="mt-8 md:mt-16 text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span>Powered by</span>
              <Link
                href="https://v0-sdk.dev"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                v0
              </Link>
              <span>•</span>
              <Link
                href="https://claude.ai"
                className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
              >
                Claude
              </Link>
              <span>•</span>
              <Link
                href="https://x.ai"
                className="text-green-600 dark:text-green-400 hover:underline font-medium"
              >
                Grok
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

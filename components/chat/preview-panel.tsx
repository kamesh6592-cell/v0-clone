import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
  WebPreviewBody,
} from '@/components/ai-elements/web-preview'
import { RefreshCw, Monitor, Maximize, Minimize, Code2, Smartphone, Tablet, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CodeViewer } from '@/components/chat/code-viewer'
import { useState } from 'react'

interface Chat {
  id: string
  demo?: string
  url?: string
}

interface PreviewPanelProps {
  currentChat: Chat | null
  isFullscreen: boolean
  setIsFullscreen: (fullscreen: boolean) => void
  refreshKey: number
  setRefreshKey: (key: number | ((prev: number) => number)) => void
  generatedCode?: string
}

export function PreviewPanel({
  currentChat,
  isFullscreen,
  setIsFullscreen,
  refreshKey,
  setRefreshKey,
  generatedCode,
}: PreviewPanelProps) {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showCode, setShowCode] = useState(false)

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full transition-all duration-300',
        isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-black' : 'flex-1',
      )}
    >
      <WebPreview
        defaultUrl={currentChat?.demo || ''}
        onUrlChange={(url) => {
          // Optional: Handle URL changes if needed
          console.log('Preview URL changed:', url)
        }}
      >
        <WebPreviewNavigation>
          {/* Viewport Mode Toggles */}
          <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
            <WebPreviewNavigationButton
              onClick={() => setViewportMode('desktop')}
              tooltip="Desktop view"
              disabled={!currentChat?.demo}
              className={cn(viewportMode === 'desktop' && 'bg-accent')}
            >
              <Monitor className="h-4 w-4" />
            </WebPreviewNavigationButton>
            <WebPreviewNavigationButton
              onClick={() => setViewportMode('tablet')}
              tooltip="Tablet view"
              disabled={!currentChat?.demo}
              className={cn(viewportMode === 'tablet' && 'bg-accent')}
            >
              <Tablet className="h-4 w-4" />
            </WebPreviewNavigationButton>
            <WebPreviewNavigationButton
              onClick={() => setViewportMode('mobile')}
              tooltip="Mobile view"
              disabled={!currentChat?.demo}
              className={cn(viewportMode === 'mobile' && 'bg-accent')}
            >
              <Smartphone className="h-4 w-4" />
            </WebPreviewNavigationButton>
          </div>

          <WebPreviewNavigationButton
            onClick={() => {
              // Force refresh the iframe by updating the refresh key
              setRefreshKey((prev) => prev + 1)
            }}
            tooltip="Refresh preview"
            disabled={!currentChat?.demo}
          >
            <RefreshCw className="h-4 w-4" />
          </WebPreviewNavigationButton>
          
          <WebPreviewUrl
            readOnly
            placeholder="Your app will appear here..."
            value={currentChat?.demo || ''}
          />

          {/* Code View Toggle */}
          {generatedCode && (
            <WebPreviewNavigationButton
              onClick={() => setShowCode(!showCode)}
              tooltip={showCode ? 'Hide code' : 'View code'}
              className={cn(showCode && 'bg-accent')}
            >
              <Code2 className="h-4 w-4" />
            </WebPreviewNavigationButton>
          )}

          {/* Open in New Tab */}
          {currentChat?.demo && (
            <WebPreviewNavigationButton
              onClick={() => window.open(currentChat.demo, '_blank')}
              tooltip="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </WebPreviewNavigationButton>
          )}

          <WebPreviewNavigationButton
            onClick={() => setIsFullscreen(!isFullscreen)}
            tooltip={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            disabled={!currentChat?.demo}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </WebPreviewNavigationButton>
        </WebPreviewNavigation>
        {currentChat?.demo ? (
          <div className="flex-1 flex justify-center items-center bg-gray-100 dark:bg-gray-950 overflow-auto">
            <div
              style={{
                width: viewportWidths[viewportMode],
                height: '100%',
                transition: 'width 0.3s ease',
              }}
              className="shadow-2xl"
            >
              <WebPreviewBody key={refreshKey} src={currentChat.demo} className="w-full h-full" />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-black">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                No preview available
              </p>
              <p className="text-xs text-gray-700/50 dark:text-gray-200/50">
                Start a conversation to see your app here
              </p>
            </div>
          </div>
        )}
      </WebPreview>

      {/* Code Viewer Modal */}
      {showCode && generatedCode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <CodeViewer 
            code={generatedCode} 
            language="tsx" 
            filename="component.tsx" 
          />
          <button
            onClick={() => setShowCode(false)}
            className="absolute top-4 right-4 p-2 rounded-lg glass-effect hover:bg-white/10 transition-colors"
          >
            <Minimize className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      )}
    </div>
  )
}

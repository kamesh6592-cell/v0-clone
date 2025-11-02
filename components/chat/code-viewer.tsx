'use client'

import { useState } from 'react'
import { Code2, X, Copy, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeViewerProps {
  code?: string
  language?: string
  filename?: string
  className?: string
}

export function CodeViewer({ code, language = 'tsx', filename = 'component.tsx', className }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const handleDownload = () => {
    if (!code) return
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!code) {
    return null
  }

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-6xl h-[80vh] glass-effect rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">Code View</h3>
                  <p className="text-sm text-gray-400">{filename}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-9 px-3 hover:bg-white/10 text-gray-300"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-9 px-3 hover:bg-white/10 text-gray-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-6 bg-[#1e1e1e]">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  background: 'transparent',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "'Geist Mono', 'Fira Code', 'Consolas', monospace",
                  },
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
  )
}

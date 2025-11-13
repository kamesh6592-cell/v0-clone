'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Github, Globe, Cloud, Zap } from 'lucide-react'
import { showNotification } from '@/components/ui/notifications'

interface DeployButtonProps {
  hasPreview?: boolean
  isStreaming?: boolean
}

export function DeployButton({ hasPreview = false, isStreaming = false }: DeployButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployingTo, setDeployingTo] = useState<string | null>(null)

  const handleDeploy = async (platform: string) => {
    setIsDeploying(true)
    setDeployingTo(platform)

    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      showNotification({
        type: 'success',
        title: 'Deployment Successful',
        message: `Your project has been deployed to ${platform}!`,
        duration: 5000
      })
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Deployment Failed',
        message: `Failed to deploy to ${platform}. Please try again.`,
        duration: 5000
      })
    } finally {
      setIsDeploying(false)
      setDeployingTo(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          disabled={!hasPreview || isStreaming || isDeploying}
          className="gap-2"
        >
          {isDeploying ? (
            <>
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Deploying to {deployingTo}...
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4" />
              Deploy
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleDeploy('Vercel')} disabled={isDeploying}>
          <div className="w-4 h-4 bg-black rounded mr-2 flex items-center justify-center">
            <svg viewBox="0 0 76 65" className="w-2.5 h-2.5 fill-white">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          Deploy to Vercel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeploy('Netlify')} disabled={isDeploying}>
          <div className="w-4 h-4 bg-[#00c7b7] rounded mr-2 flex items-center justify-center">
            <Globe className="w-2.5 h-2.5 text-white" />
          </div>
          Deploy to Netlify
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeploy('GitHub Pages')} disabled={isDeploying}>
          <Github className="w-4 h-4 mr-2" />
          Deploy to GitHub Pages
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeploy('Cloudflare')} disabled={isDeploying}>
          <div className="w-4 h-4 bg-[#f38020] rounded mr-2 flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
          Deploy to Cloudflare
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
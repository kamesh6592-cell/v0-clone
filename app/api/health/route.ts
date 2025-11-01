import { NextResponse } from 'next/server'
import { createClient } from 'v0-sdk'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {},
)

async function checkV0Health(): Promise<{ status: string; error?: string }> {
  try {
    // Simple health check - just verify API key is present
    if (!process.env.V0_API_KEY) {
      return { status: 'unavailable', error: 'API key not configured' }
    }
    return { status: 'available' }
  } catch (error: any) {
    return { status: 'error', error: error.message }
  }
}

async function checkClaudeHealth(): Promise<{ status: string; error?: string }> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { status: 'unavailable', error: 'API key not configured' }
    }
    return { status: 'available' }
  } catch (error: any) {
    return { status: 'error', error: error.message }
  }
}

async function checkGrokHealth(): Promise<{ status: string; error?: string }> {
  try {
    if (!process.env.XAI_API_KEY) {
      return { status: 'unavailable', error: 'API key not configured' }
    }
    return { status: 'available' }
  } catch (error: any) {
    return { status: 'error', error: error.message }
  }
}

export async function GET() {
  const [v0Health, claudeHealth, grokHealth] = await Promise.all([
    checkV0Health(),
    checkClaudeHealth(),
    checkGrokHealth(),
  ])

  const allHealthy = 
    v0Health.status === 'available' ||
    claudeHealth.status === 'available' ||
    grokHealth.status === 'available'

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    providers: {
      v0: v0Health,
      claude: claudeHealth,
      grok: grokHealth,
    },
    timestamp: new Date().toISOString(),
  })
}

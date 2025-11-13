import { NextRequest, NextResponse } from 'next/server'
import { createClient, ChatDetail } from 'v0-sdk'
import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { auth } from '@/app/(auth)/auth'
import {
  createChatOwnership,
  createAnonymousChatLog,
  getChatCountByUserId,
  getChatCountByIP,
} from '@/lib/db/queries'
import {
  entitlementsByUserType,
  anonymousEntitlements,
} from '@/lib/entitlements'
import { ChatSDKError } from '@/lib/errors'
import { sendQuotaExhaustedEmail, sendAllProvidersDownEmail } from '@/lib/email'

// Create v0 client with custom baseUrl if V0_API_URL is set
const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {},
)

// Helper function to replace vusercontent.net URLs with custom domain
function replacePreviewDomain(url: string | null | undefined): string | null | undefined {
  if (!url) return url
  const customDomain = process.env.NEXT_PUBLIC_PREVIEW_DOMAIN || 'dev.ajstudioz.co.in'
  
  // Extract the demo ID from URLs like: https://demo-kzmm5r7w08bcjq8epb91.vusercontent.net
  const match = url.match(/https?:\/\/demo-([^\.]+)\.vusercontent\.net/)
  if (match) {
    const demoId = match[1]
    // Return as: https://dev.ajstudioz.co.in/api/preview/demo-id
    return `https://${customDomain}/api/preview/${demoId}`
  }
  
  // Fallback: just replace the domain
  return url.replace(/https?:\/\/[^\/]*\.vusercontent\.net/g, `https://${customDomain}`)
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  // Fallback to connection remote address or unknown
  return 'unknown'
}

// Helper function to inject provider info into v0 stream
function wrapV0StreamWithProvider(originalStream: ReadableStream<Uint8Array>, provider: string = 'v0'): ReadableStream<Uint8Array> {
  const reader = originalStream.getReader()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let isFirstChunk = true

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            controller.close()
            break
          }

          // If this is the first chunk, try to inject provider info
          if (isFirstChunk) {
            isFirstChunk = false
            const text = decoder.decode(value, { stream: true })
            
            // Parse SSE data to find the initial chat object
            const lines = text.split('\n')
            let modified = false
            
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith('data: ') && !lines[i].includes('[DONE]')) {
                try {
                  const data = JSON.parse(lines[i].substring(6))
                  if (data.object === 'chat' && !data.provider) {
                    data.provider = provider
                    // Replace preview domain if demo URL exists
                    if (data.demo) {
                      data.demo = replacePreviewDomain(data.demo)
                    }
                    lines[i] = `data: ${JSON.stringify(data)}`
                    modified = true
                    break
                  }
                } catch (e) {
                  // Not JSON or parsing error, skip
                }
              }
            }
            
            if (modified) {
              controller.enqueue(encoder.encode(lines.join('\n')))
            } else {
              controller.enqueue(value)
            }
          } else {
            controller.enqueue(value)
          }
        }
      } catch (error) {
        controller.error(error)
      }
    }
  })
}

// Helper function to try alternative providers
async function tryAlternativeProvider(
  currentProvider: string,
  errorMessage: string,
  attemptedProviders: Set<string>
): Promise<string> {
  attemptedProviders.add(currentProvider)
  
  console.log('Attempted providers so far:', Array.from(attemptedProviders))
  
  // Send email notification for quota exhaustion
  await sendQuotaExhaustedEmail(currentProvider, errorMessage).catch(err => {
    console.error('Failed to send quota email:', err)
  })
  
  // Define fallback order: v0 → claude → grok → deepseek
  const providerOrder = ['v0', 'claude', 'grok', 'deepseek']
  const nextProvider = providerOrder.find(p => !attemptedProviders.has(p))
  
  if (nextProvider) {
    console.log(`Switching from ${currentProvider} to ${nextProvider}`)
    return nextProvider
  }
  
  // All providers exhausted, send critical alert
  await sendAllProvidersDownEmail().catch(err => {
    console.error('Failed to send all providers down email:', err)
  })
  
  throw new Error('All AI providers quota exhausted')
}

export async function POST(request: NextRequest) {
  let body: any
  let attemptedProviders: Set<string> = new Set()
  
  try {
    const session = await auth()
    body = await request.json()
    const { message, chatId, streaming, attachments, projectId, provider = 'v0', _attemptedProviders } = body
    
    // Restore attempted providers from previous request
    attemptedProviders = new Set<string>(_attemptedProviders || [])
    console.log('Starting request with provider:', provider, 'Previously attempted:', Array.from(attemptedProviders))
    
    // If external providers are failing, force v0 as fallback
    if (!provider || provider === 'v0' || (provider !== 'v0' && attemptedProviders.size > 0)) {
      console.log('Using v0 as primary or fallback provider')
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      )
    }

    // Rate limiting
    if (session?.user?.id) {
      // Authenticated user rate limiting
      const chatCount = await getChatCountByUserId({
        userId: session.user.id,
        differenceInHours: 24,
      })

      const userType = session.user.type
      if (chatCount >= entitlementsByUserType[userType].maxMessagesPerDay) {
        return new ChatSDKError('rate_limit:chat').toResponse()
      }

      console.log('API request:', {
        message,
        chatId,
        streaming,
        userId: session.user.id,
      })
    } else {
      // Anonymous user rate limiting
      const clientIP = getClientIP(request)
      const chatCount = await getChatCountByIP({
        ipAddress: clientIP,
        differenceInHours: 24,
      })

      if (chatCount >= anonymousEntitlements.maxMessagesPerDay) {
        return new ChatSDKError('rate_limit:chat').toResponse()
      }

      console.log('API request (anonymous):', {
        message,
        chatId,
        streaming,
        ip: clientIP,
      })
    }

    console.log('Using provider:', provider)
    console.log('Using baseUrl:', process.env.V0_API_URL || 'default')

    // Force v0 if external providers have issues or no API keys configured
    const useV0AsFallback = () => {
      if (!process.env.ANTHROPIC_API_KEY && provider === 'claude') {
        console.log('No Claude API key, using v0')
        return true
      }
      if (!process.env.XAI_API_KEY && provider === 'grok') {
        console.log('No Grok API key, using v0')
        return true
      }
      if (!process.env.AZURE_API_KEY && provider === 'deepseek') {
        console.log('No Azure API key, using v0')
        return true
      }
      return false
    }

    // Override provider if API keys are missing
    const effectiveProvider = useV0AsFallback() ? 'v0' : provider

    let chat

    // Handle Claude API requests  
    if (effectiveProvider === 'claude') {
      console.log('🔵 Using Claude API for message:', message)
      
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json(
          { error: 'Claude API key not configured' },
          { status: 500 },
        )
      }

      try {
        const anthropicProvider = createAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        })
        
        const systemPrompt = `You are Claude, an AI assistant created by Anthropic. You are an expert React developer with extensive knowledge of modern web development.

Your responsibilities:
1. Generate clean, production-ready React components using TypeScript and Tailwind CSS
2. Follow React best practices and modern patterns (hooks, composition, etc.)
3. Write semantic, accessible HTML
4. Include proper error handling and loading states
5. Add helpful comments for complex logic

When asked about your identity, always identify yourself as Claude (made by Anthropic), not v0 or any other AI.

Respond conversationally for questions, but provide complete, working code for component requests.`

        console.log('Calling Claude API with model: claude-sonnet-4-20250514')

        // Always return complete response (streaming format incompatible with v0-sdk)
        if (false) {
          // Streaming disabled for Claude
          const result = await streamText({
            model: anthropicProvider('claude-sonnet-4-20250514'),
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: message,
              },
            ],
            temperature: 0.7,
          })

          console.log('� Claude stream initiated')

          // Convert AI SDK stream to v0-compatible format
          const encoder = new TextEncoder()
          let fullText = ''
          
          const customStream = new ReadableStream({
            async start(controller) {
              try {
                // Send initial metadata
                const chatId = `claude-${Date.now()}`
                const initialData = {
                  object: 'chat',
                  id: chatId,
                  demo: null,
                  url: null,
                  messages: [],
                  provider: 'claude'
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`))
                console.log('� Sent Claude initial metadata')

                // Stream text chunks
                let chunkCount = 0
                for await (const textPart of result.textStream) {
                  fullText += textPart
                  chunkCount++
                  
                  console.log(`📝 Claude chunk #${chunkCount}:`, textPart.substring(0, 50))
                  
                  const chunkData = {
                    object: 'chat.message.delta',
                    delta: {
                      content: textPart,
                      experimental_content: [
                        {
                          type: 'text',
                          text: textPart
                        }
                      ]
                    }
                  }
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                }

                console.log('✅ Claude stream completed')
                console.log('📊 Total chunks:', chunkCount)
                console.log('📊 Total text:', fullText.length, 'chars')

                // Send completion message
                const finalData = {
                  object: 'chat.message.completed',
                  message: {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: fullText,
                    experimental_content: [
                      {
                        type: 'text',
                        text: fullText
                      }
                    ]
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`))
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
              } catch (error) {
                console.error('❌ Claude stream error:', error)
                controller.error(error)
              }
            }
          })

          return new Response(customStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          })
        }

        // Non-streaming mode with AI SDK
        const result = await streamText({
          model: anthropicProvider('claude-sonnet-4-20250514'),
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.7,
        })

        const fullText = await result.text

        // Create a mock chat response that matches v0's structure
        const mockChat = {
          id: `claude-${Date.now()}`,
          demo: `https://dev.ajstudioz.co.in/preview/${Date.now()}`,
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: 'user' as const,
              content: message,
              timestamp: new Date().toISOString(),
            },
            {
              id: `msg-${Date.now() + 1}`,
              role: 'assistant' as const,
              content: fullText,
              timestamp: new Date().toISOString(),
              experimental_content: [
                {
                  type: 'text',
                  text: fullText,
                }
              ]
            }
          ]
        }

        // Log usage for rate limiting
        if (!chatId) {
          if (session?.user?.id) {
            await createChatOwnership({
              v0ChatId: mockChat.id,
              userId: session.user.id,
            })
          } else {
            const clientIP = getClientIP(request)
            await createAnonymousChatLog({
              ipAddress: clientIP,
              v0ChatId: mockChat.id,
            })
          }
        }

        return NextResponse.json(mockChat)
      } catch (error: any) {
        console.error('Claude API Error:', error)
        console.error('Error details:', {
          message: error?.message,
          status: error?.status,
          code: error?.code,
          type: error?.type
        })
        
        // Provide user-friendly error message
        let userErrorMessage = 'Claude API temporarily unavailable.'
        if (error?.message?.includes('credit balance')) {
          userErrorMessage = 'Claude: Credit balance too low. Switching to v0...'
        } else if (error?.status === 429) {
          userErrorMessage = 'Claude: Rate limit reached. Switching to v0...'
        }
        
        // Check for quota/credit issues including credit balance errors
        const isQuotaError = error?.status === 429 ||
                            error?.status === 400 ||
                            (error?.message?.toLowerCase().includes('rate_limit')) ||
                            (error?.message?.toLowerCase().includes('quota')) ||
                            (error?.message?.toLowerCase().includes('credit balance')) ||
                            (error?.message?.toLowerCase().includes('billing'))
        
        if (isQuotaError) {
          // Only send email and switch if it's a REAL quota/rate limit error
          console.log('Detected quota/rate limit error for Claude')
          await sendQuotaExhaustedEmail('claude', error?.message || 'Unknown error').catch(err => {
            console.error('Failed to send Claude error email:', err)
          })
          
          const nextProvider = await tryAlternativeProvider('claude', error?.message || 'Unknown error', attemptedProviders)
          console.log(`Claude quota exceeded, retrying with ${nextProvider}`)
          // Create new request with updated provider and pass attempted providers in header
          const bodyWithNewProvider = { ...body, provider: nextProvider, _attemptedProviders: Array.from(attemptedProviders) }
          const newRequest = new NextRequest(request.url, {
            method: 'POST',
            headers: request.headers,
            body: JSON.stringify(bodyWithNewProvider),
          })
          return POST(newRequest)
        }
        
        // For non-quota errors, just log and return error (don't switch providers)
        console.error('Claude API non-quota error, not switching providers')
        return NextResponse.json(
          { error: userErrorMessage || `Failed to process request with Claude API: ${error?.message || 'Unknown error'}` },
          { status: 500 },
        )
      }
    }

    // Handle Grok (xAI) API requests
    if (effectiveProvider === 'grok') {
      console.log('🟢 Using Grok (xAI) API for message:', message)

      if (!process.env.XAI_API_KEY) {
        return NextResponse.json(
          { error: 'Grok API key (XAI_API_KEY) not configured' },
          { status: 500 },
        )
      }

      try {
        const grokProvider = createXai({
          apiKey: process.env.XAI_API_KEY,
        })
        
        const systemPrompt = `You are Grok, an AI assistant created by xAI (Elon Musk's company). You are an expert React developer with deep knowledge of modern web technologies.

Your responsibilities:
1. Generate clean, production-ready React components using TypeScript and Tailwind CSS
2. Follow React best practices and modern patterns (hooks, composition, etc.)
3. Write semantic, accessible HTML
4. Include proper error handling and loading states
5. Add helpful comments for complex logic

When asked about your identity, always identify yourself as Grok (made by xAI), not v0 or any other AI.

Respond conversationally for questions, but provide complete, working code for component requests.`

        console.log('Calling Grok API with model: grok-beta')

        // Always return complete response (streaming format incompatible with v0-sdk)
        if (false) {
          // Streaming disabled for Grok
          const result = await streamText({
            model: grokProvider('grok-4-fast-non-reasoning'),
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: message,
              },
            ],
            temperature: 1.0,
            topP: 1,
          })

          console.log('� Grok stream initiated')

          // Convert AI SDK stream to v0-compatible format
          const encoder = new TextEncoder()
          let fullText = ''
          
          const customStream = new ReadableStream({
            async start(controller) {
              try {
                // Send initial metadata
                const chatId = `grok-${Date.now()}`
                const initialData = {
                  object: 'chat',
                  id: chatId,
                  demo: null,
                  url: null,
                  messages: [],
                  provider: 'grok'
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`))
                console.log('� Sent Grok initial metadata')

                // Stream text chunks
                let chunkCount = 0
                for await (const textPart of result.textStream) {
                  fullText += textPart
                  chunkCount++
                  
                  console.log(`📝 Grok chunk #${chunkCount}:`, textPart.substring(0, 50))
                  
                  const chunkData = {
                    object: 'chat.message.delta',
                    delta: {
                      content: textPart,
                      experimental_content: [
                        {
                          type: 'text',
                          text: textPart
                        }
                      ]
                    }
                  }
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                }

                console.log('✅ Grok stream completed')
                console.log('📊 Total chunks:', chunkCount)
                console.log('📊 Total text:', fullText.length, 'chars')

                // Send completion message
                const finalData = {
                  object: 'chat.message.completed',
                  message: {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: fullText,
                    experimental_content: [
                      {
                        type: 'text',
                        text: fullText
                      }
                    ]
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`))
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
              } catch (error) {
                console.error('❌ Grok stream error:', error)
                controller.error(error)
              }
            }
          })

          return new Response(customStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          })
        }

        // Non-streaming mode with AI SDK - updated to use grok-4-fast-non-reasoning
        const result = await streamText({
          model: grokProvider('grok-4-fast-non-reasoning'),
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 1.0,
          topP: 1,
        })

        const fullText = await result.text

        // Create a mock chat response that matches v0's structure
        const mockChat = {
          id: `grok-${Date.now()}`,
          demo: `https://dev.ajstudioz.co.in/preview/${Date.now()}`,
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: 'user' as const,
              content: message,
              timestamp: new Date().toISOString(),
            },
            {
              id: `msg-${Date.now() + 1}`,
              role: 'assistant' as const,
              content: fullText,
              timestamp: new Date().toISOString(),
              experimental_content: [
                {
                  type: 'text',
                  text: fullText,
                },
              ],
            },
          ],
        }

        // Log usage for rate limiting
        if (!chatId) {
          if (session?.user?.id) {
            await createChatOwnership({
              v0ChatId: mockChat.id,
              userId: session.user.id,
            })
          } else {
            const clientIP = getClientIP(request)
            await createAnonymousChatLog({
              ipAddress: clientIP,
              v0ChatId: mockChat.id,
            })
          }
        }

        return NextResponse.json(mockChat)
      } catch (error: any) {
        console.error('Grok API Error:', error)
        
        // Provide user-friendly error message
        let userErrorMessage = 'Grok API temporarily unavailable.'
        if (error?.message?.includes('spending limit')) {
          userErrorMessage = 'Grok: Monthly spending limit reached. Switching to v0...'
        } else if (error?.message?.includes('credits')) {
          userErrorMessage = 'Grok: Credits exhausted. Switching to v0...'
        } else if (error?.status === 429) {
          userErrorMessage = 'Grok: Rate limit reached. Switching to v0...'
        }
        console.log('User error message:', userErrorMessage)
        
        // Check if this is a quota/rate limit error
        const isQuotaError = error?.message?.toLowerCase().includes('quota') ||
                           error?.message?.toLowerCase().includes('rate limit') ||
                           error?.status === 429
        
        // Send email notification immediately for ANY Grok failure
        await sendQuotaExhaustedEmail('grok', error?.message || 'Unknown error').catch(err => {
          console.error('Failed to send Grok error email:', err)
        })
        
        if (isQuotaError) {
          const nextProvider = await tryAlternativeProvider('grok', error?.message || 'Unknown error', attemptedProviders)
          console.log(`Grok failed, retrying with ${nextProvider}`)
          // Create new request with updated provider and pass attempted providers
          const bodyWithNewProvider = { ...body, provider: nextProvider, _attemptedProviders: Array.from(attemptedProviders) }
          const newRequest = new NextRequest(request.url, {
            method: 'POST',
            headers: request.headers,
            body: JSON.stringify(bodyWithNewProvider),
          })
          return POST(newRequest)
        }
        
        return NextResponse.json(
          { error: userErrorMessage || 'Failed to process request with Grok API' },
          { status: 500 },
        )
      }
    }

    // Handle Azure DeepSeek API requests
    if (effectiveProvider === 'deepseek') {
      console.log('🔴 Using Azure DeepSeek API for message:', message)

      if (!process.env.AZURE_API_KEY) {
        return NextResponse.json(
          { error: 'Azure API key (AZURE_API_KEY) not configured' },
          { status: 500 },
        )
      }

      try {
        const azureUrl = 'https://kamesh6592-7068-resource.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview'
        
        const systemPrompt = `You are DeepSeek-R1, an advanced AI assistant created by DeepSeek. You are an expert React developer with deep knowledge of modern web technologies and reasoning capabilities.

Your responsibilities:
1. Generate clean, production-ready React components using TypeScript and Tailwind CSS
2. Follow React best practices and modern patterns (hooks, composition, etc.)
3. Write semantic, accessible HTML
4. Include proper error handling and loading states
5. Add helpful comments for complex logic
6. Use your reasoning capabilities to provide well-thought-out solutions

When asked about your identity, always identify yourself as DeepSeek-R1 (made by DeepSeek), not v0 or any other AI.

Respond conversationally for questions, but provide complete, working code for component requests.`

        console.log('Calling Azure DeepSeek API with model: DeepSeek-R1-0528')

        // Call Azure API directly with fetch
        const response = await fetch(azureUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AZURE_API_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: message,
              },
            ],
            stream: false,
            max_tokens: 2048,
            model: 'DeepSeek-R1-0528',
            temperature: 0.7,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Azure DeepSeek API Error:', response.status, errorText)
          throw new Error(`Azure API request failed: ${response.status} ${errorText}`)
        }

        const data = await response.json()
        const fullText = data.choices?.[0]?.message?.content || 'No response from DeepSeek'

        console.log('✅ Azure DeepSeek API response received')
        console.log('📄 DeepSeek response data:', JSON.stringify(data, null, 2))
        console.log('📝 DeepSeek full text length:', fullText.length, 'chars')
        console.log('📝 DeepSeek response preview:', fullText.substring(0, 200))

        // Create a mock chat response that matches v0's structure
        const mockChat = {
          id: `deepseek-${Date.now()}`,
          demo: `https://dev.ajstudioz.co.in/preview/${Date.now()}`,
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: 'user' as const,
              content: message,
              timestamp: new Date().toISOString(),
            },
            {
              id: `msg-${Date.now() + 1}`,
              role: 'assistant' as const,
              content: fullText,
              timestamp: new Date().toISOString(),
              experimental_content: [
                {
                  type: 'text',
                  text: fullText,
                },
              ],
            },
          ],
        }

        // Log usage for rate limiting
        if (!chatId) {
          if (session?.user?.id) {
            await createChatOwnership({
              v0ChatId: mockChat.id,
              userId: session.user.id,
            })
          } else {
            const clientIP = getClientIP(request)
            await createAnonymousChatLog({
              ipAddress: clientIP,
              v0ChatId: mockChat.id,
            })
          }
        }

        // Handle streaming vs non-streaming response
        if (streaming) {
          // Convert to streaming format for compatibility
          const encoder = new TextEncoder()
          const customStream = new ReadableStream({
            async start(controller) {
              try {
                // Send initial metadata
                const initialData = {
                  object: 'chat',
                  id: mockChat.id,
                  demo: mockChat.demo,
                  url: null,
                  messages: [],
                  provider: 'deepseek'
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`))

                // Send the complete response as a single chunk
                const chunkData = {
                  object: 'chat.message.delta',
                  delta: {
                    content: fullText,
                    experimental_content: [
                      {
                        type: 'text',
                        text: fullText
                      }
                    ]
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`))

                // Send completion message
                const finalData = {
                  object: 'chat.message.completed',
                  message: {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: fullText,
                    experimental_content: [
                      {
                        type: 'text',
                        text: fullText
                      }
                    ]
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`))
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
              } catch (error) {
                console.error('❌ DeepSeek stream error:', error)
                controller.error(error)
              }
            }
          })

          return new Response(customStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          })
        }

        return NextResponse.json(mockChat)
      } catch (error: any) {
        console.error('Azure DeepSeek API Error:', error)
        
        // Provide user-friendly error message
        let userErrorMessage = 'DeepSeek API temporarily unavailable.'
        if (error?.status === 401 || error?.message?.includes('api key')) {
          userErrorMessage = 'DeepSeek: API key invalid. Switching to v0...'
        } else if (error?.status === 403) {
          userErrorMessage = 'DeepSeek: Access forbidden. Switching to v0...'
        } else if (error?.status === 429) {
          userErrorMessage = 'DeepSeek: Rate limit reached. Switching to v0...'
        }
        console.log('User error message:', userErrorMessage)
        
        // Check if this is a quota/rate limit error
        const isQuotaError = error?.message?.toLowerCase().includes('quota') ||
                           error?.message?.toLowerCase().includes('rate limit') ||
                           error?.status === 429
        
        // Send email notification for DeepSeek failures
        await sendQuotaExhaustedEmail('deepseek', error?.message || 'Unknown error').catch(err => {
          console.error('Failed to send DeepSeek error email:', err)
        })
        
        if (isQuotaError) {
          const nextProvider = await tryAlternativeProvider('deepseek', error?.message || 'Unknown error', attemptedProviders)
          console.log(`DeepSeek failed, retrying with ${nextProvider}`)
          // Create new request with updated provider and pass attempted providers
          const bodyWithNewProvider = { ...body, provider: nextProvider, _attemptedProviders: Array.from(attemptedProviders) }
          const newRequest = new NextRequest(request.url, {
            method: 'POST',
            headers: request.headers,
            body: JSON.stringify(bodyWithNewProvider),
          })
          return POST(newRequest)
        }
        
        return NextResponse.json(
          { error: userErrorMessage || 'Failed to process request with Azure DeepSeek API' },
          { status: 500 },
        )
      }
    }

    // Handle v0 API requests (existing logic)

    if (chatId) {
      // continue existing chat
      try {
        if (streaming) {
          // Return streaming response for existing chat
          console.log('Sending streaming message to existing chat:', {
            chatId,
            message,
            responseMode: 'experimental_stream',
          })
          chat = await v0.chats.sendMessage({
            chatId: chatId,
            message,
            responseMode: 'experimental_stream',
            ...(attachments && attachments.length > 0 && { attachments }),
          })
          console.log('Streaming message sent to existing chat successfully')

          // Wrap stream to inject provider info
          const wrappedStream = wrapV0StreamWithProvider(chat as ReadableStream<Uint8Array>, 'v0')
          return new Response(wrappedStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          })
        } else {
          // Non-streaming response for existing chat
          chat = await v0.chats.sendMessage({
            chatId: chatId,
            message,
            ...(attachments && attachments.length > 0 && { attachments }),
          })
        }
      } catch (chatError: any) {
        // If chat doesn't exist or has error, check if we should switch providers
        console.error('Failed to send message to existing chat:', chatError.message)
        
        const shouldSwitchProvider = 
          chatError?.message?.toLowerCase().includes('quota') ||
          chatError?.message?.toLowerCase().includes('rate limit') ||
          chatError?.message?.toLowerCase().includes('internal_server_error') ||
          chatError?.message?.toLowerCase().includes('unexpected error') ||
          chatError?.message?.includes('HTTP 500') ||
          chatError?.message?.includes('HTTP 502') ||
          chatError?.message?.includes('HTTP 503') ||
          chatError?.status === 429 ||
          chatError?.status === 500 ||
          chatError?.status === 502 ||
          chatError?.status === 503
        
        if (shouldSwitchProvider) {
          console.log('Switching to alternative provider due to error')
          throw chatError // Throw to outer catch for provider switching
        }
        
        // Otherwise, try creating a new chat
        console.warn('Creating new chat as fallback')
        
        if (streaming) {
          console.log('Creating new streaming chat after error:', {
            message,
            responseMode: 'experimental_stream',
          })
          chat = await v0.chats.create({
            message,
            responseMode: 'experimental_stream',
            ...(attachments && attachments.length > 0 && { attachments }),
          })
          
          // Wrap stream to inject provider info
          const wrappedStream = wrapV0StreamWithProvider(chat as ReadableStream<Uint8Array>, 'v0')
          return new Response(wrappedStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          })
        } else {
          chat = await v0.chats.create({
            message,
            responseMode: 'sync',
            ...(attachments && attachments.length > 0 && { attachments }),
          })
        }
      }
    } else {
      // create new chat
      if (streaming) {
        // Return streaming response
        console.log('Creating streaming chat with params:', {
          message,
          responseMode: 'experimental_stream',
        })
        chat = await v0.chats.create({
          message,
          responseMode: 'experimental_stream',
          ...(attachments && attachments.length > 0 && { attachments }),
        })
        console.log('Streaming chat created successfully')

        // Wrap stream to inject provider info
        const wrappedStream = wrapV0StreamWithProvider(chat as ReadableStream<Uint8Array>, 'v0')
        return new Response(wrappedStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      } else {
        // Use sync mode
        console.log('Creating sync chat with params:', {
          message,
          responseMode: 'sync',
        })
        chat = await v0.chats.create({
          message,
          responseMode: 'sync',
          ...(attachments && attachments.length > 0 && { attachments }),
        })
        console.log('Sync chat created successfully')
      }
    }

    // Type guard to ensure we have a ChatDetail and not a stream
    if (chat instanceof ReadableStream) {
      throw new Error('Unexpected streaming response')
    }

    const chatDetail = chat as ChatDetail

    // Create ownership mapping or anonymous log for new chat
    if (!chatId && chatDetail.id) {
      try {
        if (session?.user?.id) {
          // Authenticated user - create ownership mapping
          await createChatOwnership({
            v0ChatId: chatDetail.id,
            userId: session.user.id,
          })
          console.log('Chat ownership created:', chatDetail.id)
        } else {
          // Anonymous user - log for rate limiting
          const clientIP = getClientIP(request)
          await createAnonymousChatLog({
            ipAddress: clientIP,
            v0ChatId: chatDetail.id,
          })
          console.log('Anonymous chat logged:', chatDetail.id, 'IP:', clientIP)
        }
      } catch (error) {
        console.error('Failed to create chat ownership/log:', error)
        // Don't fail the request if database save fails
      }
    }

    return NextResponse.json({
      id: chatDetail.id,
      demo: replacePreviewDomain(chatDetail.demo),
      messages: chatDetail.messages?.map((msg) => ({
        ...msg,
        experimental_content: (msg as any).experimental_content,
      })),
    })
  } catch (error: any) {
    console.error('V0 API Error:', error)

    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    // Send email notification immediately for ANY v0 failure
    await sendQuotaExhaustedEmail('v0', error?.message || 'Unknown error').catch(err => {
      console.error('Failed to send v0 error email:', err)
    })

    // Check if this is an error we should retry with another provider
    const shouldRetry = 
      error?.message?.toLowerCase().includes('quota') ||
      error?.message?.toLowerCase().includes('rate limit') ||
      error?.message?.toLowerCase().includes('internal_server_error') ||
      error?.message?.toLowerCase().includes('unexpected error') ||
      error?.message?.includes('HTTP 500') ||
      error?.message?.includes('HTTP 502') ||
      error?.message?.includes('HTTP 503') ||
      error?.status === 429 ||
      error?.status === 500 ||
      error?.status === 502 ||
      error?.status === 503
    
    if (shouldRetry && body?.provider) {
      console.log(`Error with ${body.provider}, attempting to use alternative provider`)
      try {
        const nextProvider = await tryAlternativeProvider(body.provider, error?.message || 'Unknown error', attemptedProviders)
        console.log(`v0 failed, switching to ${nextProvider} provider`)
        
        // Create new request with updated provider and pass attempted providers
        const bodyWithNewProvider = { ...body, provider: nextProvider, _attemptedProviders: Array.from(attemptedProviders) }
        const newRequest = new NextRequest(request.url, {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify(bodyWithNewProvider),
        })
        return POST(newRequest)
      } catch (providerError) {
        console.error('All providers exhausted:', providerError)
        return NextResponse.json(
          {
            error: 'All AI providers are currently unavailable. Please try again later.',
          },
          { status: 503 },
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

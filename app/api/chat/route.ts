import { NextRequest, NextResponse } from 'next/server'
import { createClient, ChatDetail } from 'v0-sdk'
import Anthropic from '@anthropic-ai/sdk'
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
  // Replace any vusercontent.net domain with custom domain
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
  
  // Define fallback order: v0 → claude → grok
  const providerOrder = ['v0', 'claude', 'grok']
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

    let chat

    // Handle Claude API requests
    if (provider === 'claude') {
      console.log('Using Claude API for message:', message)
      
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json(
          { error: 'Claude API key not configured' },
          { status: 500 },
        )
      }

      try {
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        })
        
        const systemPrompt = `You are Claude, an AI assistant created by Anthropic. You are an expert React developer. Generate React components and applications based on user requests. Focus on creating clean, modern, and functional code using React best practices, TypeScript, and Tailwind CSS.

When asked about your identity, always identify yourself as Claude (made by Anthropic), not v0 or any other AI.`

        // Use native Anthropic SDK for streaming
        console.log('Calling Claude API with model: claude-sonnet-4-20250514')

        if (streaming) {
          // Create a custom stream that wraps Claude's text in v0's format
          const encoder = new TextEncoder()
          const customStream = new ReadableStream({
            async start(controller) {
              try {
                // Send initial chat metadata with provider info
                const chatId = `claude-${Date.now()}`
                const initialData = {
                  object: 'chat',
                  id: chatId,
                  demo: null,
                  messages: [],
                  provider: 'claude'
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`))

                // Create Claude stream
                const stream = await anthropic.messages.stream({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 4096,
                  temperature: 0.7,
                  system: systemPrompt,
                  messages: [
                    {
                      role: 'user',
                      content: message,
                    },
                  ],
                })

                // Stream the text content
                let accumulatedText = ''
                for await (const event of stream) {
                  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    const textPart = event.delta.text
                    accumulatedText += textPart
                    const chunkData = {
                      object: 'chat.message.delta',
                      delta: {
                        content: textPart
                      }
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                  }
                }

                console.log('Claude stream completed with text length:', accumulatedText.length)

                // Send final message
                const finalData = {
                  object: 'chat.message.completed',
                  message: {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: accumulatedText,
                    experimental_content: [
                      {
                        type: 'text',
                        text: accumulatedText
                      }
                    ]
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`))
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
              } catch (error) {
                console.error('Claude stream error:', error)
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

        // Collect the full response for non-streaming mode
        const messageResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        })

        const fullText = messageResponse.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('')

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
        
        // Only check for ACTUAL quota/rate limit errors (429 status code)
        // Since Claude API is unlimited, don't treat connection errors as quota issues
        const isQuotaError = error?.status === 429 ||
                            (error?.message?.toLowerCase().includes('rate_limit') && error?.status === 429) ||
                            (error?.message?.toLowerCase().includes('quota') && error?.status === 429)
        
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
          { error: `Failed to process request with Claude API: ${error?.message || 'Unknown error'}` },
          { status: 500 },
        )
      }
    }

    // Handle Grok (xAI) API requests
    if (provider === 'grok') {
      console.log('Using Grok (xAI) API for message:', message)

      if (!process.env.XAI_API_KEY) {
        return NextResponse.json(
          { error: 'Grok API key (XAI_API_KEY) not configured' },
          { status: 500 },
        )
      }

      try {
        const systemPrompt = `You are Grok, an AI assistant created by xAI (Elon Musk's company). You are an expert React developer. Generate React components and applications based on user requests. Focus on creating clean, modern, and functional code using React best practices, TypeScript, and Tailwind CSS.

When asked about your identity, always identify yourself as Grok (made by xAI), not v0 or any other AI.`

        // Use native xAI API with fetch for streaming
        console.log('Calling Grok API with model: grok-beta')

        if (streaming) {
          // Create a custom stream that wraps Grok's text in v0's format
          const encoder = new TextEncoder()
          const customStream = new ReadableStream({
            async start(controller) {
              try {
                // Send initial chat metadata with provider info
                const chatId = `grok-${Date.now()}`
                const initialData = {
                  object: 'chat',
                  id: chatId,
                  demo: null,
                  messages: [],
                  provider: 'grok'
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`))

                // Call xAI API directly
                const response = await fetch('https://api.x.ai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: 'grok-beta',
                    messages: [
                      { role: 'system', content: systemPrompt },
                      { role: 'user', content: message },
                    ],
                    temperature: 0.7,
                    stream: true,
                  }),
                })

                if (!response.ok) {
                  throw new Error(`xAI API error: ${response.status} ${response.statusText}`)
                }

                // Parse SSE stream
                const reader = response.body?.getReader()
                if (!reader) throw new Error('No response body')

                const decoder = new TextDecoder()
                let accumulatedText = ''

                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break

                  const chunk = decoder.decode(value, { stream: true })
                  const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '))

                  for (const line of lines) {
                    const data = line.replace('data: ', '').trim()
                    if (data === '[DONE]') continue
                    
                    try {
                      const parsed = JSON.parse(data)
                      const content = parsed.choices?.[0]?.delta?.content
                      if (content) {
                        accumulatedText += content
                        const chunkData = {
                          object: 'chat.message.delta',
                          delta: {
                            content: content
                          }
                        }
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  }
                }

                console.log('Grok stream completed with text length:', accumulatedText.length)

                // Send final message
                const finalData = {
                  object: 'chat.message.completed',
                  message: {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: accumulatedText,
                    experimental_content: [
                      {
                        type: 'text',
                        text: accumulatedText
                      }
                    ]
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`))
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
              } catch (error) {
                console.error('Grok stream error:', error)
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

        // Non-streaming mode
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            temperature: 0.7,
            stream: false,
          }),
        })

        if (!response.ok) {
          throw new Error(`xAI API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const fullText = data.choices?.[0]?.message?.content || ''

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
          { error: 'Failed to process request with Grok API' },
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

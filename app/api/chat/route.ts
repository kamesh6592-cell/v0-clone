import { NextRequest, NextResponse } from 'next/server'
import { createClient, ChatDetail } from 'v0-sdk'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { streamText } from 'ai'
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { message, chatId, streaming, attachments, projectId, provider = 'v0' } =
      await request.json()

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
        const anthropicProvider = createAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        })
        
        const systemPrompt = `You are an expert React developer. Generate React components and applications based on user requests. Focus on creating clean, modern, and functional code using React best practices, TypeScript, and Tailwind CSS.`

        // Use AI SDK for streaming
        const result = await streamText({
          model: anthropicProvider('claude-sonnet-4-5-20250929'),
          prompt: `${systemPrompt}\n\nUser request: ${message}`,
          temperature: 0.7,
        })

        // Collect the full response for non-streaming mode
        let fullText = ''
        for await (const textPart of result.textStream) {
          fullText += textPart
        }

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
      } catch (error) {
        console.error('Claude API Error:', error)
        return NextResponse.json(
          { error: 'Failed to process request with Claude API' },
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
        const xaiProvider = createXai({
          apiKey: process.env.XAI_API_KEY,
        })
        
        const systemPrompt = `You are an expert React developer. Generate React components and applications based on user requests. Focus on creating clean, modern, and functional code using React best practices, TypeScript, and Tailwind CSS.`

        // Use AI SDK with xAI for streaming
        const result = await streamText({
          model: xaiProvider('grok-4-fast-reasoning'),
          prompt: `${systemPrompt}\n\nUser request: ${message}`,
          temperature: 0.7,
        })

        // Collect the full response for non-streaming mode
        let fullText = ''
        for await (const textPart of result.textStream) {
          fullText += textPart
        }

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
      } catch (error) {
        console.error('Grok API Error:', error)
        return NextResponse.json(
          { error: 'Failed to process request with Grok API' },
          { status: 500 },
        )
      }
    }

    // Handle v0 API requests (existing logic)

    if (chatId) {
      // continue existing chat
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

        // Return the stream directly
        return new Response(chat as ReadableStream<Uint8Array>, {
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

        // Return the stream directly
        return new Response(chat as ReadableStream<Uint8Array>, {
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
  } catch (error) {
    console.error('V0 API Error:', error)

    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
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

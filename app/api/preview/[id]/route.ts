import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Extract the original vusercontent URL from the chat ID
    // The ID should be something like "demo-kzmm5r7w08bcjq8epb91"
    const originalUrl = `https://demo-${id}.vusercontent.net`

    // Fetch the content from the original URL
    const response = await fetch(originalUrl, {
      headers: {
        // Forward important headers
        'User-Agent': request.headers.get('user-agent') || 'AJ STUDIOZ Preview',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Preview not found' },
        { status: response.status }
      )
    }

    // Get the content
    const html = await response.text()

    // Return the HTML with proper headers
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Preview proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to load preview' },
      { status: 500 }
    )
  }
}

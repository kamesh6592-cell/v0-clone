import { NextRequest, NextResponse } from 'next/server';
import { sendQuotaExhaustedEmail, sendAllProvidersDownEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'quota';

  try {
    let result: any;

    if (type === 'quota') {
      // Test quota exhausted email
      result = await sendQuotaExhaustedEmail(
        'v0',
        'This is a test email to verify the notification system is working correctly.'
      );
    } else if (type === 'alldown') {
      // Test all providers down email
      result = await sendAllProvidersDownEmail();
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type. Use ?type=quota or ?type=alldown'
        },
        { status: 400 }
      );
    }

    // Normalize missing helper return
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Email helper did not return a result. Check RESEND_API_KEY in .env.local',
        providerUsed: 'none'
      }, { status: 500 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to kamesh6592@gmail.com`,
        emailId: result.id ?? null,
        type: type,
        providerUsed: result.provider ?? 'unknown'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error ?? 'Unknown error from email provider',
        providerUsed: result.provider ?? 'unknown'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send test email',
      details: error.toString(),
      providerUsed: 'unknown'
    }, { status: 500 });
  }
}

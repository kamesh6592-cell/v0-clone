import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

type EmailResult = {
  success: boolean
  id?: string | null
  error?: string
  provider: 'resend' | 'none'
}

export async function sendQuotaExhaustedEmail(
  provider: string,
  errorMessage: string,
): Promise<EmailResult> {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email notification')
    return { success: false, error: 'Resend API key not configured', provider: 'none' }
  }

  try {
    const res: any = await resend.emails.send({
      from: 'AJ STUDIOZ <noreply@ajstudioz.co.in>',
      to: 'kamesh6592@gmail.com',
      subject: `⚠️ ${provider.toUpperCase()} API Quota Exhausted`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">API Quota Alert</h2>
          <p>The <strong>${provider}</strong> API provider has exhausted its quota.</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #7f1d1d;"><strong>Error:</strong></p>
            <p style="margin: 8px 0 0 0; color: #991b1b;">${errorMessage}</p>
          </div>
          
          <p><strong>Action Required:</strong></p>
          <ul>
            <li>Check your ${provider} account dashboard</li>
            <li>Verify billing and quota limits</li>
            <li>Consider upgrading your plan if needed</li>
            <li>The system has automatically switched to an alternative provider</li>
          </ul>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            This is an automated notification from AJ STUDIOZ v0-clone.
            <br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    })

    const id = res?.id ?? res?.messageId ?? null
    console.log(`Quota exhausted email sent for ${provider}, id=${id}`)
    return { success: true, id, provider: 'resend' }
  } catch (error: any) {
    console.error('Failed to send quota exhausted email:', error)
    return { success: false, error: error?.message ?? String(error), provider: 'resend' }
  }
}

export async function sendAllProvidersDownEmail(): Promise<EmailResult> {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email notification')
    return { success: false, error: 'Resend API key not configured', provider: 'none' }
  }

  try {
    const res: any = await resend.emails.send({
      from: 'AJ STUDIOZ <noreply@ajstudioz.co.in>',
      to: 'kamesh6592@gmail.com',
      subject: '🚨 URGENT: All AI Providers Are Down',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Critical Alert: All Providers Down</h2>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #7f1d1d;"><strong>Status:</strong> All AI providers (v0, Claude, Grok) are currently unavailable</p>
          </div>
          
          <p><strong>Immediate Action Required:</strong></p>
          <ul>
            <li>Check v0.dev service status</li>
            <li>Check Claude API status (console.anthropic.com)</li>
            <li>Check Grok/xAI API status</li>
            <li>Verify API keys are valid</li>
            <li>Check for quota exhaustion on all providers</li>
          </ul>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            This is an automated critical notification from AJ STUDIOZ v0-clone.
            <br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    })

    const id = res?.id ?? res?.messageId ?? null
    console.log(`All providers down email sent, id=${id}`)
    return { success: true, id, provider: 'resend' }
  } catch (error: any) {
    console.error('Failed to send all providers down email:', error)
    return { success: false, error: error?.message ?? String(error), provider: 'resend' }
  }
}

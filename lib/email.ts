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

interface UserAuthDetails {
  email: string
  name?: string
  ipAddress?: string
  authProvider?: string
  userAgent?: string
  timestamp?: Date
}

export async function sendUserRegistrationEmail(
  userDetails: UserAuthDetails
): Promise<EmailResult> {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email notification')
    return { success: false, error: 'Resend API key not configured', provider: 'none' }
  }

  try {
    // Send notification to admin
    const adminRes: any = await resend.emails.send({
      from: 'AJ STUDIOZ <noreply@ajstudioz.co.in>',
      to: 'kamesh6592@gmail.com',
      subject: '✅ New User Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">New User Registered</h2>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #14532d;"><strong>User Details:</strong></p>
            <table style="margin-top: 12px; width: 100%;">
              <tr>
                <td style="padding: 4px 0; color: #15803d; font-weight: 600;">Email:</td>
                <td style="padding: 4px 0; color: #166534;">${userDetails.email}</td>
              </tr>
              ${userDetails.name ? `
              <tr>
                <td style="padding: 4px 0; color: #15803d; font-weight: 600;">Name:</td>
                <td style="padding: 4px 0; color: #166534;">${userDetails.name}</td>
              </tr>
              ` : ''}
              ${userDetails.ipAddress ? `
              <tr>
                <td style="padding: 4px 0; color: #15803d; font-weight: 600;">IP Address:</td>
                <td style="padding: 4px 0; color: #166534;">${userDetails.ipAddress}</td>
              </tr>
              ` : ''}
              ${userDetails.authProvider ? `
              <tr>
                <td style="padding: 4px 0; color: #15803d; font-weight: 600;">Auth Provider:</td>
                <td style="padding: 4px 0; color: #166534;">${userDetails.authProvider}</td>
              </tr>
              ` : ''}
              ${userDetails.userAgent ? `
              <tr>
                <td style="padding: 4px 0; color: #15803d; font-weight: 600;">User Agent:</td>
                <td style="padding: 4px 0; color: #166534; font-size: 12px;">${userDetails.userAgent}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 4px 0; color: #15803d; font-weight: 600;">Time:</td>
                <td style="padding: 4px 0; color: #166534;">${(userDetails.timestamp || new Date()).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            This is an automated notification from AJ STUDIOZ v0-clone.
          </p>
        </div>
      `,
    })

    // Send congratulations email to the new user
    const userRes: any = await resend.emails.send({
      from: 'AJ STUDIOZ <noreply@ajstudioz.co.in>',
      to: userDetails.email,
      subject: '🎉 Welcome to AJ STUDIOZ - Registration Successful!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #16a34a; margin: 0;">🎉 Congratulations!</h1>
          </div>
          
          <p style="color: #374151; font-size: 18px; font-weight: 600;">
            Welcome to AJ STUDIOZ v0-clone!
          </p>
          
          <p style="color: #374151; font-size: 16px;">
            Hi${userDetails.name ? ` ${userDetails.name}` : ''},
          </p>
          
          <p style="color: #374151; font-size: 16px;">
            Your account has been successfully created! We're excited to have you join our community of developers using AI-powered tools to build amazing React applications.
          </p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
            <h3 style="color: #15803d; margin-top: 0;">What's Next?</h3>
            <ul style="color: #166534; padding-left: 20px;">
              <li>Start creating React components with AI assistance</li>
              <li>Choose between v0, Claude, or Grok AI models</li>
              <li>Save and manage your chat history</li>
              <li>Export your generated code instantly</li>
            </ul>
          </div>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1e3a8a;">
              <strong>Registration Time:</strong> ${(userDetails.timestamp || new Date()).toLocaleString()}
            </p>
            <p style="margin: 8px 0 0 0; color: #1e3a8a;">
              <strong>Your Email:</strong> ${userDetails.email}
            </p>
          </div>
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="https://dev.ajstudioz.co.in" style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
              Start Building Now →
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            Need help? Feel free to reach out to our support team anytime.
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            Happy coding!<br>
            <strong>The AJ STUDIOZ Team</strong>
          </p>
        </div>
      `,
    })

    const id = adminRes?.id ?? adminRes?.messageId ?? null
    console.log(`User registration emails sent for ${userDetails.email}, id=${id}`)
    return { success: true, id, provider: 'resend' }
  } catch (error: any) {
    console.error('Failed to send user registration email:', error)
    return { success: false, error: error?.message ?? String(error), provider: 'resend' }
  }
}

export async function sendUserLoginEmail(
  userDetails: UserAuthDetails
): Promise<EmailResult> {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email notification')
    return { success: false, error: 'Resend API key not configured', provider: 'none' }
  }

  try {
    // Send notification to admin
    const adminRes: any = await resend.emails.send({
      from: 'AJ STUDIOZ <noreply@ajstudioz.co.in>',
      to: 'kamesh6592@gmail.com',
      subject: '🔐 User Login Activity',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">User Login Detected</h2>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1e3a8a;"><strong>Login Details:</strong></p>
            <table style="margin-top: 12px; width: 100%;">
              <tr>
                <td style="padding: 4px 0; color: #1d4ed8; font-weight: 600;">Email:</td>
                <td style="padding: 4px 0; color: #1e40af;">${userDetails.email}</td>
              </tr>
              ${userDetails.name ? `
              <tr>
                <td style="padding: 4px 0; color: #1d4ed8; font-weight: 600;">Name:</td>
                <td style="padding: 4px 0; color: #1e40af;">${userDetails.name}</td>
              </tr>
              ` : ''}
              ${userDetails.ipAddress ? `
              <tr>
                <td style="padding: 4px 0; color: #1d4ed8; font-weight: 600;">IP Address:</td>
                <td style="padding: 4px 0; color: #1e40af;">${userDetails.ipAddress}</td>
              </tr>
              ` : ''}
              ${userDetails.authProvider ? `
              <tr>
                <td style="padding: 4px 0; color: #1d4ed8; font-weight: 600;">Auth Provider:</td>
                <td style="padding: 4px 0; color: #1e40af;">${userDetails.authProvider}</td>
              </tr>
              ` : ''}
              ${userDetails.userAgent ? `
              <tr>
                <td style="padding: 4px 0; color: #1d4ed8; font-weight: 600;">User Agent:</td>
                <td style="padding: 4px 0; color: #1e40af; font-size: 12px;">${userDetails.userAgent}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 4px 0; color: #1d4ed8; font-weight: 600;">Time:</td>
                <td style="padding: 4px 0; color: #1e40af;">${(userDetails.timestamp || new Date()).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            This is an automated notification from AJ STUDIOZ v0-clone.
          </p>
        </div>
      `,
    })

    // Send welcome back email to user
    const userRes: any = await resend.emails.send({
      from: 'AJ STUDIOZ <noreply@ajstudioz.co.in>',
      to: userDetails.email,
      subject: '👋 Welcome Back to AJ STUDIOZ!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome Back!</h2>
          
          <p style="color: #374151; font-size: 16px;">
            Hi${userDetails.name ? ` ${userDetails.name}` : ''},
          </p>
          
          <p style="color: #374151; font-size: 16px;">
            You've successfully logged in to <strong>AJ STUDIOZ v0-clone</strong>. We're glad to have you back!
          </p>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1e3a8a;">
              <strong>Login Time:</strong> ${(userDetails.timestamp || new Date()).toLocaleString()}
            </p>
            ${userDetails.ipAddress ? `
            <p style="margin: 8px 0 0 0; color: #1e3a8a;">
              <strong>Location:</strong> IP ${userDetails.ipAddress}
            </p>
            ` : ''}
          </div>
          
          <p style="color: #374151; font-size: 16px;">
            If this wasn't you, please contact us immediately.
          </p>
          
          <div style="margin: 32px 0;">
            <a href="https://dev.ajstudioz.co.in" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            Happy coding!<br>
            The AJ STUDIOZ Team
          </p>
        </div>
      `,
    })

    const id = adminRes?.id ?? adminRes?.messageId ?? null
    console.log(`User login emails sent for ${userDetails.email}, id=${id}`)
    return { success: true, id, provider: 'resend' }
  } catch (error: any) {
    console.error('Failed to send user login email:', error)
    return { success: false, error: error?.message ?? String(error), provider: 'resend' }
  }
}

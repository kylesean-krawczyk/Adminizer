import type { Handler } from '@netlify/functions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
}

type InvitationEmailRequest = {
  to?: string
  token?: string
  organizationName?: string
  role?: string
  inviterName?: string
  expiresAt?: string
}

const jsonResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
})

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    return jsonResponse(500, {
      error: 'Email service not configured. Please use the manual invitation link instead.'
    })
  }

  let requestData: InvitationEmailRequest

  try {
    requestData = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' })
  }

  const {
    to,
    token,
    organizationName,
    role = 'user',
    inviterName,
    expiresAt
  } = requestData

  if (!to || !token || !organizationName || !expiresAt) {
    return jsonResponse(400, { error: 'Missing required fields' })
  }

  const appUrl =
    process.env.APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    'https://admin.redemptionflagstaff.com'

  const invitationUrl = `${appUrl.replace(/\/$/, '')}/invite/${encodeURIComponent(token)}`
  const safeOrganizationName = escapeHtml(organizationName)
  const safeRole = escapeHtml(role)
  const safeInviterName = inviterName ? escapeHtml(inviterName) : ''
  const safeTo = escapeHtml(to)
  const safeInvitationUrl = escapeHtml(invitationUrl)
  const expirationDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join ${safeOrganizationName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">You're Invited!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                      ${safeInviterName ? `<strong>${safeInviterName}</strong> has invited you to join` : 'You have been invited to join'}
                      <strong>${safeOrganizationName}</strong> on Adminizer as a <strong>${safeRole}</strong>.
                    </p>
                    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #374151;">
                      Click the button below to accept your invitation and set up your account:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${safeInvitationUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4);">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0; font-size: 13px; line-height: 1.6; color: #3b82f6; word-break: break-all; text-align: center;">
                      ${safeInvitationUrl}
                    </p>
                    <div style="margin-top: 30px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #92400e;">
                        <strong>Important:</strong> This invitation expires on ${escapeHtml(expirationDate)}.
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280; text-align: center;">
                      This invitation was sent to <strong>${safeTo}</strong>. If you weren't expecting this invitation, you can safely ignore this email.
                    </p>
                    <p style="margin: 12px 0 0; font-size: 13px; line-height: 1.6; color: #9ca3af; text-align: center;">
                      © ${new Date().getFullYear()} Adminizer. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.INVITATION_FROM_EMAIL || 'Redemption Flagstaff <noreply@redemptionflagstaff.com>',
      to: [to],
      subject: `You're invited to join ${organizationName}`,
      html: emailHtml
    })
  })

  const resendData = await resendResponse.json()

  if (!resendResponse.ok) {
    return jsonResponse(resendResponse.status, {
      error: 'Failed to send email',
      details: resendData
    })
  }

  return jsonResponse(200, {
    success: true,
    messageId: resendData.id,
    message: 'Invitation email sent successfully'
  })
}

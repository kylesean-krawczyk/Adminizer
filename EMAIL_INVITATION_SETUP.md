# Email Invitation Setup Guide

## Current Status

The invitation system is now **working** - invitations are successfully created in the database and invitation links are generated. However, **emails are not being sent** because the email service (Resend) is not configured.

## What's Fixed

1. **Better Error Handling**: The system now properly detects when emails fail to send
2. **Clear User Feedback**: The invitation modal shows:
   - Green checkmark when email is sent successfully
   - Yellow warning when email fails with the specific error message
   - Always displays the invitation link for manual sharing
3. **Copy Link Functionality**: You can always copy the invitation link, regardless of email status

## Setting Up Email Delivery (Optional)

If you want to automatically send invitation emails, follow these steps:

### Step 1: Get a Resend API Key

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. Navigate to **API Keys** in the dashboard
3. Click **Create API Key**
4. Give it a name (e.g., "Adminizer Invitations")
5. Copy the API key (starts with `re_`)

### Step 2: Verify Your Sending Domain (Recommended)

For production use, you should verify your domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `redemptionflagstaff.com`)
4. Follow the DNS setup instructions
5. Wait for verification (usually 5-10 minutes)

**OR** use Resend's test domain for development:
- Test emails can be sent using `onboarding@resend.dev` as the sender
- Update line 156 in `/supabase/functions/send-invitation-email/index.ts`:
  ```typescript
  from: "Adminizer <onboarding@resend.dev>",
  ```

### Step 3: Configure Supabase Edge Function Secret

You need to add the RESEND_API_KEY to your Supabase project:

**Option A: Using Supabase Dashboard**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** → **Settings**
4. Click **Add Secret**
5. Name: `RESEND_API_KEY`
6. Value: Paste your Resend API key
7. Click **Save**

**Option B: Using Supabase CLI** (if you have it installed locally)
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### Step 4: Update Email Configuration (Optional)

If you want to customize the sender email, update these lines in `/supabase/functions/send-invitation-email/index.ts`:

```typescript
// Line 57: Update the default app URL
const appUrl = Deno.env.get("APP_URL") || "https://your-domain.com";

// Line 156: Update the sender email
from: "Your Org Name <noreply@your-domain.com>",
```

### Step 5: Test the Email Flow

1. Go to the Users page
2. Click "Invite User"
3. Fill in the form and submit
4. You should now see:
   - **Green checkmark**: "Invitation sent successfully!"
   - Email should arrive at the recipient's inbox

## Current Workaround (Without Email Setup)

**You can use the system right now without configuring email!**

When you invite a user:
1. The modal will show a yellow warning: "Email could not be sent"
2. An invitation link will be displayed
3. Click the **Copy** button to copy the link
4. Share the link manually via:
   - Slack/Teams message
   - Text message
   - Any other communication method

The invitation link works the same whether sent via email or shared manually.

## Troubleshooting

### "Email service not configured" Error
- This means `RESEND_API_KEY` is not set
- Follow Step 3 above to add the secret

### Email Sent but Not Received
1. Check spam/junk folder
2. Verify the sending domain is authenticated
3. Check Resend dashboard for delivery logs
4. Make sure you're using a verified domain or `onboarding@resend.dev`

### "Failed to send email" Error
1. Check that the API key is valid
2. Verify you haven't exceeded Resend's free tier limits (100 emails/day)
3. Check Supabase Edge Function logs for detailed errors

## Email Service Costs

**Resend Pricing:**
- Free tier: 100 emails/day, 3,000 emails/month
- Pro: $20/month for 50,000 emails/month
- Perfect for most organizations starting out

## Summary

- **Invitations work now** - links are generated successfully
- **Email is optional** - you can share links manually
- **Easy to enable** - just add one API key when you're ready
- **No code changes needed** - everything is already configured

When you're ready to enable automatic email delivery, just follow Steps 1-3 above!

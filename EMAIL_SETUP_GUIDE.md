# Email Delivery Setup Guide

## ✅ Completed Steps

1. **Edge Function Updated** - Changed sender email to `Redemption Flagstaff <noreply@redemptionflagstaff.com>`
2. **Edge Function Deployed** - The `send-invitation-email` function is live and ready

## 🔧 Your Action Items

Follow these steps to complete the email setup:

### Step 1: Create Resend Account (5 minutes)

1. Go to https://resend.com
2. Click "Sign Up"
3. Enter your email (use kyle.sean.krawczyk@gmail.com or kyle@redemptionflagstaff.com)
4. Verify your email address
5. Complete account setup

**Free Tier Includes:**
- 100 emails per day
- 3,000 emails per month
- Perfect for church invitation emails

---

### Step 2: Generate Resend API Key (2 minutes)

1. Log into Resend dashboard
2. Navigate to **API Keys** section (left sidebar)
3. Click **"Create API Key"**
4. Name it: `Adminizer Invitations`
5. Click **"Create"**
6. **IMPORTANT:** Copy the API key immediately (starts with `re_`)
7. Save it securely - you'll only see it once!

---

### Step 3: Verify Your Domain (Optional - Recommended)

**Why verify?** Professional emails from your domain instead of generic `onboarding@resend.dev`

1. In Resend dashboard, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter: `redemptionflagstaff.com`
4. Copy the DNS records provided
5. Add these DNS records to your domain registrar (GoDaddy, Namecheap, etc.)
   - Typically add 2-3 TXT records for SPF and DKIM
   - Add 1 MX record (optional)
6. Wait 5-30 minutes for DNS propagation
7. Return to Resend and click **"Verify"**

**Skip this step for now?** You can test immediately using `onboarding@resend.dev` and verify your domain later.

---

### Step 4: Add Secrets to Supabase (3 minutes)

Now add the API key to your Supabase Edge Functions:

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"Edge Functions"** in left sidebar
4. Click on **"send-invitation-email"** function
5. Go to **"Secrets"** or **"Environment Variables"** tab
6. Add these two secrets:

| Secret Name | Value |
|------------|-------|
| `RESEND_API_KEY` | Your API key from Step 2 (starts with `re_`) |
| `APP_URL` | `https://admin.redemptionflagstaff.com` |

7. Click **"Save"**

#### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase secrets set RESEND_API_KEY=re_your_actual_key_here
supabase secrets set APP_URL=https://admin.redemptionflagstaff.com
```

---

### Step 5: Verify Netlify Environment Variables (1 minute)

Make sure these are set in Netlify (you mentioned you already added them):

1. Go to Netlify dashboard
2. Select your site: `admin.redemptionflagstaff.com`
3. Go to **Site settings** > **Environment variables**
4. Verify these exist:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MODE=production`

---

### Step 6: Redeploy Netlify Site (5 minutes)

Trigger a fresh deployment to ensure everything is up to date:

1. In Netlify dashboard, go to **"Deploys"** tab
2. Click **"Trigger deploy"** dropdown
3. Select **"Deploy site"**
4. Wait for build to complete (2-5 minutes)
5. Watch for "Published" status

---

### Step 7: Test Email Delivery (2 minutes)

Now test the complete invitation flow:

1. Go to https://admin.redemptionflagstaff.com
2. Log in as kyle.sean.krawczyk@gmail.com
3. Navigate to **User Management**
4. Click **"Invite User"**
5. Enter email: `kyle@redemptionflagstaff.com`
6. Select role: `admin`
7. Click **"Send Invitation"**

**Expected Results:**
- ✅ Success message appears
- ✅ Email arrives in inbox within 1-2 minutes
- ✅ Email has professional design with blue gradient header
- ✅ "Accept Invitation" button works
- ✅ Link redirects to: `https://admin.redemptionflagstaff.com/invite/{TOKEN}`

**Check spam folder** if email doesn't arrive in inbox!

---

### Step 8: Accept the Invitation (1 minute)

1. Open the email in kyle@redemptionflagstaff.com inbox
2. Click **"Accept Invitation"** button
3. You'll be redirected to the account setup page
4. Create a password
5. Complete profile setup
6. You're now logged in with admin access!

---

## 🔍 Monitoring & Troubleshooting

### Check Email Delivery Status

**Resend Dashboard:**
1. Go to https://resend.com/logs
2. View all sent emails
3. Check delivery status, opens, bounces
4. View detailed error messages if any

**Browser Console:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Send an invitation
4. Look for:
   - `Invitation created: {data}`
   - `Invitation email sent successfully`

---

## 🚨 Common Issues & Solutions

### Issue: "Email service not configured" error

**Cause:** RESEND_API_KEY is missing or incorrect in Supabase

**Solution:**
1. Double-check the API key in Supabase Edge Function secrets
2. Make sure there are no extra spaces
3. Key should start with `re_`
4. Wait 1-2 minutes after adding secrets for them to take effect

---

### Issue: Email not arriving

**Check these:**
1. ✅ Spam/junk folder
2. ✅ Resend dashboard for delivery errors
3. ✅ Email address is spelled correctly
4. ✅ Resend account is verified
5. ✅ API key is valid (not expired or deleted)

**Resend Dashboard:**
- Go to Logs section
- Find the email attempt
- Check delivery status and error messages

---

### Issue: Wrong domain in invitation link

**Cause:** APP_URL environment variable is incorrect

**Solution:**
1. Check APP_URL in Supabase Edge Function secrets
2. Should be: `https://admin.redemptionflagstaff.com`
3. No trailing slash
4. Must include `https://`

---

### Issue: Emails going to spam

**Solutions:**
1. Verify your domain in Resend (Step 3)
2. Add SPF and DKIM DNS records
3. Use custom "from" email on verified domain
4. Ask recipients to mark as "Not Spam" and add to contacts

---

### Issue: Invitation link expired

**Details:**
- Invitations expire after 7 days
- After expiration, user cannot accept
- Admin must send a new invitation

**Solution:**
1. Go to User Management
2. Find the expired invitation
3. Delete it
4. Send a new invitation

---

## 📊 Email Template Details

The invitation email includes:

**Header:**
- Blue gradient background
- "You're Invited!" headline
- Professional, modern design

**Body:**
- Personalized message with inviter name
- Organization name
- User's role
- Large "Accept Invitation" button
- Backup text link for accessibility

**Footer:**
- Recipient email address
- Expiration date warning
- Current year
- Professional disclaimer

---

## 💰 Cost & Usage

**Resend Free Tier:**
- 100 emails per day
- 3,000 emails per month
- No credit card required
- Perfect for small-to-medium organizations

**Upgrade Plans:**
- **Pro ($20/month):** 50,000 emails/month
- **Enterprise:** Custom volume, dedicated IPs, priority support

**For Redemption Flagstaff:** Free tier should be more than sufficient for occasional user invitations.

---

## 📈 Next Steps After Email Setup

Once email is working:

1. ✅ Send invitation to kyle@redemptionflagstaff.com
2. ✅ Accept invitation and create account
3. ✅ Log in with new credentials
4. ✅ Invite additional staff members
5. ✅ Configure organization settings
6. ✅ Customize branding and departments

---

## 🔐 Security Best Practices

**Protect Your API Key:**
- ❌ Never commit to git
- ❌ Never share publicly
- ❌ Never expose in client-side code
- ✅ Store only in Supabase Edge Function secrets
- ✅ Rotate periodically (every 90 days)
- ✅ Use different keys for dev/production

**Monitor Usage:**
- Check Resend dashboard weekly
- Watch for unusual activity
- Set up alerts for delivery failures
- Review sent emails regularly

---

## ✅ Setup Completion Checklist

Mark each step as you complete it:

- [ ] Resend account created and verified
- [ ] Resend API key generated and saved
- [ ] Domain verified in Resend (optional)
- [ ] RESEND_API_KEY added to Supabase Edge Function
- [ ] APP_URL added to Supabase Edge Function
- [ ] Netlify environment variables verified
- [ ] Netlify site redeployed
- [ ] Test invitation sent
- [ ] Email received successfully
- [ ] Invitation link works correctly
- [ ] Account creation completed
- [ ] New user can log in

---

## 📞 Support Resources

**Resend Documentation:**
- https://resend.com/docs
- https://resend.com/docs/send-with-nodejs

**Supabase Edge Functions:**
- https://supabase.com/docs/guides/functions
- https://supabase.com/docs/guides/functions/secrets

**Need Help?**
- Resend has excellent support and documentation
- Test emails thoroughly before inviting real users
- Keep your API key secure at all times

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Invitation email arrives within 1-2 minutes
2. ✅ Email has professional design and branding
3. ✅ "Accept Invitation" button works
4. ✅ User is redirected to correct URL
5. ✅ Account setup completes successfully
6. ✅ New user can log in immediately
7. ✅ No errors in browser console or Resend logs

---

**Estimated Total Setup Time:** 15-20 minutes active work + 5-30 minutes DNS propagation (if verifying domain)

**You're all set!** Follow the steps above, and your email invitation system will be fully operational. 🚀

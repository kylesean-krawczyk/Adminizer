# Production Database Connection - Setup Complete

## Summary

Bolt is now connected directly to your production database. All changes made in Bolt will immediately affect your live site at https://admin.redemptionflagstaff.com.

## What Was Done

### 1. Database Connection Updated
- Updated `.env` file to point to production Supabase database
- Changed from: `ntwkmyhwvxikfesrvuox.supabase.co` (old dev database)
- Changed to: `abgtunvbbtlhsjphsvqq.supabase.co` (production database)

### 2. Production Database Verified
- Connected successfully to production database
- Confirmed 26 tables with proper schema
- Verified 30 migrations are applied
- Found existing super admin user (Kyle Krawczyk)
- Confirmed 1 organization exists

### 3. Edge Function Deployed
- Deployed `send-invitation-email` Edge Function to production
- Updated default APP_URL to `https://admin.redemptionflagstaff.com`
- Function is now active and ready to send invitation emails

### 4. Build Verification
- Ran production build successfully
- All assets compiled correctly
- No errors detected

## Current Status

### Database Connection
- **Local Bolt Environment**: Connected to production database
- **Live Site**: Connected to production database
- **Status**: Both environments use the SAME database (perfect sync)

### Edge Functions
The invitation email function is deployed and active at:
```
https://abgtunvbbtlhsjphsvqq.supabase.co/functions/v1/send-invitation-email
```

### Required Edge Function Secrets
To enable email sending, you need to configure these secrets in Supabase:

1. **RESEND_API_KEY**: Your Resend API key for sending emails
2. **APP_URL** (optional): Defaults to https://admin.redemptionflagstaff.com

## How to Configure Edge Function Secrets

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/abgtunvbbtlhsjphsvqq
2. Navigate to Edge Functions → Configuration → Secrets
3. Add the following secrets:
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key
   - Name: `APP_URL` (optional)
   - Value: `https://admin.redemptionflagstaff.com`

### Option 2: Using Supabase CLI
```bash
# Set RESEND_API_KEY
npx supabase secrets set RESEND_API_KEY=your_resend_api_key_here

# Set APP_URL (optional, already has default)
npx supabase secrets set APP_URL=https://admin.redemptionflagstaff.com
```

## How Database Sync Works Now

### Automatic Sync (No Manual Steps Needed)
- Bolt and your production site share the SAME database
- Changes in Bolt → Instantly visible on production site
- Changes on production site → Instantly visible in Bolt
- No deployment needed for data changes
- No manual sync procedures required

### Schema Changes (Migrations)
When you create new tables or modify schema:
1. Create migration file in `supabase/migrations/`
2. Apply migration using Supabase MCP tools in Bolt
3. Changes are immediately applied to production database
4. Both Bolt and production site use the updated schema

## Important Safety Notes

### ⚠️ You Are Now Working Directly on Production
- All database queries affect live data
- All schema changes affect the live site
- Test carefully before running destructive operations
- Consider using SQL editor for testing complex queries first

### Data Safety Recommendations
1. **Before dropping tables/columns**: Export data first
2. **Before major schema changes**: Take a database backup
3. **Test queries**: Use SELECT statements before UPDATE/DELETE
4. **RLS Policies**: Be careful when modifying security policies

### Supabase Backups
Your production database automatically backs up:
- Point-in-time recovery available for the last 7 days
- Access backups at: https://supabase.com/dashboard/project/abgtunvbbtlhsjphsvqq/settings/backups

## Testing the Invitation Flow

Once you add the RESEND_API_KEY secret:

1. Log in to https://admin.redemptionflagstaff.com
2. Go to User Management
3. Click "Invite User"
4. Enter email, select role
5. Click "Send Invitation"
6. User receives email with invitation link
7. User clicks link → Lands on your production site
8. User completes registration

## Next Steps

1. **Add RESEND_API_KEY to Supabase Edge Function secrets** (required for email invitations)
2. Test the invitation flow end-to-end
3. Start developing features directly in Bolt (changes apply to production immediately)

## Benefits of This Setup

### Simplicity
- One database to manage
- No environment confusion
- No sync procedures needed

### Real-time Consistency
- Production and development always in sync
- See production data while developing
- Debug issues using actual production state

### Faster Development
- Test features with real data
- No separate staging deployment
- Immediate feedback on changes

### Easier Debugging
- Debug production issues directly
- See exactly what users see
- No environment discrepancies

## Old Development Database

The old development database (`ntwkmyhwvxikfesrvuox.supabase.co`) can be:
- Paused to save costs (if no important data)
- Deleted entirely
- Kept as a testing sandbox (update credentials in separate .env.test file)

Since you confirmed there's no important data, you can safely pause or delete it from the Supabase dashboard.

## Files Updated

1. `.env` - Updated with production credentials
2. `supabase/functions/send-invitation-email/index.ts` - Updated default APP_URL
3. Edge Function deployed to production

## Support Resources

- Supabase Dashboard: https://supabase.com/dashboard/project/abgtunvbbtlhsjphsvqq
- Production Site: https://admin.redemptionflagstaff.com
- Database URL: https://abgtunvbbtlhsjphsvqq.supabase.co

---

**Setup completed successfully!** You're now ready to develop directly against your production database.

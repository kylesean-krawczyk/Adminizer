# Super Admin Setup Guide

This guide will walk you through setting up your Supabase database and creating your super admin user from scratch.

## Overview

You will be running a single SQL script that creates:
- All database tables (organizations, user_profiles, user_invitations, documents)
- Row Level Security policies
- Authentication triggers
- Your super admin user account

**Total Setup Time:** Approximately 2-3 minutes

---

## Prerequisites

Before starting, make sure you have:

- [x] Access to your Supabase Dashboard
- [x] Your Supabase project is active (not paused)
- [x] The file `supabase_complete_setup.sql` in this directory

---

## Step-by-Step Instructions

### Step 1: Access Supabase Dashboard

1. Open your web browser
2. Go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
3. Sign in with your Supabase account
4. You should see your project: **ntwkmyhwvxikfesrvuox**

**Screenshot reference:** You should see a dashboard with your projects listed.

---

### Step 2: Open SQL Editor

1. Click on your project **ntwkmyhwvxikfesrvuox** to open it
2. Look at the left sidebar menu
3. Find and click on **"SQL Editor"** (it has a database icon)

**Navigation path:** Dashboard → Your Project → SQL Editor

---

### Step 3: Create New Query

1. In the SQL Editor, click the **"New query"** button in the top-right corner
2. A new editor window will open with an empty query

---

### Step 4: Copy and Paste the SQL Script

1. Open the file `supabase_complete_setup.sql` in a text editor
2. Select ALL the content (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)
4. Go back to the Supabase SQL Editor
5. Paste the entire script into the editor (Ctrl+V or Cmd+V)

**Important:** Make sure you copy the ENTIRE file from beginning to end.

---

### Step 5: Run the Script

1. Click the **"Run"** button at the bottom-right of the SQL Editor
   - Alternatively, press **Ctrl+Enter** (Windows/Linux) or **Cmd+Enter** (Mac)
2. Wait for the script to complete (should take 10-20 seconds)

**What to expect:**
- You'll see a progress indicator
- The script will execute all 20 steps sequentially
- Each step will log its progress

---

### Step 6: Check the Results

After the script completes, look for the **"Messages"** tab near the bottom of the editor.

#### Success Indicators

You should see messages like:

```
NOTICE:  ============================================================================
NOTICE:  STEP 1: Enabling PostgreSQL Extensions...
NOTICE:  ============================================================================
NOTICE:  ✓ Extensions enabled successfully
...
[More steps...]
...
NOTICE:  ✓✓✓ SUCCESS! Database setup completed successfully! ✓✓✓
NOTICE:
NOTICE:  You can now login with:
NOTICE:    Email: kyle.sean.krawczyk@gmail.com
NOTICE:    Password: AdminPassword123!
NOTICE:
NOTICE:  IMPORTANT: Change your password immediately after first login!
NOTICE:  ============================================================================
```

#### Verification Checklist

The script will verify:
- [x] Extensions enabled: 2/2
- [x] Tables created: 4/4
- [x] Primary organization: ✓ Created
- [x] Super admin auth user: ✓ Created
- [x] Super admin profile: ✓ Created
- [x] RLS policies created (should see a number like 15+)
- [x] Triggers created: 3/3

---

### Step 7: Verify Database Tables

To double-check everything was created correctly:

1. In the left sidebar, click on **"Table Editor"**
2. You should see these tables:
   - `organizations`
   - `user_profiles`
   - `user_invitations`
   - `documents`

3. Click on `user_profiles` table
4. You should see one row with:
   - Email: `kyle.sean.krawczyk@gmail.com`
   - Role: `master_admin`
   - Is Active: `true`

---

## Troubleshooting

### Problem: "relation already exists" errors

**Solution:** Some tables already exist. This is okay! The script uses `CREATE TABLE IF NOT EXISTS`, so it will skip creating existing tables. However, you may need to ensure the data is consistent.

**Action:** Continue to the verification step. If the final message says "SUCCESS!", you're good to go.

---

### Problem: "permission denied" errors

**Solution:** Your database user doesn't have sufficient permissions.

**Action:**
1. Check that you're running the script in the SQL Editor (not the regular query interface)
2. The SQL Editor should use the service_role by default
3. If the problem persists, contact Supabase support

---

### Problem: Script times out or hangs

**Solution:** The script might be taking longer than expected.

**Action:**
1. Wait up to 60 seconds
2. If nothing happens, refresh the page and try again
3. Check your internet connection
4. Verify your Supabase project is not paused

---

### Problem: "Cannot find extension pgcrypto"

**Solution:** PostgreSQL extensions are not enabled.

**Action:**
1. Go to **Database** → **Extensions** in the left sidebar
2. Enable `pgcrypto` and `uuid-ossp` manually
3. Re-run the script

---

### Problem: The verification shows missing items

**Example:** "Super admin auth user: ✗ Missing"

**Action:**
1. Check the error messages above the verification section
2. Note which step failed
3. You may need to run specific sections of the script manually
4. Common issue: The auth.users table might have restrictions

**Advanced troubleshooting:**
Run this query to check if the auth user exists:
```sql
SELECT email, created_at FROM auth.users WHERE email = 'kyle.sean.krawczyk@gmail.com';
```

---

## What the Script Creates

### Tables

1. **organizations**
   - Stores organization/company information
   - Supports multi-vertical configuration (church, business, estate)
   - Tracks organization settings and history

2. **user_profiles**
   - Links to Supabase auth.users
   - Stores user role (master_admin, admin, user)
   - Tracks which organization users belong to
   - Stores active vertical preference

3. **user_invitations**
   - Manages user invitation system
   - Admins can invite new users
   - Tracks invitation status and expiry

4. **documents**
   - Stores document metadata
   - Links to Supabase Storage
   - Organization-based access control

### Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only see data from their organization
- Admins have elevated permissions
- Super admin (master_admin role) has full access

### Automation

- **Trigger on auth.users**: Automatically creates user_profile when new user signs up
- **Trigger on auth.sessions**: Updates last_login timestamp
- **Update triggers**: Automatically update updated_at timestamps

---

## Your Super Admin Credentials

After successful setup, you can login with:

**Email:** kyle.sean.krawczyk@gmail.com
**Password:** AdminPassword123!

**⚠️ CRITICAL: Change this password immediately after your first login!**

---

## Next Steps

After the database setup is complete:

1. ✅ Read the login instructions: `FIRST_LOGIN_INSTRUCTIONS.md`
2. ✅ Login to your application
3. ✅ Verify your super admin access
4. ✅ Change your password
5. ✅ Start using the application!

---

## Additional Resources

- **Supabase Documentation:** https://supabase.com/docs
- **SQL Editor Guide:** https://supabase.com/docs/guides/database/overview
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security

---

## Support

If you encounter issues not covered in this guide:

1. Check the Supabase dashboard for any alerts or warnings
2. Review the complete error message in the Messages tab
3. Check your Supabase project's database health in the Dashboard
4. Ensure your project is on an active billing plan (if required)

---

**Last Updated:** 2025-11-08
**Script Version:** 1.0
**Compatible with:** Supabase PostgreSQL 15+

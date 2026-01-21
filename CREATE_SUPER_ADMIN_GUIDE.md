# Super Admin Creation Guide - From Scratch

Complete step-by-step instructions for creating your super admin user when starting with an empty database.

---

## Overview

This guide will help you:
1. Create a super admin user in Supabase Auth
2. Set up full access RLS policies
3. Verify the setup works correctly
4. Login and change your password

**Total Time:** 5-10 minutes

---

## Prerequisites

✅ Access to your Supabase Dashboard
✅ Database with `organizations` and `user_profiles` tables
✅ PostgreSQL extension `pgcrypto` enabled
✅ No existing users in the database (fresh start)

---

## Part 1: Create Super Admin User

### Step 1: Access Supabase SQL Editor

1. Open https://supabase.com/dashboard in your browser
2. Select your project from the list
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** button (top right corner)

### Step 2: Customize Your Email

1. Open the file `CREATE_SUPER_ADMIN.sql` in a text editor
2. Find this line (around line 57):
   ```sql
   v_admin_email text := 'admin@yourdomain.com';
   ```
3. **Replace** `admin@yourdomain.com` with **YOUR EMAIL ADDRESS**
4. Save the file

**Example:**
```sql
v_admin_email text := 'john.doe@mycompany.com';
```

### Step 3: Run the Creation Script

1. Copy the **ENTIRE** contents of `CREATE_SUPER_ADMIN.sql`
2. Paste into the SQL Editor query window
3. Click **"Run"** button (or press `Ctrl+Enter`)
4. Wait 1-3 seconds for completion

### Step 4: Verify Success

Check the **"Messages"** tab. You should see:

```
============================================================================
✓✓✓ SUCCESS! Super Admin User Created! ✓✓✓
============================================================================

You can now login with:
  Email: your-email@domain.com
  Password: TempPassword123!

⚠️  IMPORTANT: Change your password immediately after first login!

Next Steps:
  1. Go to your application login page
  2. Login with the credentials above
  3. Navigate to Settings > Change Password
  4. Set a strong, secure password

============================================================================
```

**If you see errors:** Scroll up in the Messages tab to identify the issue. Common problems are covered in the Troubleshooting section below.

---

## Part 2: Grant Full Super Admin Access

After creating the user, you need to add RLS policies for full system access.

### Step 1: Open New Query

1. In the SQL Editor, click **"New query"** button again
2. A fresh query window will open

### Step 2: Run RLS Policy Script

1. Open the file `UPDATE_RLS_POLICIES.sql`
2. Copy the **ENTIRE** contents
3. Paste into the new query window
4. Click **"Run"** button

### Step 3: Verify RLS Policies

Check the **"Messages"** tab. You should see:

```
============================================================================
✓✓✓ SUCCESS! All Super Admin Policies Created! ✓✓✓
============================================================================

Your super admin user now has full access to:
  - All user profiles (view, update, delete)
  - All user invitations (view, create, update, delete)
  - All organizations (view, update, delete)
  - All documents (view, create, update, delete)

You can now login as super admin and access all features!

============================================================================
```

---

## Part 3: First Login

### Step 1: Navigate to Login Page

1. Open your application in a web browser
2. Go to the login page (usually `/login` or `/auth/login`)

### Step 2: Enter Credentials

- **Email**: The email you specified in the script
- **Password**: `TempPassword123!`

Click **"Login"** or **"Sign In"**

### Step 3: Verify You're Logged In

After successful login, you should:
- Be redirected to the dashboard
- See your email/name in the header
- Have access to admin menu items

---

## Part 4: Change Your Password (CRITICAL!)

**⚠️ This step is MANDATORY for security**

### Step 1: Navigate to Settings

Look for one of these options in your application:
- **Profile** menu → **Change Password**
- **Settings** → **Account** → **Change Password**
- **User Menu** (top right) → **Change Password**

### Step 2: Change Password

1. Enter current password: `TempPassword123!`
2. Enter your new, strong password
3. Confirm the new password
4. Click **"Save"** or **"Update Password"**

### Requirements for Strong Password

- Minimum 12 characters
- Include uppercase letters (A-Z)
- Include lowercase letters (a-z)
- Include numbers (0-9)
- Include special characters (!@#$%^&*)

**Example Strong Password:** `MyApp2025!SecureP@ss`

---

## Part 5: Verify Super Admin Access

### Check Dashboard Access

After login, verify you can access:

1. **User Management Page**
   - View all users
   - Create new users
   - Edit user roles
   - Deactivate users

2. **Organization Settings**
   - View organization details
   - Update organization info
   - Manage vertical configurations

3. **Document Management**
   - View all documents
   - Upload documents
   - Delete documents

4. **System Settings**
   - Manage feature flags
   - Configure branding
   - Update system preferences

### Check Role Display

Your role should be displayed as one of:
- `master_admin`
- `Super Admin`
- Admin badge/indicator

Common locations:
- Top right corner of dashboard
- User profile dropdown
- Settings page

---

## Troubleshooting

### Issue: "Email already exists"

**Symptoms:** Script says user already exists

**Solution:**
1. The script will skip creating auth user
2. It will update existing user profile to `master_admin`
3. Login with your existing password (NOT the temp password)
4. Or reset your password through Supabase Dashboard

### Issue: "Failed to create primary organization"

**Symptoms:** Error creating organization

**Possible Causes:**
- Table doesn't exist
- RLS blocking insert
- Foreign key constraint issue

**Solution:**
```sql
-- Check if table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'organizations';

-- If missing, create it first or run the full setup script
```

### Issue: "Cannot login after creation"

**Symptoms:** Login fails with correct credentials

**Checklist:**
- [ ] Email is correct (check for typos)
- [ ] Using `TempPassword123!` exactly (case-sensitive)
- [ ] User is active: `is_active = true`
- [ ] Email confirmation is disabled in Supabase Auth settings
- [ ] No typos in the email field

**Manual Check:**
```sql
-- Verify user exists in auth
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'your-email@domain.com';

-- Should show 1 row with email_confirmed_at populated
```

### Issue: "Access denied" after login

**Symptoms:** Can login but can't access admin features

**Solutions:**

1. **Verify role is set:**
```sql
SELECT id, email, role, is_active, organization_id
FROM user_profiles
WHERE email = 'your-email@domain.com';
-- Role should be 'master_admin'
```

2. **Verify RLS policies exist:**
```sql
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE 'Super admins%';
-- Should return at least 16
```

3. **Re-run the RLS policy script:**
   - Go back to Part 2 above
   - Run `UPDATE_RLS_POLICIES.sql` again

4. **Clear browser cache:**
   - Logout
   - Clear browser cache and cookies
   - Login again

### Issue: "Organization not found"

**Symptoms:** User exists but has no organization

**Solution:**
```sql
-- Check organization exists
SELECT * FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- If missing, create it:
INSERT INTO organizations (
  id, name, vertical, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Primary Organization',
  'church',
  now()
);

-- Link user to organization:
UPDATE user_profiles
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE email = 'your-email@domain.com';
```

### Issue: "Password doesn't meet requirements"

**Symptoms:** Can't set new password

**Solution:**
- Check your app's password policy
- Make sure new password meets all requirements
- Try a longer password (15+ characters)
- Include all character types

---

## Manual Verification Queries

Run these in SQL Editor to verify everything is set up correctly:

### 1. Check Auth User
```sql
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  role
FROM auth.users
WHERE email = 'your-email@domain.com';
```

**Expected:** 1 row with `role = 'authenticated'` and `email_confirmed_at` is not null

### 2. Check User Profile
```sql
SELECT
  id,
  email,
  full_name,
  role,
  organization_id,
  is_active,
  active_vertical
FROM user_profiles
WHERE email = 'your-email@domain.com';
```

**Expected:** 1 row with `role = 'master_admin'` and `is_active = true`

### 3. Check Organization
```sql
SELECT
  id,
  name,
  created_by,
  vertical
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
```

**Expected:** 1 row with `created_by` matching your user ID

### 4. Check RLS Policies
```sql
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE 'Super admins%'
ORDER BY tablename, cmd;
```

**Expected:** 16-20 rows showing policies for different tables and operations

### 5. Test Full Access
```sql
-- Test if you can query as the user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = 'YOUR-USER-ID-HERE';

SELECT COUNT(*) FROM user_profiles;  -- Should return all profiles
SELECT COUNT(*) FROM organizations;  -- Should return all organizations

-- Reset
RESET ROLE;
```

---

## Security Checklist

After setup, verify these security measures:

- [ ] Password has been changed from temporary password
- [ ] New password is strong (12+ characters, mixed case, numbers, symbols)
- [ ] Email is your actual email (for password reset)
- [ ] Only necessary people have super admin access
- [ ] RLS policies are enabled on all tables
- [ ] Auth settings are configured correctly in Supabase dashboard

---

## What Was Created

### Database Records

1. **Primary Organization**
   - ID: `00000000-0000-0000-0000-000000000001`
   - Name: "Primary Organization"
   - Default vertical: church
   - Enabled verticals: church, business, estate

2. **Super Admin Auth User**
   - In `auth.users` table
   - Email confirmed automatically
   - Password encrypted with bcrypt
   - Role: authenticated

3. **Super Admin Profile**
   - In `user_profiles` table
   - Role: master_admin
   - Active: true
   - Linked to Primary Organization

### RLS Policies Created

**user_profiles:** 3 policies
- View all profiles
- Update all profiles
- Delete profiles

**user_invitations:** 4 policies
- View all invitations
- Create invitations
- Update invitations
- Delete invitations

**organizations:** 3 policies
- View all organizations
- Update all organizations
- Delete organizations

**documents:** 4 policies
- View all documents
- Create documents
- Update all documents
- Delete all documents

**Total:** 16 super admin policies

---

## Next Steps

After completing this guide:

1. ✅ Login with new password
2. ✅ Explore admin features
3. ✅ Create additional admin users (if needed)
4. ✅ Configure organization settings
5. ✅ Upload initial documents
6. ✅ Invite team members
7. ✅ Customize branding and settings

---

## File Reference

| File | Purpose |
|------|---------|
| `CREATE_SUPER_ADMIN.sql` | Creates super admin user and organization |
| `UPDATE_RLS_POLICIES.sql` | Grants full access permissions |
| `CREATE_SUPER_ADMIN_GUIDE.md` | This guide |

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **SQL Editor:** https://supabase.com/docs/guides/database/overview
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **Auth Settings:** https://supabase.com/docs/guides/auth

---

**Document Version:** 1.0
**Last Updated:** 2025-01-08
**Tested With:** Supabase PostgreSQL 15+


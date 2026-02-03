# First Login Instructions

Welcome to Adminizer! This guide will help you login for the first time as the super administrator and verify everything is working correctly.

---

## Your Super Admin Credentials

**Email:** kyle.sean.krawczyk@gmail.com
**Password:** AdminPassword123!

**⚠️ IMPORTANT:** This is a temporary password. You MUST change it immediately after logging in.

---

## Step 1: Access the Login Page

### If Running Locally

1. Make sure your development server is running
2. Open your web browser
3. Go to: [http://localhost:5173](http://localhost:5173)
   - Or whatever port your Vite server is using (check terminal output)

### If Deployed

1. Open your web browser
2. Go to your deployed application URL
   - Example: `https://your-app.netlify.app` or your custom domain

---

## Step 2: Login

1. You should see the Adminizer login page with:
   - An email input field
   - A password input field
   - A "Sign in" button

2. Enter your credentials:
   - **Email:** `kyle.sean.krawczyk@gmail.com`
   - **Password:** `AdminPassword123!`

3. Click the **"Sign in"** button

4. Wait a moment while the system authenticates you

---

## Step 3: What to Expect After Login

### Successful Login

If everything is set up correctly, you will:

1. See a brief loading screen
2. Be redirected to the main dashboard
3. See your name "Kyle Krawczyk" in the navigation bar
4. See a badge or indicator showing your role as "master_admin"

### Dashboard Overview

You should see:
- **Navigation sidebar** with all available sections
- **Dashboard statistics** (documents, categories, etc.)
- **Department cards** (all departments visible to super admin)
- **User menu** in the top-right corner showing your email

---

## Step 4: Verify Your Super Admin Access

### Check Your Profile

1. Look in the top-right corner of the dashboard
2. You should see your name: **Kyle Krawczyk**
3. There should be a badge or indicator showing: **Master Admin**

### Check Your Organization

1. Look for organization information in the UI
2. You should be assigned to: **Primary Organization**
3. Active vertical should be: **Church** (default)

### Check Your Permissions

As a master_admin, you should have access to:

- ✅ **User Management** - Invite and manage users
- ✅ **Organization Settings** - Configure organization details
- ✅ **All Departments** - Access to all department pages
- ✅ **Document Management** - Upload, view, edit, delete documents
- ✅ **Vertical Switching** - Switch between church/business/estate modes
- ✅ **Feature Flags** - Enable/disable features
- ✅ **Settings** - All administrative settings

### Quick Verification Test

Try these actions to verify your permissions:

1. **Navigate to User Management**
   - Click on "Settings" or "User Management" in the navigation
   - You should be able to see the user list (currently just you)
   - You should see an "Invite User" button

2. **Check Department Access**
   - Try clicking on different department cards from the dashboard
   - All departments should be accessible
   - No "Coming Soon" or locked features

3. **Try Uploading a Document**
   - Navigate to the Documents section
   - Click "Upload Document" button
   - The upload dialog should appear without restrictions

---

## Step 5: Change Your Password

**This is CRITICAL for security!**

### Option A: Through Settings

1. Click on your profile/user menu in the top-right corner
2. Select **"Account Settings"** or **"Change Password"**
3. Fill in the form:
   - Current Password: `AdminPassword123!`
   - New Password: Your secure password
   - Confirm New Password: Same as above
4. Click **"Update Password"**
5. You'll be logged out and need to login again with the new password

### Option B: Through Supabase Dashboard

If the in-app password change doesn't work yet:

1. Go to your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"Authentication"** in the left sidebar
4. Click **"Users"** tab
5. Find your user (kyle.sean.krawczyk@gmail.com)
6. Click the three dots menu → **"Reset Password"**
7. You'll receive an email with a reset link
8. Follow the link to set a new password

---

## Troubleshooting

### Problem: "Invalid email or password" error

**Possible Causes:**
- The database setup script didn't run successfully
- The user wasn't created in auth.users table
- Password was entered incorrectly

**Solutions:**

1. **Double-check your password**
   - Make sure you're typing: `AdminPassword123!`
   - Password is case-sensitive
   - Check for extra spaces

2. **Verify user exists in Supabase**
   - Go to Supabase Dashboard → Authentication → Users
   - Check if kyle.sean.krawczyk@gmail.com is listed
   - If not, re-run the setup script

3. **Check browser console for errors**
   - Open browser DevTools (F12)
   - Look at the Console tab
   - Look for red error messages
   - Common issue: "Database error querying schema" means setup wasn't completed

---

### Problem: "Database error querying schema"

**Cause:** The database setup script wasn't run or didn't complete successfully.

**Solution:**
1. Go back to `SUPER_ADMIN_SETUP_GUIDE.md`
2. Follow the instructions to run the SQL script in Supabase
3. Make sure you see the "SUCCESS!" message
4. Try logging in again

---

### Problem: Login succeeds but shows "User" role instead of "Master Admin"

**Cause:** The user_profiles table has incorrect role value.

**Solution:**
Run this SQL in Supabase SQL Editor:
```sql
UPDATE user_profiles
SET role = 'master_admin'
WHERE email = 'kyle.sean.krawczyk@gmail.com';
```

---

### Problem: Login succeeds but immediately logs out

**Cause:** RLS policies might be blocking user_profiles access.

**Solution:**
Check that RLS policies exist by running this in Supabase SQL Editor:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

You should see several policies. If empty, re-run the setup script.

---

### Problem: Can't access certain features or pages

**Cause:** Your role might not be properly set to master_admin.

**Solution:**
1. Verify your role in the database:
```sql
SELECT id, email, role, organization_id, is_active
FROM user_profiles
WHERE email = 'kyle.sean.krawczyk@gmail.com';
```

2. Should show:
   - role: `master_admin`
   - is_active: `true`
   - organization_id: Should have a UUID value

---

### Problem: Application doesn't load after login

**Possible Causes:**
- Browser cache issues
- Missing organization link
- JavaScript errors

**Solutions:**

1. **Clear browser cache**
   - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear cache through browser settings

2. **Check browser console**
   - Press F12 to open DevTools
   - Look for error messages in Console tab

3. **Verify organization link**
```sql
SELECT * FROM user_profiles
WHERE email = 'kyle.sean.krawczyk@gmail.com';
```
Ensure `organization_id` is not NULL

---

## Understanding Your Role

### Master Admin Privileges

As a `master_admin`, you have the highest level of access in the system:

**User Management**
- Create, view, edit, and delete user accounts
- Invite new users to the organization
- Change user roles (promote to admin, demote to user)
- Deactivate user accounts

**Organization Management**
- View and edit organization settings
- Configure verticals (church, business, estate)
- Enable/disable features for the organization
- Manage organization branding

**Data Access**
- Full access to all documents across the organization
- Can view and manage all departments
- Access to all analytics and reports
- No data restrictions

**System Configuration**
- Configure feature flags
- Manage integrations (OAuth, external services)
- Set up workflows and automation
- Configure notification preferences

**Billing and Subscription** (if applicable)
- View and manage subscription
- Update billing information
- Access usage analytics

---

## Next Steps

Now that you're logged in:

1. ✅ **Change Your Password** (if you haven't already)
2. ✅ **Explore the Dashboard** - Familiarize yourself with the interface
3. ✅ **Upload a Test Document** - Try the document management features
4. ✅ **Invite Another User** - Test the user invitation system
5. ✅ **Configure Organization Settings** - Set your organization name and preferences
6. ✅ **Try Different Verticals** - Switch between church, business, and estate modes
7. ✅ **Explore Departments** - Check out the different department pages

---

## Security Best Practices

As the super administrator, you're responsible for the security of the entire system. Follow these best practices:

1. **Strong Password**
   - Use at least 12 characters
   - Mix uppercase, lowercase, numbers, and symbols
   - Don't reuse passwords from other sites
   - Consider using a password manager

2. **Keep Credentials Private**
   - Never share your master_admin credentials
   - Don't write down your password
   - Don't login on public/shared computers

3. **Regular Security Checks**
   - Review user list regularly
   - Remove inactive users
   - Monitor login activity
   - Check for suspicious activity

4. **Limit Master Admin Accounts**
   - Only create additional master_admin accounts when absolutely necessary
   - Consider using regular admin accounts for day-to-day operations
   - Keep the master_admin account for high-level administration only

5. **Two-Factor Authentication** (if available)
   - Enable 2FA in Supabase dashboard
   - Require 2FA for all admin accounts

---

## Getting Help

If you need assistance:

1. **Check the Documentation**
   - Review README.md in the project root
   - Check TROUBLESHOOTING_GUIDE.md for common issues

2. **Check Browser Console**
   - Press F12 to open DevTools
   - Look for error messages that might provide clues

3. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Review recent database queries and errors

4. **Check Application Logs**
   - If running locally, check terminal output
   - Look for red error messages or warnings

---

**Congratulations!** You now have full super admin access to Adminizer. Enjoy managing your organization!

---

**Last Updated:** 2025-11-08
**Version:** 1.0
**For:** Adminizer v2.1.0

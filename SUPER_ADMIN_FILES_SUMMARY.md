# Super Admin Setup - Complete File Summary

All files you need to create and verify your super admin user from scratch.

---

## 📁 Files Created

### 1. CREATE_SUPER_ADMIN.sql
**Purpose:** Creates the super admin user and primary organization

**What it does:**
- Creates primary organization (if doesn't exist)
- Creates super admin user in Supabase Auth
- Creates user profile with `master_admin` role
- Links organization to super admin
- Verifies everything was created successfully

**Credentials Created:**
- Email: YOU set this (line 57 of the script)
- Password: `TempPassword123!` (change immediately after first login)
- Role: `master_admin`

**Run Time:** 1-3 seconds

---

### 2. UPDATE_RLS_POLICIES.sql
**Purpose:** Grants full system access to super admin

**What it does:**
- Creates 16+ RLS policies for super admin role
- Grants full access to:
  - All user profiles (view, update, delete)
  - All user invitations (view, create, update, delete)
  - All organizations (view, update, delete)
  - All documents (view, create, update, delete)

**Run Time:** 1-2 seconds

---

### 3. CREATE_SUPER_ADMIN_GUIDE.md
**Purpose:** Detailed step-by-step instructions

**Contents:**
- Complete setup process
- First login instructions
- Password change guide
- Troubleshooting section
- Manual verification queries
- Security checklist

**Length:** Comprehensive (~500 lines)

---

### 4. SUPER_ADMIN_QUICK_START.md
**Purpose:** Fast-track 5-minute guide

**Contents:**
- Quick steps overview
- Verification checklist
- Common issues quick fixes
- Default credentials
- Next steps

**Length:** Concise (~150 lines)

---

### 5. VERIFY_SUPER_ADMIN.sql
**Purpose:** Verification script to check if setup is complete

**What it checks:**
- Auth user exists
- User profile exists with correct role
- Organization is assigned
- RLS policies are configured (16+ policies)
- Policy breakdown by table
- Access permissions test

**Run Time:** 1 second
**Output:** Detailed pass/fail report

---

## 🎯 Which File to Use When

### Starting from Scratch (No Database Users)

1. **First:** `CREATE_SUPER_ADMIN.sql`
   - Update your email on line 57
   - Run in Supabase SQL Editor
   - Check Messages tab for success

2. **Second:** `UPDATE_RLS_POLICIES.sql`
   - Run in Supabase SQL Editor
   - Check Messages tab for success

3. **Third:** `VERIFY_SUPER_ADMIN.sql` (optional)
   - Update your email on line 19
   - Run to verify everything is correct

### Need Quick Instructions

- **Use:** `SUPER_ADMIN_QUICK_START.md`
- 5-minute guide with just the essentials

### Need Detailed Help

- **Use:** `CREATE_SUPER_ADMIN_GUIDE.md`
- Complete guide with troubleshooting

### Verify Setup is Correct

- **Use:** `VERIFY_SUPER_ADMIN.sql`
- Run script to check all components

---

## 🔄 Typical Workflow

```
Step 1: Read SUPER_ADMIN_QUICK_START.md
         ↓
Step 2: Edit CREATE_SUPER_ADMIN.sql (add your email)
         ↓
Step 3: Run CREATE_SUPER_ADMIN.sql in Supabase
         ↓
Step 4: Run UPDATE_RLS_POLICIES.sql in Supabase
         ↓
Step 5: Run VERIFY_SUPER_ADMIN.sql (optional check)
         ↓
Step 6: Login to your application
         ↓
Step 7: Change password immediately
         ↓
Step 8: Verify admin access works
         ↓
Done! ✅
```

---

## 📋 Pre-Setup Checklist

Before running any scripts, make sure:

- [ ] You have Supabase Dashboard access
- [ ] Your Supabase project is active (not paused)
- [ ] Database has these tables:
  - [ ] `organizations`
  - [ ] `user_profiles`
  - [ ] `user_invitations` (optional, for user management)
  - [ ] `documents` (optional, for document management)
- [ ] PostgreSQL extension `pgcrypto` is enabled
- [ ] You have your email address ready

---

## ⚠️ Important Notes

### Security
1. The temporary password `TempPassword123!` is intentionally simple
2. You **MUST** change it immediately after first login
3. Use a strong password (12+ characters, mixed case, numbers, symbols)
4. Don't share super admin credentials

### Email Address
- Line 57 in `CREATE_SUPER_ADMIN.sql`: `v_admin_email text := 'YOUR-EMAIL@domain.com';`
- Line 19 in `VERIFY_SUPER_ADMIN.sql`: `v_admin_email text := 'YOUR-EMAIL@domain.com';`
- Both should match YOUR actual email

### Idempotency
- `CREATE_SUPER_ADMIN.sql` can be run multiple times safely
- If user exists, it will update the profile to `master_admin` role
- If organization exists, it will update (not create duplicate)

---

## 🐛 Common Issues & Solutions

### "Email already exists"
- **Cause:** User already in database
- **Solution:** Script will update existing user to master_admin role
- **Note:** Use your existing password, not the temp password

### "Failed to create organization"
- **Cause:** Organization table doesn't exist or RLS blocking
- **Solution:** Create tables first or run full database setup

### "Cannot login"
- **Cause:** Wrong email/password, or email not confirmed
- **Solution:** Check spelling, use exact password (case-sensitive)

### "Access denied after login"
- **Cause:** RLS policies not created
- **Solution:** Run `UPDATE_RLS_POLICIES.sql`

### "Role is not master_admin"
- **Cause:** Profile wasn't updated correctly
- **Solution:** Manually update: `UPDATE user_profiles SET role = 'master_admin' WHERE email = 'your-email';`

---

## ✅ Success Indicators

You know setup succeeded when:

1. **In Supabase:**
   - Messages tab shows "SUCCESS!" for both scripts
   - VERIFY script shows all checks passed
   - Table Editor shows user in user_profiles with master_admin role

2. **In Your Application:**
   - You can login with your credentials
   - Navigation bar shows "Master Admin" badge
   - You can access User Management page
   - You can access all Settings
   - You can view/edit all documents

---

## 🎓 Understanding the Role Hierarchy

Your application has 3 roles:

1. **master_admin** (Super Admin)
   - Full system access
   - Can manage all users, orgs, documents
   - Can change any settings
   - Created by these scripts

2. **admin**
   - Organization-level admin
   - Can manage users in their organization
   - Can manage org documents
   - Can invite users

3. **user**
   - Standard user access
   - Can view own organization data
   - Can upload documents
   - Limited settings access

---

## 📞 Getting Help

If you have issues:

1. **Check the detailed guide:** `CREATE_SUPER_ADMIN_GUIDE.md`
2. **Run verification:** `VERIFY_SUPER_ADMIN.sql`
3. **Check Supabase logs:** Dashboard → Logs
4. **Review error messages:** SQL Editor → Messages tab
5. **Verify tables exist:** Dashboard → Table Editor

---

## 🔗 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **SQL Editor:** Dashboard → Your Project → SQL Editor
- **Table Editor:** Dashboard → Your Project → Table Editor
- **Auth Users:** Dashboard → Your Project → Authentication → Users

---

## 📊 What the Navigation Bar Shows

After successful login:

```
┌─────────────────────────────────────────────────────────┐
│ Logo    v2.1.0              👤 Your Name               │
│                                your@email.com           │
│                                [Master Admin] [Sign out]│
└─────────────────────────────────────────────────────────┘
```

The badge color:
- **Purple background** = master_admin
- **Blue background** = admin
- **Gray background** = user

---

## 🚀 After Setup - Next Actions

1. ✅ **Change Password** (Settings → Change Password)
2. ✅ **Update Profile** (Add full name, etc.)
3. ✅ **Configure Organization** (Settings → Organization)
4. ✅ **Invite Team Members** (User Management → Invite User)
5. ✅ **Upload Documents** (Documents → Upload)
6. ✅ **Customize Branding** (Settings → Branding)
7. ✅ **Configure Features** (Settings → Feature Flags)

---

## 📝 Script Modification Guide

If you need to customize the scripts:

### Change Default Organization Name
In `CREATE_SUPER_ADMIN.sql`, line 79:
```sql
'Primary Organization',  -- Change this
```

### Change Default Password
In `CREATE_SUPER_ADMIN.sql`, line 58:
```sql
v_temp_password text := 'TempPassword123!';  -- Change this
```

### Change Organization ID
In `CREATE_SUPER_ADMIN.sql`, line 55:
```sql
v_org_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;  -- Change this
```

---

## 📅 Maintenance

### Regular Tasks
- Review super admin access logs
- Rotate passwords every 90 days
- Audit user permissions quarterly
- Keep only necessary super admins

### Security Best Practices
- Enable 2FA when available
- Use strong, unique passwords
- Never share credentials
- Monitor access patterns
- Regular security audits

---

**Document Created:** 2025-01-08
**Version:** 1.0
**Maintained By:** Development Team
**Last Review:** 2025-01-08


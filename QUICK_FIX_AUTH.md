# 🚨 CRITICAL AUTH ERROR - QUICK FIX

**Problem:** 500 error on login, "Database error querying schema"

**Cause:** Auth trigger blocked by RLS

**Time to Fix:** 2 minutes

---

## Step 1: Fix Trigger (1 minute)

```bash
# Open: Supabase Dashboard → SQL Editor → New query
# Copy ALL of FIX_AUTH_ERROR.sql
# Click Run
```

✅ Wait for: "AUTH FIX COMPLETE"

---

## Step 2: Fix User (1 minute)

```bash
# Edit FIX_EXISTING_SUPER_ADMIN.sql line 35 with your email
# Copy ALL of the script
# Run in SQL Editor
```

✅ Wait for: "SUCCESS! Super Admin User Fixed!"

---

## Step 3: Test Login

1. Clear browser cache (or incognito mode)
2. Login to your app
3. Should work now

---

## Still Not Working?

### Clear Browser Cache
```
Chrome: Ctrl+Shift+Del
Firefox: Ctrl+Shift+Del
Safari: Cmd+Option+E
```

### Reset Password
1. Supabase Dashboard → Authentication → Users
2. Find user → Reset Password
3. Set new password
4. Try login again

### Check User Setup
```sql
SELECT 
  u.email,
  p.role,
  p.is_active
FROM auth.users u
LEFT JOIN user_profiles p ON p.id = u.id
WHERE u.email = 'your-email';
```

Should show: role=master_admin, is_active=true

---

## Files

- **FIX_AUTH_ERROR.sql** - Fixes broken trigger
- **FIX_EXISTING_SUPER_ADMIN.sql** - Fixes your user
- **AUTH_ERROR_FIX_GUIDE.md** - Detailed explanation

---

**Status:** Issue Identified ✅ | Solution Ready ✅


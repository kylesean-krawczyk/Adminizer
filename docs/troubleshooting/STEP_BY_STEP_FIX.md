# Step-by-Step Fix: Supabase Schema Cache Issue

## Error You're Seeing
```
Code: PGRST205
Message: "Could not find the table 'public.organization_ui_customizations' in the schema cache"
```

## What This Means
- ✅ Your table EXISTS in PostgreSQL database
- ❌ PostgREST API doesn't KNOW about it yet
- 🔧 Solution: Reload the schema cache

---

## 🚀 Quick Fix (5 Minutes)

### Step 1: Reload Schema Cache

**Option A: SQL Command (RECOMMENDED)**

1. In Supabase Dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New query"**
3. Paste this command:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
4. Click **"Run"**
5. **Wait 60 seconds** for the cache to reload

**Option B: Supabase Dashboard (If Available)**

1. Open your browser and go to https://supabase.com/dashboard
2. Select your project from the list
3. Click on **"Settings"** (gear icon) in the left sidebar
4. Look for **"API"** or **"Database"** in the settings menu
5. Look for **"Schema Cache"** or **"Reload"** section
6. Click the reload button if available
7. **Wait 60 seconds** for the cache to reload

**Note:** The Supabase Dashboard UI has changed. The "Reload schema" button may not be visible in newer versions. The SQL `NOTIFY` command is the most reliable method.

### Step 2: Test in Your Application

1. Go back to your application
2. Navigate to Organization Customization page
3. Try saving a customization
4. **SUCCESS**: You should see "Customization saved successfully!"
5. **STILL BROKEN**: Continue to advanced troubleshooting below

---

## 🔍 Verification Steps

### Verify in Supabase SQL Editor

Run these queries to confirm everything is set up correctly:

```sql
-- 1. Check if table exists
SELECT * FROM organization_ui_customizations LIMIT 1;
-- Should work without errors (even if empty)

-- 2. Check permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'organization_ui_customizations'
AND table_schema = 'public';
-- Should show: authenticated and service_role with permissions

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'organization_ui_customizations';
-- Should show: rowsecurity = true
```

### Verify in Browser Console

1. Open your application
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Paste and run:
   ```javascript
   const { data, error } = await window.supabase
     .from('organization_ui_customizations')
     .select('*')
     .limit(1);
   console.log({ data, error });
   ```
5. **Check result:**
   - ✅ `error = null` → Success!
   - ❌ `error.code = 'PGRST205'` → Cache still not reloaded
   - ⚠️ `error.code = 'PGRST116'` → Permission issue (but cache is working!)

---

## 🛠️ Advanced Troubleshooting

### Issue: Still Getting PGRST205 After Reload

**Try these in order:**

1. **Wait longer** (2-3 minutes)
   - Cache propagation can take time
   - Be patient

2. **Reload schema again**
   - Sometimes takes multiple attempts
   - Run the NOTIFY command 2-3 times

3. **Clear browser cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or try incognito/private window

4. **Check Supabase status**
   - Go to https://status.supabase.com
   - Verify no ongoing incidents

5. **Restart Supabase project** (last resort)
   - Settings → General
   - Click "Pause project"
   - Wait 30 seconds
   - Click "Resume project"
   - Wait 2-3 minutes
   - Test again

### Issue: Getting 403 Permission Denied

This is actually GOOD NEWS - it means the cache is working!

**Solutions:**

1. **Verify your role**
   ```javascript
   const { data: { user } } = await window.supabase.auth.getUser();
   const { data: profile } = await window.supabase
     .from('user_profiles')
     .select('role, organization_id')
     .eq('id', user.id)
     .single();
   console.log(profile);
   // role should be 'master_admin'
   ```

2. **Check RLS policies** (in SQL Editor)
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'organization_ui_customizations';
   ```

3. **Verify permissions** (in SQL Editor)
   Run the script in `FIX_PERMISSIONS_IF_NEEDED.sql`

### Issue: Different Error Code

- Note the exact error code and message
- Run the comprehensive diagnostic: `VERIFY_TABLE_STATUS.sql`
- Share results with Supabase support

---

## 📋 Complete Diagnostic Checklist

Use this to systematically check everything:

- [ ] Table exists in database (run `SELECT * FROM organization_ui_customizations LIMIT 1;`)
- [ ] RLS is enabled (should be `true`)
- [ ] RLS policies exist (should have 2 policies)
- [ ] Permissions granted to `authenticated` role
- [ ] Permissions granted to `service_role`
- [ ] Schema cache has been reloaded
- [ ] Waited at least 30 seconds after reload
- [ ] Browser cache cleared
- [ ] User is logged in as `master_admin`
- [ ] User belongs to an organization
- [ ] Environment variables are set correctly

---

## 📁 Helper Files Provided

1. **VERIFY_TABLE_STATUS.sql**
   - Comprehensive diagnostic queries
   - Run in Supabase SQL Editor
   - Shows complete table status

2. **RELOAD_SCHEMA_CACHE.sql**
   - Schema cache reload command
   - Simple one-line fix
   - Includes instructions

3. **FIX_PERMISSIONS_IF_NEEDED.sql**
   - Grants all necessary permissions
   - Only run if VERIFY shows permission issues
   - Safe to run multiple times

4. **BROWSER_CONSOLE_TESTS.js**
   - Test suite for browser console
   - Tests all aspects of table access
   - Copy/paste into F12 console

5. **SCHEMA_CACHE_FIX_GUIDE.md**
   - Detailed documentation
   - Explains why this happens
   - Prevention tips

---

## ⏱️ Expected Timeline

| Time | What's Happening |
|------|------------------|
| 0 sec | You run schema reload command |
| 5 sec | PostgREST receives notification |
| 15 sec | Cache begins reloading |
| 30 sec | Cache reload complete |
| 60 sec | All changes fully propagated |

**Total time: 30-60 seconds typically**

---

## ✅ Success Indicators

You'll know it's fixed when:

- ✅ No PGRST205 errors in browser console
- ✅ "Customization saved successfully!" alert appears
- ✅ Network tab shows 200 or 201 status (not 404)
- ✅ Data persists after save
- ✅ Version history entries are created
- ✅ Can switch between verticals successfully

---

## 🎯 Most Likely Solution

**99% of the time, the solution is:**

1. Go to Supabase Dashboard → SQL Editor
2. Run: `NOTIFY pgrst, 'reload schema';`
3. Wait 60 seconds
4. Test your application
5. Done! ✨

**Note:** In newer Supabase versions, the Dashboard "Reload schema" button may not be visible. The SQL command is the most reliable method.

---

## 💡 Why This Happens

This is **normal behavior** when using Supabase:

- You created tables via migrations (within last 24 hours)
- Migrations run against PostgreSQL directly
- PostgREST caches the schema for performance
- Cache doesn't auto-refresh immediately
- Manual reload is required for new tables
- **This is not a bug** - it's by design

---

## 🔮 Prevention for Future

After applying migrations that create/modify tables:

1. Always reload schema cache
2. Add to your deployment checklist
3. Wait before testing new tables
4. Consider automating with CI/CD

---

## 📞 Need More Help?

If none of this works:

1. Run **VERIFY_TABLE_STATUS.sql** in Supabase SQL Editor
2. Run **BROWSER_CONSOLE_TESTS.js** in browser console
3. Take screenshots of all errors
4. Note exact error codes and messages
5. Check Supabase status: https://status.supabase.com
6. Contact Supabase support with:
   - Error code: PGRST205
   - Table name: organization_ui_customizations
   - When migrations were run
   - All diagnostic results

---

## 🎉 Once Fixed

Remember to:

- Document this in your project notes
- Add schema reload to deployment checklist
- Share solution with team members
- Consider adding to README

---

**Good luck! This should be a quick fix. 🚀**

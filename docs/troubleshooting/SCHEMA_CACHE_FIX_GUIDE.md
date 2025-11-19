# Fix Supabase Schema Cache Issue - organization_ui_customizations

## Problem
Error: PGRST205 - "Could not find the table 'public.organization_ui_customizations' in the schema cache"

The table exists in PostgreSQL but PostgREST's API cache hasn't been refreshed.

## Quick Fix (5 minutes)

### Method 1: Supabase Dashboard (RECOMMENDED)

1. **Log into Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to API Settings**
   - Click "Settings" (gear icon) in left sidebar
   - Click "API" section
   - Scroll down to "Schema Cache" section

3. **Reload Schema**
   - Click "Reload schema" button
   - Wait 15-30 seconds
   - You should see a success message

4. **Test in Your Application**
   - Go to Organization Customization page
   - Try saving a customization
   - Should now work without errors

### Method 2: SQL Command (ALTERNATIVE)

1. **Open Supabase SQL Editor**
   - Go to "SQL Editor" in Supabase Dashboard
   - Click "New query"

2. **Run Schema Reload Command**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Wait and Test**
   - Wait 15-30 seconds
   - Test the customization save functionality

---

## Verification Steps

### Step 1: Verify Table Exists

Run in Supabase SQL Editor:

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'organization_ui_customizations'
) AS table_exists;

-- Should return: table_exists = true
```

### Step 2: Check Table Structure

```sql
-- View all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organization_ui_customizations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Should show: id, organization_id, vertical_id, dashboard_config, etc.
```

### Step 3: Verify RLS is Enabled

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'organization_ui_customizations';

-- Should return: rowsecurity = true
```

### Step 4: Check RLS Policies

```sql
-- View RLS policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'organization_ui_customizations';

-- Should show 2 policies:
-- - "Master admins can manage organization customizations" (ALL)
-- - "Organization members can view customizations" (SELECT)
```

### Step 5: Verify Permissions

```sql
-- Check role permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'organization_ui_customizations'
AND table_schema = 'public'
ORDER BY grantee;

-- Should show:
-- - authenticated: ALL
-- - service_role: ALL
```

---

## Browser Console Tests

### Test 1: Check Table Accessibility

Open browser console (F12) on your application and run:

```javascript
// Test if table is accessible via API
const { data, error } = await window.supabase
  .from('organization_ui_customizations')
  .select('*')
  .limit(1);

console.log('Test Result:', { data, error });

// SUCCESS: data = [] or data = [object] (no error)
// STILL BROKEN: error.code = 'PGRST205'
```

### Test 2: Check Network Requests

1. Open Developer Tools → Network tab
2. Try saving a customization
3. Look for request to `organization_ui_customizations`
4. Check status code:
   - ❌ 404 = Schema cache not refreshed yet
   - ❌ 403 = Permission issue
   - ✅ 200/201 = Success!

---

## Troubleshooting

### Issue: Still getting PGRST205 after reload

**Solutions:**
1. Wait 2-3 minutes (cache propagation can take time)
2. Reload schema again (sometimes takes multiple attempts)
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
4. Clear browser cache completely
5. Try in incognito/private window

### Issue: Getting 403 Permission Denied instead

**Solutions:**
1. Verify you're logged in as master_admin
2. Check RLS policies are correct
3. Run the permission verification queries above
4. Ensure your user profile has correct role

### Issue: Schema reload button not visible

**Solutions:**
1. Use SQL method: `NOTIFY pgrst, 'reload schema';`
2. Check you have appropriate permissions in Supabase Dashboard
3. Try Settings → Database instead of Settings → API

### Issue: Still broken after 10+ minutes

**Last Resort - Restart Supabase Services:**
1. Go to Supabase Dashboard → Settings → General
2. Click "Pause project"
3. Wait 30 seconds
4. Click "Resume project"
5. Wait 2-3 minutes for full initialization
6. Test again

---

## Expected Success Indicators

After successful fix, you should see:

- ✅ No more PGRST205 errors in browser console
- ✅ "Customization saved successfully!" alert appears
- ✅ Data persists in database after save
- ✅ Version history entries are created
- ✅ Network tab shows 200/201 status codes (not 404)
- ✅ Can switch between verticals without issues
- ✅ Export/Import functionality works

---

## Why This Happens

This is normal behavior when using Supabase with Bolt:

1. **Migrations run against PostgreSQL directly** - Your table is created in the database
2. **PostgREST caches schema** - The API layer doesn't know about new tables immediately
3. **Cache doesn't auto-refresh** - You must manually trigger reload after DDL changes
4. **Not a bug** - This is by design for performance reasons

---

## Prevention for Future

**After applying new migrations that create tables:**
1. Always reload schema cache in Supabase Dashboard
2. Or run `NOTIFY pgrst, 'reload schema';` in SQL Editor
3. Wait 30 seconds before testing new tables
4. Document this step in your deployment process

---

## Need Help?

If issues persist after following this guide:
1. Check Supabase status page: https://status.supabase.com
2. Verify your Supabase plan supports your table count
3. Contact Supabase support with this error code: PGRST205
4. Share migration timestamps and table name with support

---

## Quick Reference Commands

```sql
-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify table exists
SELECT * FROM organization_ui_customizations LIMIT 1;

-- Check permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'organization_ui_customizations';

-- View RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'organization_ui_customizations';
```

---

**Time to fix: 5 minutes**
**Difficulty: Easy**
**Success rate: 99%**

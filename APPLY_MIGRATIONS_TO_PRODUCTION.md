# Apply Migrations to Production Database

## URGENT: Missing Tables in Production Database

**Issue:** The `organization_ui_customizations` table does not exist in production database `abgtunvbbtlhsjphsvqq.supabase.co`, causing "Failed to save customization" errors.

**Root Cause:** Migration files exist in codebase but have never been applied to production database.

---

## STEP 1: Apply Missing Migrations

### Migration 1: Create Organization UI Customizations Tables

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select project: `abgtunvbbtlhsjphsvqq`
3. Click **SQL Editor** in left sidebar
4. Click **New query** button
5. Copy the entire contents of file: `supabase/migrations/20251118234312_create_organization_ui_customizations.sql`
6. Paste into SQL Editor
7. Click **Run** button
8. Wait for success message (should complete in 2-3 seconds)

**Expected Output:**
- No errors
- Message: "Success. No rows returned"
- This creates 2 tables, 6 indexes, 4 RLS policies, 1 trigger, and 1 function

### Migration 2: Add Customization History Retention

1. In same SQL Editor, click **New query**
2. Copy contents of file: `supabase/migrations/20251118234343_add_customization_history_retention.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Wait for success message

**Expected Output:**
- Creates 2 new functions for history retention and cleanup
- No errors should occur

### Migration 3: Add Enhanced Retention Policies

1. Click **New query** again
2. Copy contents of file: `supabase/migrations/20251119163507_add_customization_history_retention.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Wait for success message

**Expected Output:**
- Updates retention functions
- Adds automatic cleanup scheduling
- No errors should occur

---

## STEP 2: Reload PostgREST Schema Cache

**CRITICAL:** PostgREST caches the database schema. After creating new tables, you MUST reload the cache.

1. In Supabase SQL Editor, click **New query**
2. Type or paste: `NOTIFY pgrst, 'reload schema';`
3. Click **Run**
4. **WAIT 60 SECONDS** for cache to fully reload
5. Do not test application until 60 seconds have passed

**Why This Is Required:**
- PostgREST caches schema for performance
- New tables are not visible to API until cache reloads
- Cache reload is not automatic
- This is normal Supabase behavior, not a bug

---

## STEP 3: Verify Migration Success

### Quick Verification (SQL Editor)

Run these queries in SQL Editor to confirm everything worked:

```sql
-- 1. Confirm table exists
SELECT COUNT(*) as table_exists
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'organization_ui_customizations';
-- Expected: table_exists = 1

-- 2. Confirm RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'organization_ui_customizations';
-- Expected: rowsecurity = true

-- 3. Count RLS policies
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'organization_ui_customizations';
-- Expected: policy_count = 2

-- 4. Check permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'organization_ui_customizations'
  AND grantee IN ('authenticated', 'service_role')
ORDER BY grantee, privilege_type;
-- Expected: Both roles have multiple privileges including SELECT, INSERT, UPDATE, DELETE

-- 5. Test table access
SELECT * FROM organization_ui_customizations LIMIT 1;
-- Expected: No errors (result may be empty, that's OK)
```

### Comprehensive Verification

For detailed diagnostics, run the script: `VERIFY_TABLE_STATUS.sql`

This will check:
- Table existence
- Column structure
- RLS status
- Policy definitions
- Permissions
- Indexes
- Constraints
- Triggers
- Functions

---

## STEP 4: Test in Application

1. Open your deployed application in browser
2. Log in as a master admin user
3. Navigate to: **Settings** → **Organization Customization**
4. Open browser DevTools (press F12)
5. Go to **Console** tab
6. Make any change in the customization interface
7. Click **Save** button

**Expected Results:**
- ✅ Success message appears: "Customization saved successfully!"
- ✅ No errors in browser console
- ✅ Network tab shows HTTP 200 or 201 response (not 404)
- ✅ Changes persist after page refresh

**If You Still See Errors:**
- Wait another 60 seconds (cache propagation can be slow)
- Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Try incognito/private browsing window
- Clear browser cache completely
- Check Network tab for the actual error response

---

## STEP 5: Verify All Features Work

Test each customization tab:

1. **Dashboard Tab**
   - Change layout settings
   - Click Save
   - Verify changes persist

2. **Stats Tab**
   - Modify stat card configurations
   - Click Save
   - Refresh and confirm

3. **Departments Tab**
   - Edit department visibility
   - Click Save
   - Verify settings saved

4. **Branding Tab**
   - Update color schemes
   - Click Save
   - Confirm changes persist

5. **History Tab**
   - View version history
   - Confirm history entries appear
   - Test rollback if needed

---

## Common Issues and Solutions

### Issue: "PGRST205 - table not found in schema cache"

**Solution:**
- Run schema reload again: `NOTIFY pgrst, 'reload schema';`
- Wait full 60 seconds
- Try again

### Issue: "PGRST116 - permission denied"

**Solution:**
- This means cache IS working (good!)
- Check your user role is 'master_admin'
- Verify you're logged into correct organization
- Run permission verification queries from Step 3

### Issue: SQL errors when applying migrations

**Solutions:**
- Check if tables already exist: `\dt organization_ui_customizations`
- If exists, migrations were already applied
- Skip to Step 2 (reload schema cache)
- If partial failure, note the specific error and check what succeeded

### Issue: Changes don't persist

**Solutions:**
- Check browser console for errors
- Verify Network tab shows successful response
- Confirm user has master_admin role
- Check Supabase logs for RLS policy issues

---

## IMPORTANT: One-Time Operation

These migrations only need to be applied **ONCE** to the production database.

After successful application:
- Tables will exist permanently
- Future deployments don't need to re-run these migrations
- New migrations will need to be applied using same process

---

## Future Migration Process

**Current State:** Migrations are manual (no automation)

**Recommended Process:**

1. **After adding new migration files:**
   - Log into Supabase Dashboard
   - Apply migration SQL manually
   - Reload schema cache
   - Test application

2. **For automated migrations:**
   - See guide: `MIGRATION_AUTOMATION_SETUP.md`
   - Install Supabase CLI
   - Configure project linking
   - Use `supabase db push` command

---

## Verification Checklist

After completing all steps, verify:

- [ ] Migration 1 applied successfully
- [ ] Migration 2 applied successfully
- [ ] Migration 3 applied successfully
- [ ] Schema cache reloaded
- [ ] Waited 60 seconds for propagation
- [ ] Table exists query returns 1
- [ ] RLS is enabled (true)
- [ ] 2 policies exist
- [ ] Permissions granted to authenticated and service_role
- [ ] Test query runs without errors
- [ ] Application loads customization page
- [ ] No PGRST205 errors in console
- [ ] Save button works
- [ ] Success message appears
- [ ] Changes persist after refresh
- [ ] All tabs function correctly
- [ ] Version history tracks changes

---

## Timeline

- **Step 1 (Migrations):** 5 minutes
- **Step 2 (Cache Reload):** 2 minutes
- **Step 3 (Verification):** 3 minutes
- **Step 4 (App Testing):** 5 minutes
- **Total Time:** ~15 minutes

---

## Support

If issues persist after following this guide:

1. Run comprehensive diagnostics: `VERIFY_TABLE_STATUS.sql`
2. Check Supabase Dashboard Logs section
3. Take screenshots of any errors
4. Note exact error codes and messages
5. Verify you're connected to correct database: `abgtunvbbtlhsjphsvqq`

---

## Success Confirmation

You'll know everything is working when:

✅ No PGRST205 errors
✅ Customization page loads without errors
✅ Save button shows success message
✅ Network requests return 200/201
✅ Data persists in database
✅ Version history appears
✅ All tabs functional

**Once confirmed, you can proceed with normal application usage!**

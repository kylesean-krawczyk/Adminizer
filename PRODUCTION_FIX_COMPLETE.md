# Production Database Fix - Complete

## Issue Resolved

The organization customization feature was failing with error code **PGRST205** because the required database tables did not exist in your production Supabase instance (`abgtunvbbtlhsjphsvqq.supabase.co`).

---

## What Was Fixed

### 1. Database Tables Created
- ✅ `organization_ui_customizations` - Stores customization configs per organization and vertical
- ✅ `organization_customization_history` - Tracks version history of changes

### 2. Security Configured
- ✅ Row Level Security (RLS) enabled on both tables
- ✅ RLS policies created for master admin management
- ✅ RLS policies created for member read access
- ✅ Proper permissions granted to authenticated and service_role users

### 3. Functions and Triggers
- ✅ `auto_cleanup_old_customization_versions()` - Auto-cleanup of old versions
- ✅ `cleanup_customization_history_manual()` - Manual cleanup RPC
- ✅ `get_customization_retention_summary()` - Retention summary helper
- ✅ `update_organization_customization_timestamp()` - Auto-update timestamps
- ✅ Triggers configured for automatic operations

### 4. Schema Cache Reloaded
- ✅ PostgREST schema cache has been reloaded
- ✅ API endpoints will now recognize the new tables

---

## Testing the Fix

### Step 1: Wait 60 Seconds
The schema cache reload takes 30-60 seconds to fully propagate. Please wait before testing.

### Step 2: Test in Browser
1. Open your application
2. Log in as a master admin
3. Navigate to **Settings → Organization Customization**
4. Try to save a customization change
5. **Expected Result:** Success message "Customization saved successfully!"

### Step 3: Verify in Console (Optional)
Open browser Developer Tools (F12) and check:
- Console tab should show no PGRST205 errors
- Network tab should show successful requests (200/201) to `/rest/v1/organization_ui_customizations`

---

## Environment Configuration

Your application uses different environment files for different modes:

| File | Purpose | Database URL |
|------|---------|--------------|
| `.env` | Development | ntwkmyhwvxikfesrvuox (deleted) |
| `.env.production` | Production | abgtunvbbtlhsjphsvqq ✅ |
| `.env.demo` | Demo mode | abgtunvbbtlhsjphsvqq ✅ |

The fix was applied to the **production** database (`abgtunvbbtlhsjphsvqq`) which is the active instance.

---

## How to Apply Migrations in the Future

### Method 1: Supabase SQL Editor (Recommended)
1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the **entire** migration SQL file
4. Paste it as one complete script
5. Click **Run** once
6. Wait for success confirmation

### Method 2: Reload Schema Cache
After any migration that creates or modifies tables:
1. In Supabase SQL Editor, run: `NOTIFY pgrst, 'reload schema';`
2. Wait 60 seconds
3. Test your application

**Important:** The Supabase Dashboard UI has changed. The "Reload schema" button under API settings may not be visible in newer versions. Use the SQL `NOTIFY` command instead.

---

## Troubleshooting

### If You Still See PGRST205 Errors

1. **Wait longer** - Cache propagation can take up to 2 minutes
2. **Clear browser cache** - Hard refresh with Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. **Try incognito mode** - Test in a private browsing window
4. **Reload schema again** - Run the NOTIFY command a second time
5. **Check network tab** - Verify requests are going to the correct Supabase URL

### If You See Different Errors

- **403 Forbidden** - This is actually good! It means the cache is working, but your user role needs verification
- **401 Unauthorized** - Log out and log back in as master admin
- **Other errors** - Check browser console for specific error messages

### Verify Database Setup
Run this query in Supabase SQL Editor to check everything:

```sql
-- Quick verification
SELECT
  'Tables exist' as check,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_name IN ('organization_ui_customizations', 'organization_customization_history')
  AND table_schema = 'public';
-- Should return count: 2

-- Test table access
SELECT * FROM organization_ui_customizations LIMIT 1;
-- Should work without errors (empty result is fine)
```

---

## Console Test Script

If you need to test in the browser console, paste this:

```javascript
// Test organization customization table access
const testCustomization = async () => {
  console.log('Testing organization_ui_customizations table...');

  const { data, error } = await window.supabase
    .from('organization_ui_customizations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.code, error.message);
  } else {
    console.log('✅ Success! Table is accessible');
    console.log('Data:', data);
  }
};

testCustomization();
```

---

## Success Indicators

You'll know everything is working when:

- ✅ No PGRST205 errors in browser console
- ✅ Network requests return 200/201 instead of 404
- ✅ Success message appears when saving customizations
- ✅ Changes persist after page refresh
- ✅ Can switch between verticals (church, business, estate)
- ✅ Version history is tracked
- ✅ All customization tabs load without errors

---

## What to Do Next

1. **Test the feature** - Try customizing your organization settings
2. **Verify persistence** - Refresh the page and check if changes saved
3. **Test all verticals** - Switch between church, business, and estate modes
4. **Check version history** - View the history tab to see tracked changes
5. **Export/import** - Test the export and import functionality

---

## Database Schema Details

### organization_ui_customizations Table
- **Purpose:** Stores UI customization per organization and vertical
- **Key columns:** organization_id, vertical_id, dashboard_config, navigation_config, branding_config, stats_config, department_config
- **Unique constraint:** One config per (organization_id, vertical_id)
- **RLS:** Master admins can manage, members can view

### organization_customization_history Table
- **Purpose:** Tracks complete version history of all changes
- **Retention policy:**
  - Keep last 20 versions always
  - Keep all versions from last 90 days
  - Keep milestone versions indefinitely
  - Auto-delete older versions outside these rules
- **RLS:** Master admins can manage, members can view

---

## Summary

The database migration has been successfully applied to your production Supabase instance. All tables, functions, triggers, and security policies are in place. The PostgREST schema cache has been reloaded.

**Your organization customization feature should now work correctly!**

Wait 60 seconds after reading this, then test the feature in your application. If you encounter any issues, refer to the troubleshooting section above.

---

**Migration Applied:** November 19, 2025
**Database:** abgtunvbbtlhsjphsvqq.supabase.co
**Status:** ✅ Complete

# Quick Test Guide - Organization Customization Feature

## ✅ Database Setup Complete

All required database objects have been successfully created in your production Supabase instance (`abgtunvbbtlhsjphsvqq.supabase.co`):

- Tables: `organization_ui_customizations`, `organization_customization_history`
- RLS policies configured
- Functions and triggers installed
- Schema cache reloaded

---

## 🧪 Test in 3 Steps

### Step 1: Wait 60 Seconds (IMPORTANT!)
The PostgREST schema cache reload takes 30-60 seconds to fully propagate. Please wait before testing.

⏰ **Current time when fix was applied:** Check file timestamp of `PRODUCTION_FIX_COMPLETE.md`

### Step 2: Test in Your Application

1. Open your application in the browser
2. Log in as a **master admin** user
3. Navigate to **Settings → Organization Customization**
4. Make a small change (e.g., change a dashboard title)
5. Click **Save**

**Expected Result:**
- ✅ Success message: "Customization saved successfully!"
- ✅ No errors in browser console
- ✅ Changes persist after page refresh

### Step 3: Verify in Browser Console (Optional)

Press **F12** to open Developer Tools, go to **Console** tab, and paste:

```javascript
// Test 1: Check table access
const testAccess = async () => {
  console.log('🧪 Testing organization_ui_customizations...');

  const { data, error } = await window.supabase
    .from('organization_ui_customizations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.code, error.message);
    if (error.code === 'PGRST205') {
      console.log('⏰ Cache not reloaded yet. Wait 30 more seconds and try again.');
    }
  } else {
    console.log('✅ Success! Table is accessible');
    console.log('📊 Data:', data);
  }
};

testAccess();
```

---

## 🔍 What to Look For

### In Browser Console
- **No PGRST205 errors** - Table is recognized
- **No 404 errors** - API endpoints are working
- Console logs show successful table access

### In Network Tab (F12 → Network)
- Requests to `/rest/v1/organization_ui_customizations` return **200** or **201** status
- No **404** errors on customization endpoints

### In Application UI
- Success message appears when saving
- Customizations persist after page refresh
- Can switch between verticals (church, business, estate)
- Version history tab shows saved changes

---

## 🐛 Troubleshooting

### Still Getting PGRST205 Error?

1. **Wait longer** - Cache can take up to 2 minutes
2. **Clear browser cache** - Hard refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Try incognito mode** - Test in a private browsing window
4. **Reload schema again** - Run in SQL Editor:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
5. **Check Supabase URL** - Verify network requests go to `abgtunvbbtlhsjphsvqq.supabase.co`

### Getting 403 Forbidden Error?

This is actually good! It means the cache is working. The issue is permissions:

1. **Verify you're logged in as master admin:**
   ```javascript
   const { data: { user } } = await window.supabase.auth.getUser();
   const { data: profile } = await window.supabase
     .from('user_profiles')
     .select('role, is_active, organization_id')
     .eq('id', user.id)
     .single();
   console.log('User role:', profile.role); // Should be 'master_admin'
   console.log('Is active:', profile.is_active); // Should be true
   ```

2. **Re-login** - Log out and log back in

### Getting Other Errors?

Check browser console for specific error messages and refer to `PRODUCTION_FIX_COMPLETE.md` for detailed troubleshooting.

---

## 📊 Verify Database Directly

You can verify the tables exist in Supabase SQL Editor:

```sql
-- Quick health check
SELECT
  'organization_ui_customizations' as table_name,
  COUNT(*) as row_count
FROM organization_ui_customizations
UNION ALL
SELECT
  'organization_customization_history' as table_name,
  COUNT(*) as row_count
FROM organization_customization_history;
```

Should execute without errors (counts can be 0 if no data yet).

---

## 🎯 Success Checklist

- [ ] Waited 60 seconds after schema cache reload
- [ ] Logged in as master admin user
- [ ] Navigated to Organization Customization page
- [ ] Made a change and clicked Save
- [ ] Saw "Customization saved successfully!" message
- [ ] No PGRST205 errors in console
- [ ] Changes persist after page refresh
- [ ] Can switch between verticals
- [ ] Version history shows the change

---

## 📁 Reference Documents

- **PRODUCTION_FIX_COMPLETE.md** - Complete fix details and troubleshooting
- **STEP_BY_STEP_FIX.md** - Updated with correct schema reload instructions
- **VERIFY_TABLE_STATUS.sql** - Comprehensive database diagnostics
- **BROWSER_CONSOLE_TESTS.js** - Full test suite for browser

---

## 🆘 Still Need Help?

If the feature still doesn't work after following all steps:

1. Run `VERIFY_TABLE_STATUS.sql` in Supabase SQL Editor
2. Run the console test script above
3. Check browser Network tab for exact error responses
4. Note the exact error codes and messages
5. Check which Supabase URL appears in network requests
6. Share all diagnostic results for further assistance

---

**The database is ready. Please test and report back!** 🚀

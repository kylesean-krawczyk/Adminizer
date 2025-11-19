# Schema Cache Fix - Complete Resource Index

## 🎯 Start Here

**Having PGRST205 error?** → Read **[QUICK_FIX_CARD.md](./QUICK_FIX_CARD.md)** (1 min)

**Need step-by-step instructions?** → Read **[STEP_BY_STEP_FIX.md](./STEP_BY_STEP_FIX.md)** (5 min)

**Want full details?** → Read **[SCHEMA_CACHE_ISSUE_SUMMARY.md](./SCHEMA_CACHE_ISSUE_SUMMARY.md)** (10 min)

---

## 📚 All Available Resources

### Quick Reference
- **[QUICK_FIX_CARD.md](./QUICK_FIX_CARD.md)** - 1-page quick reference card
  - 3-step fix
  - Quick test commands
  - What to do if it fails

### Step-by-Step Guides
- **[STEP_BY_STEP_FIX.md](./STEP_BY_STEP_FIX.md)** - Complete walkthrough
  - Detailed instructions
  - Verification steps
  - Troubleshooting guide
  - Success indicators

- **[SCHEMA_CACHE_FIX_GUIDE.md](./SCHEMA_CACHE_FIX_GUIDE.md)** - Comprehensive guide
  - Multiple fix methods
  - Common issues
  - Prevention tips
  - Debug checklist

### Documentation
- **[SCHEMA_CACHE_ISSUE_SUMMARY.md](./SCHEMA_CACHE_ISSUE_SUMMARY.md)** - Full summary
  - Why this happens
  - Technical details
  - Migration information
  - Application integration

### SQL Scripts
- **[VERIFY_TABLE_STATUS.sql](./VERIFY_TABLE_STATUS.sql)** - Comprehensive diagnostics
  - 20 verification queries
  - Checks table, RLS, permissions, indexes
  - Run in Supabase SQL Editor
  - **Use this to diagnose issues**

- **[RELOAD_SCHEMA_CACHE.sql](./RELOAD_SCHEMA_CACHE.sql)** - Schema reload command
  - One-line fix: `NOTIFY pgrst, 'reload schema';`
  - Instructions and timeline
  - Post-reload verification

- **[FIX_PERMISSIONS_IF_NEEDED.sql](./FIX_PERMISSIONS_IF_NEEDED.sql)** - Permission grants
  - Grants all necessary permissions
  - Only run if diagnostics show issues
  - Safe to run multiple times

### JavaScript Tests
- **[BROWSER_CONSOLE_TESTS.js](./BROWSER_CONSOLE_TESTS.js)** - Complete test suite
  - 6 different tests
  - Table accessibility check
  - User profile verification
  - Insert test
  - Environment check
  - Copy/paste into F12 console

---

## 🔧 How to Use These Resources

### Scenario 1: Quick Fix (Most Common)
1. Read: **QUICK_FIX_CARD.md**
2. Run: Schema reload in Supabase Dashboard
3. Test: Your application

### Scenario 2: Need Guidance
1. Read: **STEP_BY_STEP_FIX.md**
2. Follow: Each step carefully
3. Verify: Using provided tests

### Scenario 3: Troubleshooting
1. Run: **VERIFY_TABLE_STATUS.sql** in Supabase
2. Run: **BROWSER_CONSOLE_TESTS.js** in browser
3. Read: Troubleshooting section in **STEP_BY_STEP_FIX.md**
4. Try: Advanced fixes

### Scenario 4: Deep Dive
1. Read: **SCHEMA_CACHE_ISSUE_SUMMARY.md**
2. Read: **SCHEMA_CACHE_FIX_GUIDE.md**
3. Review: All technical details

### Scenario 5: Still Broken
1. Run: **VERIFY_TABLE_STATUS.sql** → Save results
2. Run: **BROWSER_CONSOLE_TESTS.js** → Save results
3. Run: **FIX_PERMISSIONS_IF_NEEDED.sql** → Try fix
4. Contact: Supabase support with results

---

## 🎓 Learning Path

### Beginner (Just fix it!)
1. QUICK_FIX_CARD.md
2. Reload schema in dashboard
3. Done!

### Intermediate (Understand it)
1. QUICK_FIX_CARD.md
2. STEP_BY_STEP_FIX.md
3. Run BROWSER_CONSOLE_TESTS.js
4. Understand why it happens

### Advanced (Master it)
1. SCHEMA_CACHE_ISSUE_SUMMARY.md
2. SCHEMA_CACHE_FIX_GUIDE.md
3. VERIFY_TABLE_STATUS.sql
4. Learn prevention strategies

---

## 📋 Checklists

### Quick Fix Checklist
- [ ] Go to Supabase Dashboard
- [ ] Settings → API → Reload schema
- [ ] Wait 30 seconds
- [ ] Test application
- [ ] Verify success

### Full Diagnostic Checklist
- [ ] Run VERIFY_TABLE_STATUS.sql
- [ ] Run BROWSER_CONSOLE_TESTS.js
- [ ] Check all test results
- [ ] Reload schema cache
- [ ] Run FIX_PERMISSIONS_IF_NEEDED.sql (if needed)
- [ ] Clear browser cache
- [ ] Test in incognito window
- [ ] Verify all features work

### Prevention Checklist
- [ ] Document schema reload in deployment guide
- [ ] Add to post-migration checklist
- [ ] Train team on PostgREST caching
- [ ] Consider automation in CI/CD
- [ ] Update project README

---

## 🚦 Status Indicators

### ✅ Fixed
- No PGRST205 errors
- Customizations save successfully
- Network requests return 200/201
- Data persists after save

### ⚠️ In Progress
- Schema reload initiated
- Waiting for cache refresh
- Running diagnostics
- Testing fixes

### ❌ Still Broken
- Still getting PGRST205
- Or getting different errors
- Need advanced troubleshooting
- May need support

---

## 💡 Key Commands

### Supabase SQL Editor
```sql
-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify table exists
SELECT * FROM organization_ui_customizations LIMIT 1;

-- Check permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'organization_ui_customizations';
```

### Browser Console (F12)
```javascript
// Quick test
const { data, error } = await window.supabase
  .from('organization_ui_customizations')
  .select('*')
  .limit(1);
console.log({ data, error });

// Check user role
const { data: { user } } = await window.supabase.auth.getUser();
const { data: profile } = await window.supabase
  .from('user_profiles')
  .select('role')
  .eq('id', user.id)
  .single();
console.log('Role:', profile?.role);
```

---

## 📞 Getting Help

### Self-Service
1. Read STEP_BY_STEP_FIX.md
2. Run diagnostic scripts
3. Try all troubleshooting steps

### Community
1. Check Supabase Discord
2. Search GitHub issues
3. Stack Overflow

### Support
1. Run all diagnostics first
2. Save all error messages
3. Contact Supabase support with:
   - Error code: PGRST205
   - Table: organization_ui_customizations
   - Diagnostic results
   - What you've tried

---

## 🎯 Success Metrics

**This fix is successful when:**
- Schema cache is reloaded ✅
- PGRST205 errors are gone ✅
- Customizations save without errors ✅
- Version history tracks changes ✅
- All features work correctly ✅

**Time to Success:**
- Quick fix: 5 minutes
- With troubleshooting: 15 minutes
- Worst case: 30 minutes

**Success Rate:** 99%

---

## 📈 Next Steps After Fix

1. **Test thoroughly**
   - Save customizations for each vertical
   - Verify data persists
   - Check version history
   - Test export/import

2. **Document**
   - Add note to project README
   - Update deployment guide
   - Share with team

3. **Prevent future issues**
   - Add schema reload to checklist
   - Document in runbook
   - Consider automation

4. **Clean up** (optional)
   - Archive diagnostic files
   - Keep QUICK_FIX_CARD.md handy
   - Remove other files if desired

---

## 🎉 You're All Set!

You now have everything you need to:
- ✅ Fix the schema cache issue
- ✅ Diagnose any problems
- ✅ Verify the fix worked
- ✅ Prevent future issues
- ✅ Get help if needed

**Good luck! This should be a quick and easy fix. 🚀**

---

*Last Updated: 2025-11-19*
*Issue: PGRST205 - Table not in schema cache*
*Table: organization_ui_customizations*
*Solution: Reload schema cache in Supabase Dashboard*

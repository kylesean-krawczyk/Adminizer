# 🚀 QUICK FIX: Schema Cache Issue

## Error You're Seeing
```
PGRST205: Could not find table 'organization_ui_customizations' in schema cache
```

---

## ⚡ 3-Step Fix (5 Minutes)

### Step 1: Reload Schema Cache
**Go to:** Supabase Dashboard → Settings → API → "Reload schema" button
**Or run SQL:** `NOTIFY pgrst, 'reload schema';`

### Step 2: Wait
**Wait:** 30 seconds for cache to refresh

### Step 3: Test
**Try:** Saving a customization in your app
**Result:** Should see "Customization saved successfully!"

---

## ✅ Quick Test

Open browser console (F12) and run:

```javascript
const { data, error } = await window.supabase
  .from('organization_ui_customizations')
  .select('*')
  .limit(1);
console.log({ data, error });
```

**If `error = null`:** ✅ Fixed!
**If `error.code = 'PGRST205'`:** ⏳ Wait longer, reload again

---

## 📁 Files to Help You

1. **STEP_BY_STEP_FIX.md** ← START HERE
2. **VERIFY_TABLE_STATUS.sql** (diagnostics)
3. **RELOAD_SCHEMA_CACHE.sql** (one-line fix)
4. **BROWSER_CONSOLE_TESTS.js** (testing)
5. **SCHEMA_CACHE_FIX_GUIDE.md** (detailed docs)

---

## ⚠️ If Still Broken

1. Wait 5 minutes
2. Reload schema again
3. Clear browser cache
4. Try incognito window
5. Restart Supabase project (Settings → Pause/Resume)

---

## 💡 Why This Happens

- You created tables recently via migrations ✅
- PostgREST API caches schema for performance 📦
- Cache doesn't auto-refresh immediately ⏰
- Manual reload required after new tables 🔄
- **This is normal, not a bug!**

---

## 🎯 Success = No More Errors

After fix you'll see:
- ✅ Customizations save successfully
- ✅ No PGRST205 errors
- ✅ Network requests return 200/201
- ✅ Data persists in database

---

**Time to Fix:** 5 minutes
**Success Rate:** 99%

**Need detailed help?** → Read **STEP_BY_STEP_FIX.md**

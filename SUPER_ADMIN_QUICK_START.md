# Super Admin Quick Start

**⚡ Fast track guide to create your super admin user in 5 minutes**

---

## 📋 What You Need

- Supabase Dashboard access
- Database with `organizations` and `user_profiles` tables
- 5 minutes of time

---

## 🚀 Quick Steps

### 1. Update Email in Script (30 seconds)

Open `CREATE_SUPER_ADMIN.sql` and change line 57:

```sql
v_admin_email text := 'YOUR-EMAIL@domain.com';  -- ⚠️ CHANGE THIS
```

### 2. Run Creation Script (1 minute)

1. Go to: https://supabase.com/dashboard
2. Select your project → **SQL Editor** → **New query**
3. Copy ALL of `CREATE_SUPER_ADMIN.sql`
4. Paste and click **Run**
5. Check **Messages** tab for success

Expected output:
```
✓✓✓ SUCCESS! Super Admin User Created! ✓✓✓
Email: your-email@domain.com
Password: TempPassword123!
```

### 3. Grant Full Access (1 minute)

1. Click **New query** again
2. Copy ALL of `UPDATE_RLS_POLICIES.sql`
3. Paste and click **Run**
4. Check **Messages** tab for success

Expected output:
```
✓✓✓ SUCCESS! All Super Admin Policies Created! ✓✓✓
Total super admin policies created: 16
```

### 4. Login (1 minute)

1. Go to your app login page
2. Email: `your-email@domain.com`
3. Password: `TempPassword123!`
4. Click **Login**

### 5. Change Password (2 minutes)

1. Go to **Settings** → **Change Password**
2. Current: `TempPassword123!`
3. New: Your strong password
4. Save changes

---

## ✅ Verification Checklist

After login, verify:

- [ ] Your name/email appears in top right
- [ ] Role badge shows "Master Admin" or "master_admin"
- [ ] Can access **User Management** page
- [ ] Can access **Settings** page
- [ ] Can view all documents
- [ ] Password has been changed

---

## 🎯 What You'll See

### Navigation Bar (Top Right)
```
👤 Your Name
   your-email@domain.com [Master Admin]
```

### Dashboard Access
- ✅ User Management
- ✅ Organization Settings
- ✅ Document Management
- ✅ System Settings
- ✅ All Departments

---

## ⚠️ Important Security Notes

1. **Change the password immediately** - `TempPassword123!` is temporary
2. **Use a strong password** - 12+ characters, mixed case, numbers, symbols
3. **Keep credentials secure** - Don't share super admin access
4. **Monitor access** - Review user activities regularly

---

## 🐛 Quick Troubleshooting

| Problem | Quick Fix |
|---------|----------|
| Can't login | Check email spelling, use exact password |
| Access denied | Re-run `UPDATE_RLS_POLICIES.sql` |
| User exists | Script will update existing user to master_admin |
| No organization | Check organizations table exists |

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `CREATE_SUPER_ADMIN.sql` | Creates super admin user |
| `UPDATE_RLS_POLICIES.sql` | Grants full access |
| `CREATE_SUPER_ADMIN_GUIDE.md` | Detailed instructions |
| `SUPER_ADMIN_QUICK_START.md` | This quick guide |

---

## 🔗 Default Credentials

**Email:** Set by you in the script
**Password:** `TempPassword123!`
**Role:** `master_admin`
**Organization:** Primary Organization

---

## 📞 Need Help?

If you encounter issues:

1. Check `CREATE_SUPER_ADMIN_GUIDE.md` for detailed troubleshooting
2. Review Supabase dashboard for errors
3. Verify all tables exist in Table Editor
4. Check RLS policies in Database → Policies

---

## ⏭️ Next Steps After Setup

1. ✅ Login and change password
2. ✅ Explore admin features
3. ✅ Create additional users
4. ✅ Configure organization settings
5. ✅ Customize branding

---

**Created:** 2025-01-08
**Version:** 1.0
**Time to Complete:** ~5 minutes


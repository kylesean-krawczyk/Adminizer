# Super Admin Cheat Sheet

**Quick reference for creating and managing super admin users**

---

## 🚀 Setup in 3 Commands

### 1. Create User
```bash
# Edit CREATE_SUPER_ADMIN.sql line 57 with your email, then:
# Open Supabase Dashboard → SQL Editor → Run script
```

### 2. Grant Permissions
```bash
# Open Supabase Dashboard → SQL Editor → Run UPDATE_RLS_POLICIES.sql
```

### 3. Verify
```bash
# Open Supabase Dashboard → SQL Editor → Run VERIFY_SUPER_ADMIN.sql
```

---

## 📝 Essential SQL Queries

### Check if User Exists
```sql
SELECT email, role, is_active
FROM user_profiles
WHERE email = 'your-email@domain.com';
```

### Update to Super Admin
```sql
UPDATE user_profiles
SET role = 'master_admin', is_active = true
WHERE email = 'your-email@domain.com';
```

### Check RLS Policies
```sql
SELECT COUNT(*) FROM pg_policies
WHERE policyname LIKE 'Super admins%';
-- Should return 16+
```

### Reset Password (in Supabase Dashboard)
```sql
-- Go to Authentication → Users → Click user → Reset Password
```

---

## 🔑 Default Credentials

| Field | Value |
|-------|-------|
| Email | YOUR_EMAIL (set in script) |
| Password | `TempPassword123!` |
| Role | `master_admin` |
| Organization | `Primary Organization` |

**⚠️ Change password after first login!**

---

## ✅ Quick Verification

| Check | Command/Location |
|-------|------------------|
| User in auth | `SELECT * FROM auth.users WHERE email = 'your@email';` |
| User profile | `SELECT * FROM user_profiles WHERE email = 'your@email';` |
| Role correct | Should show `master_admin` |
| Is active | Should show `true` |
| Has org | Should have `organization_id` |
| Policies exist | Run `VERIFY_SUPER_ADMIN.sql` |

---

## 🐛 Common Fixes

### Can't Login
```sql
-- Check email confirmed
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'your-email@domain.com';
```

### Access Denied
```sql
-- Update role and activate
UPDATE user_profiles
SET role = 'master_admin', is_active = true
WHERE email = 'your-email@domain.com';
```

### No Organization
```sql
-- Link to org
UPDATE user_profiles
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE email = 'your-email@domain.com';
```

### Missing Policies
```bash
# Re-run UPDATE_RLS_POLICIES.sql in Supabase SQL Editor
```

---

## 📂 File Quick Reference

| Need to... | Use this file |
|------------|---------------|
| Create user | `CREATE_SUPER_ADMIN.sql` |
| Grant permissions | `UPDATE_RLS_POLICIES.sql` |
| Verify setup | `VERIFY_SUPER_ADMIN.sql` |
| Quick guide | `SUPER_ADMIN_QUICK_START.md` |
| Full guide | `CREATE_SUPER_ADMIN_GUIDE.md` |
| Understand files | `SUPER_ADMIN_FILES_SUMMARY.md` |
| Get started | `README_SUPER_ADMIN.md` |

---

## 🎯 Role Badge Colors

| Role | Badge Color | Access Level |
|------|-------------|--------------|
| `master_admin` | Purple | Full system |
| `admin` | Blue | Organization |
| `user` | Gray | Basic |

---

## ⚡ Emergency Fixes

### Locked Out
```sql
-- Reset password in Supabase Dashboard
-- Auth → Users → [User] → Reset Password
```

### Wrong Role
```sql
UPDATE user_profiles
SET role = 'master_admin'
WHERE email = 'your-email@domain.com';
```

### Inactive User
```sql
UPDATE user_profiles
SET is_active = true
WHERE email = 'your-email@domain.com';
```

### Delete Super Admin (Careful!)
```sql
-- Delete profile first
DELETE FROM user_profiles
WHERE email = 'your-email@domain.com';

-- Then delete auth user
DELETE FROM auth.users
WHERE email = 'your-email@domain.com';
```

---

## 🔒 Security Checklist

- [ ] Password changed from `TempPassword123!`
- [ ] Strong password in use (12+ chars)
- [ ] Only necessary people have super admin
- [ ] RLS policies enabled
- [ ] Regular access audits scheduled

---

## 📊 Success Indicators

| Location | What to See |
|----------|-------------|
| Login page | Can login successfully |
| Top right | "Master Admin" badge |
| Navigation | All menu items visible |
| User Mgmt | Can view all users |
| Settings | Full access granted |

---

## 🔗 Quick Links

- **Dashboard:** https://supabase.com/dashboard
- **SQL Editor:** Dashboard → Project → SQL Editor
- **Table Editor:** Dashboard → Project → Table Editor
- **Auth Users:** Dashboard → Project → Authentication

---

## 💡 Pro Tips

1. **Backup before running:** Take database snapshot
2. **Test in staging:** Try scripts in test environment first
3. **Document changes:** Keep notes of who has super admin
4. **Monitor access:** Set up logging and alerts
5. **Regular audits:** Review permissions quarterly

---

## 🎓 Role Hierarchy

```
master_admin  →  Full system access
    ↓
admin         →  Organization access
    ↓
user          →  Basic access
```

---

## ⚙️ Customization

### Change Temp Password
```sql
-- In CREATE_SUPER_ADMIN.sql line 58
v_temp_password text := 'YourPassword123!';
```

### Change Org Name
```sql
-- In CREATE_SUPER_ADMIN.sql line 79
'Your Organization Name',
```

### Add Another Super Admin
```bash
# 1. Update email in CREATE_SUPER_ADMIN.sql
# 2. Run script again (skip UPDATE_RLS_POLICIES.sql)
```

---

## 📞 Support Resources

1. Check `CREATE_SUPER_ADMIN_GUIDE.md`
2. Run `VERIFY_SUPER_ADMIN.sql`
3. Review Supabase logs
4. Check error messages in SQL Editor

---

**Version:** 1.0 | **Updated:** 2025-01-08


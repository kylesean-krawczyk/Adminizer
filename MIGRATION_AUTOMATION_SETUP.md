# Migration Automation Setup Guide

## Overview

Currently, migrations are applied **manually** to the production database. This guide shows you how to set up automated migrations using Supabase CLI.

---

## Current State (Manual Process)

**How migrations work now:**
1. Create migration file in `supabase/migrations/`
2. Log into Supabase Dashboard
3. Copy SQL to SQL Editor
4. Run manually
5. Reload schema cache: `NOTIFY pgrst, 'reload schema';`
6. Test application

**Problems with manual process:**
- Error-prone (easy to forget steps)
- Time-consuming
- Hard to track which migrations have been applied
- No rollback capability
- Doesn't scale for teams

---

## Automated Process (Recommended)

**With Supabase CLI:**
1. Create migration file in `supabase/migrations/`
2. Run: `supabase db push`
3. Migrations automatically applied in order
4. Schema cache reloads automatically
5. Migration tracking built-in

---

## Setup Steps

### Step 1: Install Supabase CLI

**Option A: NPM (Recommended)**
```bash
npm install -g supabase
```

**Option B: Homebrew (Mac)**
```bash
brew install supabase/tap/supabase
```

**Option C: Scoop (Windows)**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Verify installation:**
```bash
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will:
- Open browser for authentication
- Create access token
- Store credentials securely

### Step 3: Link Project to Production

```bash
# Navigate to project directory
cd /path/to/adminizer

# Link to production database
supabase link --project-ref abgtunvbbtlhsjphsvqq
```

**What this does:**
- Connects your local migrations to production database
- Creates `supabase/config.toml` file
- Enables automated migration commands

### Step 4: Verify Link

```bash
supabase db remote show
```

**Expected output:**
```
Project: abgtunvbbtlhsjphsvqq
Database: [database details]
Status: Connected
```

### Step 5: Check Current Migration Status

```bash
supabase db diff --local
```

This shows:
- Which migrations have been applied
- Which migrations are pending
- Any schema differences

---

## Using Automated Migrations

### Apply Pending Migrations

```bash
# Preview changes (dry run)
supabase db push --dry-run

# Apply migrations to production
supabase db push
```

**What happens:**
1. CLI reads all files in `supabase/migrations/`
2. Checks which migrations are already applied
3. Applies pending migrations in chronological order
4. Records migration in tracking table
5. Reloads schema cache automatically
6. Reports success/failure

### Create New Migration

**Option A: Write SQL manually**
```bash
# Create new migration file
supabase migration new add_new_feature

# Edit the generated file in supabase/migrations/
# Then apply with: supabase db push
```

**Option B: Generate from schema changes**
```bash
# Make changes in Supabase Dashboard
# Then generate migration from diff:
supabase db diff -f add_new_feature
```

### Check Migration History

```bash
# List applied migrations
supabase migration list

# Show migration status
supabase db remote show
```

### Rollback Migration (if needed)

```bash
# Reset to specific migration
supabase db reset --version <timestamp>
```

---

## Add to Package.json

Update `package.json` to include migration commands:

```json
{
  "scripts": {
    "db:push": "supabase db push",
    "db:diff": "supabase db diff",
    "db:status": "supabase migration list",
    "db:new": "supabase migration new"
  }
}
```

**Usage:**
```bash
npm run db:push        # Apply pending migrations
npm run db:diff        # Check for schema differences
npm run db:status      # List migrations
npm run db:new my-feature  # Create new migration
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy-migrations.yml`:

```yaml
name: Deploy Database Migrations

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        run: |
          curl -fsSL https://supabase.com/install.sh | sh

      - name: Apply Migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          supabase link --project-ref abgtunvbbtlhsjphsvqq
          supabase db push

      - name: Verify Migrations
        run: |
          supabase migration list
```

**Required Secrets:**
- `SUPABASE_ACCESS_TOKEN`: From `supabase login`
- `SUPABASE_DB_PASSWORD`: Database password from Supabase Dashboard

---

## Configuration File

After linking, `supabase/config.toml` is created:

```toml
# Supabase Configuration
project_id = "abgtunvbbtlhsjphsvqq"

[db]
port = 54322
shadow_port = 54320
major_version = 15

[api]
enabled = true
port = 54321
```

**Important:**
- Commit this file to version control
- Helps team members link their local environment
- Contains project-specific settings

---

## Migration Best Practices

### 1. Use Descriptive Names

**Good:**
```
20250119120000_add_user_preferences_table.sql
20250119130000_add_email_notification_columns.sql
```

**Bad:**
```
20250119120000_update.sql
20250119130000_fixes.sql
```

### 2. Make Migrations Idempotent

Always use `IF EXISTS` / `IF NOT EXISTS`:

```sql
CREATE TABLE IF NOT EXISTS new_table (...);

ALTER TABLE existing_table
  ADD COLUMN IF NOT EXISTS new_column TEXT;

DROP TABLE IF EXISTS old_table;
```

### 3. Test Before Production

```bash
# 1. Apply to local database first
supabase db push --local

# 2. Test application locally

# 3. If successful, apply to production
supabase db push
```

### 4. Include Rollback Plans

Add comments in migration files:

```sql
/*
  Migration: Add email preferences

  Rollback plan:
  ALTER TABLE users DROP COLUMN IF EXISTS email_preferences;
*/
```

### 5. Keep Migrations Small

- One logical change per migration
- Easier to debug issues
- Simpler rollbacks if needed

---

## Verification After Automation Setup

### Test the full flow:

```bash
# 1. Check current status
supabase migration list

# 2. Create test migration
supabase migration new test_automation

# 3. Add simple SQL
echo "SELECT 1;" > supabase/migrations/[timestamp]_test_automation.sql

# 4. Apply migration
supabase db push

# 5. Verify applied
supabase migration list

# 6. Check schema cache (should auto-reload)
# Test in application

# 7. Clean up test migration if needed
```

---

## Troubleshooting

### Issue: "No linked project"

**Solution:**
```bash
supabase link --project-ref abgtunvbbtlhsjphsvqq
```

### Issue: "Migration already applied"

**Solution:**
- This is expected for existing migrations
- CLI tracks what's been applied
- Only new migrations will be applied

### Issue: "Permission denied"

**Solution:**
```bash
# Re-authenticate
supabase login

# Or set access token manually
export SUPABASE_ACCESS_TOKEN=your_token_here
```

### Issue: "Schema cache not reloading"

**Solution:**
```bash
# Manual reload if needed
supabase db remote show
# Then in SQL Editor: NOTIFY pgrst, 'reload schema';
```

---

## Migration Tracking

Supabase uses a table to track migrations:

```sql
-- Check applied migrations
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

This table shows:
- Migration version (timestamp)
- When it was applied
- Migration statements
- Status (success/failure)

---

## Comparison: Manual vs Automated

| Feature | Manual | Automated (CLI) |
|---------|--------|----------------|
| Apply migrations | Copy/paste SQL | `supabase db push` |
| Track status | Manual notes | Built-in tracking |
| Rollback | Manual reverse | `supabase db reset` |
| Schema reload | Manual NOTIFY | Automatic |
| Team sync | Email/chat | Git + config file |
| CI/CD | Not possible | Easy integration |
| Error handling | Manual debugging | Clear error messages |
| Time per migration | 5-10 minutes | 30 seconds |

---

## Getting Started Checklist

- [ ] Install Supabase CLI
- [ ] Run `supabase login`
- [ ] Link project: `supabase link --project-ref abgtunvbbtlhsjphsvqq`
- [ ] Verify link: `supabase db remote show`
- [ ] Check migration status: `supabase migration list`
- [ ] Test dry run: `supabase db push --dry-run`
- [ ] Add npm scripts to package.json
- [ ] Commit `supabase/config.toml` to git
- [ ] Update team documentation
- [ ] Test full workflow with dummy migration
- [ ] Set up CI/CD (optional)

---

## Next Steps After Setup

1. **Apply Current Pending Migrations:**
   ```bash
   supabase db push
   ```

2. **Verify in Application:**
   - Test customization save functionality
   - Confirm no PGRST205 errors
   - Verify all features work

3. **Update Team:**
   - Share this guide with team members
   - Have them link their local environments
   - Establish migration review process

4. **Create Migration Workflow:**
   - Define who can create migrations
   - Set up code review for migration files
   - Establish testing procedures
   - Document emergency rollback process

---

## Support Resources

- **Supabase CLI Docs:** https://supabase.com/docs/guides/cli
- **Migration Guide:** https://supabase.com/docs/guides/cli/local-development
- **CLI Reference:** https://supabase.com/docs/reference/cli/introduction

---

## Summary

**Automated migrations provide:**
- ✅ Consistent, reliable deployment
- ✅ Automatic migration tracking
- ✅ Built-in schema cache reload
- ✅ Easy rollback capability
- ✅ Team synchronization
- ✅ CI/CD integration
- ✅ Time savings (90% faster)

**Initial setup time:** 15-20 minutes
**Time saved per migration:** 5-10 minutes
**Return on investment:** After 2-3 migrations

**Strongly recommended for production environments!**

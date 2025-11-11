# Foreign Key Validation and Repair System

Complete guide for diagnosing, repairing, and preventing foreign key constraint violations in your Supabase database.

## 📋 Quick Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `FOREIGN_KEY_DIAGNOSTIC.sql` | Identify orphaned records | **Run first** to understand the scope |
| `FOREIGN_KEY_BACKUP_AND_SAFETY.sql` | Create backups | **Run second** before any repairs |
| `FOREIGN_KEY_REPAIR_STRATEGIES.sql` | Fix orphaned data | **Run third** to repair issues |
| Migration `20251111180000_improve_foreign_key_constraints.sql` | Better error messages | Run to prevent future issues |
| Migration `20251111180100_add_application_validation_functions.sql` | App-level validation | Run to add validation helpers |
| Migration `20251111180200_add_monitoring_and_prevention.sql` | Ongoing monitoring | Run for continuous health checks |

---

## 🚀 Step-by-Step Repair Process

### Step 1: Diagnose the Problem

Run the diagnostic queries to understand what's broken:

```sql
-- Open Supabase SQL Editor and run these queries

-- 1. Get comprehensive summary
SELECT * FROM (
  -- Summary query from FOREIGN_KEY_DIAGNOSTIC.sql, Section 9.1
  -- This shows all orphaned records by table
) summary;

-- 2. Check specific tables
-- User profiles with invalid organization_id
SELECT * FROM user_profiles up
WHERE organization_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = up.organization_id);

-- 3. Get overall health status
SELECT
  (SELECT COUNT(*) FROM organizations) as total_orgs,
  (SELECT COUNT(*) FROM user_profiles) as total_profiles,
  (SELECT COUNT(*) FROM user_profiles WHERE organization_id IS NULL) as profiles_without_org;
```

**Expected Output:**
- If everything is healthy: All counts should be 0
- If issues exist: You'll see specific counts of orphaned records

### Step 2: Create Backups

**CRITICAL: Always backup before repairs!**

```sql
-- Run in Supabase SQL Editor

-- 1. First, create the backup infrastructure
-- Copy and paste FOREIGN_KEY_BACKUP_AND_SAFETY.sql entirely

-- 2. Create backups of all orphaned records
SELECT fk_backups.backup_all_orphaned_records();
```

**Expected Output:**
```json
{
  "success": true,
  "backup_name": "full_backup_20251111_143022",
  "total_records_backed_up": 15,
  "details": [
    {"table": "user_profiles", "count": 5},
    {"table": "ai_page_context", "count": 10}
  ]
}
```

**Important:** Save the `backup_name` value! You'll need it for rollback if needed.

### Step 3: Choose and Execute Repair Strategy

You have 4 repair strategies. Choose based on your needs:

#### Strategy A: Assign to Default Organization (Recommended)
**Best for:** Preserving all data while cleaning up references

```sql
-- This creates a "Default Organization (Orphaned Records)" and assigns all orphaned records to it
SELECT repair_all_tables_assign_default();
```

**Pros:**
- ✅ No data loss
- ✅ Records remain accessible
- ✅ Easy to reassign later
- ✅ Safest option

**Cons:**
- ⚠️ Creates a "catch-all" organization
- ⚠️ Requires manual review to properly reassign

#### Strategy B: Soft Delete
**Best for:** Hiding orphaned data but keeping it for historical purposes

```sql
-- Mark user profiles as inactive
SELECT repair_user_profiles_soft_delete();

-- Delete orphaned records from tables that don't support soft delete
SELECT repair_delete_orphaned_non_user_records();
```

**Pros:**
- ✅ No permanent data loss
- ✅ Can be reactivated
- ✅ Maintains referential integrity

**Cons:**
- ⚠️ Inactive records may clutter queries
- ⚠️ Some tables will have records deleted

#### Strategy C: Move to Holding Organization
**Best for:** Manual review and proper reassignment

```sql
-- Creates "NEEDS REVIEW - Orphaned Records" organization
SELECT repair_move_to_holding_org();
```

**Pros:**
- ✅ Clear separation for review
- ✅ Easy to identify which records need attention
- ✅ Maintains all data

**Cons:**
- ⚠️ Requires manual intervention
- ⚠️ Records stay in limbo until processed

#### Strategy D: Hard Delete (Use with Extreme Caution!)
**Best for:** When you're absolutely certain orphaned data is not needed

```sql
-- DANGER: This permanently deletes data!
-- Only run if you have verified backups

-- First verify backup exists
SELECT * FROM fk_backups.backup_metadata
WHERE backup_timestamp > NOW() - INTERVAL '1 hour';

-- Then delete (CANNOT BE UNDONE without backup!)
SELECT repair_hard_delete_orphaned();
```

**Pros:**
- ✅ Clean database
- ✅ No clutter

**Cons:**
- ❌ **PERMANENT DATA LOSS**
- ❌ Cannot be recovered without backup

### Step 4: Verify the Repair

After running your chosen strategy, verify the repair:

```sql
-- Re-run diagnostic queries
-- All counts should now be 0

-- Check user_profiles
SELECT COUNT(*) FROM user_profiles up
WHERE organization_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = up.organization_id);
-- Should return: 0

-- Check ai_page_context
SELECT COUNT(*) FROM ai_page_context apc
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = apc.user_id);
-- Should return: 0

-- Get overall summary
SELECT
  table_name,
  orphaned_records,
  severity
FROM (
  -- Summary query from FOREIGN_KEY_DIAGNOSTIC.sql, Section 9.1
);
-- Should show: No rows (all issues resolved)
```

### Step 5: Install Prevention System

Run the three migration files to prevent future issues:

```sql
-- Migration 1: Improved constraints with better error messages
-- Copy/paste: supabase/migrations/20251111180000_improve_foreign_key_constraints.sql

-- Migration 2: Application validation functions
-- Copy/paste: supabase/migrations/20251111180100_add_application_validation_functions.sql

-- Migration 3: Monitoring and alerting
-- Copy/paste: supabase/migrations/20251111180200_add_monitoring_and_prevention.sql
```

---

## 🔄 Rollback Procedure

If repairs caused unexpected issues:

```sql
-- Rollback user_profiles from a specific backup
SELECT fk_backups.rollback_user_profiles('full_backup_20251111_143022');
```

Replace `'full_backup_20251111_143022'` with your actual backup name from Step 2.

---

## 📊 Using the Monitoring System

After installing the prevention migrations:

### Run Health Checks

```sql
-- Manual health check
SELECT run_foreign_key_health_check();
```

**Output Example:**
```json
{
  "severity": "ok",
  "total_orphaned_records": 0,
  "tables_affected": [],
  "alert_created": false
}
```

### View Admin Dashboard

```sql
-- Comprehensive dashboard data
SELECT get_fk_dashboard_data();
```

**Output includes:**
- Data quality score (0-100)
- Recent health check results
- Constraint violations in last 24 hours
- Recommendations for action

### Check Data Quality Score

```sql
SELECT get_data_quality_score();
```

**Output Example:**
```json
{
  "score": 99.85,
  "grade": "A+",
  "total_records": 1000,
  "orphaned_records": 2,
  "healthy_records": 998
}
```

### View Trends

```sql
-- See trend over last 30 days
SELECT get_orphaned_records_trend(30);
```

---

## 🛡️ Application-Level Validation

Use these functions in your application code **before** database operations:

### Validate Organization Before Insert

```typescript
// In your application code
const { data, error } = await supabase.rpc('validate_organization_exists', {
  p_organization_id: organizationId,
  p_check_user_access: true
});

if (!data.valid) {
  // Show error to user: data.error
  console.error(data.error_code, data.error);
  return;
}

// Proceed with insert
```

### Check User Profile Completeness

```typescript
const { data, error } = await supabase.rpc('validate_user_profile_complete');

if (!data.valid) {
  // Handle based on error_code
  if (data.error_code === 'PROFILE_NOT_FOUND') {
    // Create profile
  } else if (data.error_code === 'PROFILE_INCOMPLETE') {
    // Show missing fields: data.missing_fields
  }
}
```

### Validate All Foreign Keys Before Insert

```typescript
const { data, error } = await supabase.rpc('check_can_create_record', {
  p_table_name: 'ai_tool_access_requests',
  p_foreign_keys: {
    user_id: userId,
    tool_id: toolId,
    organization_id: orgId
  }
});

if (!data.valid) {
  // Show validation errors
  data.errors.forEach(err => {
    console.error(`${err.field}: ${err.error}`);
  });
  return;
}

// Safe to proceed with insert
```

### Get Dropdown Options

```typescript
// Get valid organizations for dropdown
const { data } = await supabase.rpc('get_organization_options');
// Returns: [{ value: uuid, label: string }, ...]

// Get available tools for dropdown
const { data } = await supabase.rpc('get_tool_options', {
  p_include_restricted: false
});
```

---

## 📈 Monitoring Best Practices

1. **Daily Health Checks**
   - Run `SELECT run_foreign_key_health_check();` daily
   - Automate via cron job or scheduled function

2. **Weekly Reviews**
   - Check dashboard: `SELECT get_fk_dashboard_data();`
   - Review constraint violation logs
   - Monitor data quality score

3. **Alert Thresholds**
   - Quality score below 95%: Warning
   - Quality score below 90%: Action required
   - Any critical health check: Immediate action

4. **Cleanup Schedule**
   - Monthly: `SELECT cleanup_old_health_checks();`
   - Removes data older than 90 days

---

## 🐛 Troubleshooting

### Issue: "ERROR: 42501: must be owner of relation users"

**Cause:** Trying to create trigger on `auth.users` via SQL Editor

**Solution:** Skip trigger creation. The trigger already exists from earlier migrations. Just run the functions that don't require trigger creation.

### Issue: Repair function returns "No recent backup found"

**Cause:** Hard delete strategy requires recent backup

**Solution:**
```sql
-- Create backup first
SELECT fk_backups.backup_all_orphaned_records();

-- Wait 1 second, then proceed with repair
SELECT repair_hard_delete_orphaned();
```

### Issue: Validation triggers causing errors on legitimate inserts

**Cause:** Referenced organization/user doesn't exist yet

**Solution:**
```sql
-- Use deferrable constraints for complex transactions
BEGIN;
  SET CONSTRAINTS user_profiles_organization_id_fkey DEFERRED;
  -- Your inserts here
COMMIT;
```

### Issue: Too many constraint violation logs

**Cause:** High volume of invalid insert attempts

**Solution:**
1. Review logs: `SELECT * FROM constraint_violations_log ORDER BY created_at DESC LIMIT 100;`
2. Fix application code to use validation functions
3. Clean up logs: `DELETE FROM constraint_violations_log WHERE created_at < NOW() - INTERVAL '30 days';`

---

## 📝 Summary

You now have a complete system for:

✅ **Diagnosing** orphaned records and foreign key issues
✅ **Backing up** data safely before repairs
✅ **Repairing** issues with 4 different strategies
✅ **Preventing** future issues with improved constraints
✅ **Validating** data at the application level
✅ **Monitoring** database health continuously

### Recommended Workflow

1. Run diagnostics monthly
2. Create backups before any repairs
3. Use Strategy A (assign to default) for safest repairs
4. Install all prevention migrations
5. Use validation functions in application code
6. Monitor weekly with dashboard queries

### Support

If you encounter issues not covered in this guide:
1. Check `constraint_violations_log` for detailed errors
2. Review `fk_health_check_history` for patterns
3. Run diagnostic queries to identify specific problems
4. Use backup and rollback if needed

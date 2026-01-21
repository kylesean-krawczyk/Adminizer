-- =====================================================
-- DATABASE ORGANIZATION CONSOLIDATION SCRIPT
-- =====================================================
-- Purpose: Remove duplicate "Master Admin Organization"
-- Target Organization to Keep: Primary Organization
-- Target Organization to Delete: Master Admin Organization
-- Date Created: 2025
-- =====================================================

-- =====================================================
-- SECTION 1: PRE-CONSOLIDATION BACKUP
-- =====================================================
-- Run these queries first to capture current state

-- Backup: Current organizations state
SELECT 
  'BACKUP: Organizations' as backup_type,
  id,
  name,
  created_by,
  vertical,
  enabled_verticals,
  created_at
FROM organizations
ORDER BY created_at;

-- Backup: User profiles linked to organizations
SELECT 
  'BACKUP: User Profiles' as backup_type,
  id,
  email,
  full_name,
  role,
  organization_id,
  is_active
FROM user_profiles
ORDER BY organization_id, created_at;

-- Backup: Documents linked to organizations (if any)
SELECT 
  'BACKUP: Documents' as backup_type,
  COUNT(*) as total_documents,
  organization_id
FROM documents
WHERE organization_id IS NOT NULL
GROUP BY organization_id;

-- Backup: User invitations linked to organizations (if any)
SELECT 
  'BACKUP: User Invitations' as backup_type,
  COUNT(*) as total_invitations,
  organization_id
FROM user_invitations
GROUP BY organization_id;

-- =====================================================
-- SECTION 2: PRE-DELETION VALIDATION
-- =====================================================

-- Verify exactly 2 organizations exist
SELECT 
  'VALIDATION: Organization Count' as validation_type,
  COUNT(*) as total_organizations,
  CASE 
    WHEN COUNT(*) = 2 THEN 'PASS: Expected 2 organizations'
    ELSE 'FAIL: Expected 2 organizations, found ' || COUNT(*)
  END as status
FROM organizations;

-- Verify Primary Organization exists
SELECT 
  'VALIDATION: Primary Organization' as validation_type,
  id,
  name,
  CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001' THEN 'PASS: Primary Organization exists'
    ELSE 'FAIL: Primary Organization not found'
  END as status
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify Master Admin Organization exists (to be deleted)
SELECT 
  'VALIDATION: Master Admin Organization' as validation_type,
  id,
  name,
  CASE 
    WHEN id = '6c921135-adc5-4c38-a0cd-4a0441ff6b7c' THEN 'PASS: Master Admin Organization exists'
    ELSE 'FAIL: Master Admin Organization not found'
  END as status
FROM organizations
WHERE id = '6c921135-adc5-4c38-a0cd-4a0441ff6b7c';

-- Verify user profile is linked to Primary Organization
SELECT 
  'VALIDATION: User Profile Link' as validation_type,
  id,
  email,
  organization_id,
  CASE 
    WHEN organization_id = '00000000-0000-0000-0000-000000000001' THEN 'PASS: User linked to Primary Organization'
    ELSE 'FAIL: User not linked to Primary Organization'
  END as status
FROM user_profiles
WHERE email = 'kyle.sean.krawczyk@gmail.com';

-- Check for any data linked to Master Admin Organization
SELECT 
  'VALIDATION: Master Admin Org Data' as validation_type,
  (SELECT COUNT(*) FROM documents WHERE organization_id = '6c921135-adc5-4c38-a0cd-4a0441ff6b7c') as documents_count,
  (SELECT COUNT(*) FROM user_invitations WHERE organization_id = '6c921135-adc5-4c38-a0cd-4a0441ff6b7c') as invitations_count,
  (SELECT COUNT(*) FROM user_profiles WHERE organization_id = '6c921135-adc5-4c38-a0cd-4a0441ff6b7c') as users_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM documents WHERE organization_id = '6c921135-adc5-4c38-a0cd-4a0441ff6b7c') = 0
     AND (SELECT COUNT(*) FROM user_invitations WHERE organization_id = '6c921135-adc5-4c38-a0cd-4a0441ff6b7c') = 0
     AND (SELECT COUNT(*) FROM user_profiles WHERE organization_id = '6c921135-adc5-4c38-a0cd-4a0441ff6b7c') = 0
    THEN 'PASS: No data linked to Master Admin Organization - safe to delete'
    ELSE 'WARNING: Data exists - review before deletion'
  END as status;

-- =====================================================
-- SECTION 3: CONSOLIDATION (DELETION)
-- =====================================================
-- IMPORTANT: Only run this section after reviewing all validation results above
-- Make sure all validations show "PASS" status

-- BEGIN TRANSACTION
BEGIN;

-- Delete Master Admin Organization
DELETE FROM organizations
WHERE id = '6c921135-adc5-4c38-a0cd-4a0441ff6b7c'
  AND name = 'Master Admin Organization';

-- Verify deletion was successful
SELECT 
  'DELETION: Verification' as verification_type,
  COUNT(*) as remaining_organizations,
  CASE 
    WHEN COUNT(*) = 1 THEN 'SUCCESS: Only 1 organization remains'
    ELSE 'ERROR: Expected 1 organization, found ' || COUNT(*)
  END as status
FROM organizations;

-- COMMIT TRANSACTION (only if verification shows SUCCESS)
COMMIT;

-- If there's an error, run: ROLLBACK;

-- =====================================================
-- SECTION 4: POST-CONSOLIDATION VALIDATION
-- =====================================================

-- Verify only Primary Organization remains
SELECT 
  'POST-VALIDATION: Final Organization' as validation_type,
  id,
  name,
  created_by,
  vertical,
  enabled_verticals,
  created_at,
  CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001' 
     AND name = 'Primary Organization'
    THEN 'SUCCESS: Primary Organization is the only remaining organization'
    ELSE 'ERROR: Unexpected organization state'
  END as status
FROM organizations;

-- Verify user profile still has access
SELECT 
  'POST-VALIDATION: User Access' as validation_type,
  id,
  email,
  full_name,
  role,
  organization_id,
  is_active,
  CASE 
    WHEN organization_id = '00000000-0000-0000-0000-000000000001' 
     AND is_active = true
    THEN 'SUCCESS: User profile has access to Primary Organization'
    ELSE 'ERROR: User profile access issue'
  END as status
FROM user_profiles
WHERE email = 'kyle.sean.krawczyk@gmail.com';

-- Verify all verticals are properly configured
SELECT 
  'POST-VALIDATION: Verticals Configuration' as validation_type,
  vertical as primary_vertical,
  enabled_verticals,
  CASE 
    WHEN 'church' = ANY(enabled_verticals)
     AND 'business' = ANY(enabled_verticals)
     AND 'estate' = ANY(enabled_verticals)
    THEN 'SUCCESS: All verticals (church, business, estate) are enabled'
    ELSE 'WARNING: Not all verticals are enabled'
  END as status
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Final summary
SELECT 
  'FINAL SUMMARY' as summary_type,
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT name FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001') as remaining_org_name,
  (SELECT COUNT(*) FROM user_profiles WHERE organization_id = '00000000-0000-0000-0000-000000000001') as users_in_primary_org,
  CASE 
    WHEN (SELECT COUNT(*) FROM organizations) = 1
    THEN 'CONSOLIDATION COMPLETE'
    ELSE 'CONSOLIDATION INCOMPLETE - REVIEW REQUIRED'
  END as consolidation_status;

-- =====================================================
-- END OF CONSOLIDATION SCRIPT
-- =====================================================

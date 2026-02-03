/*
  Browser Console Tests for organization_ui_customizations

  PURPOSE:
  Test if the table is accessible from your application's frontend
  Run these in Chrome/Firefox Developer Tools Console (F12)

  INSTRUCTIONS:
  1. Open your application in browser
  2. Press F12 to open Developer Tools
  3. Go to Console tab
  4. Copy and paste each test below
  5. Run one at a time
  6. Check the results

  LOCATION:
  Run while on the Organization Customization page
*/

// ====================================================================
// TEST 1: Basic Table Accessibility
// ====================================================================

console.log('🧪 TEST 1: Basic Table Accessibility');
console.log('Testing if organization_ui_customizations is accessible...\n');

(async () => {
  const { data, error } = await window.supabase
    .from('organization_ui_customizations')
    .select('*')
    .limit(1);

  if (error) {
    if (error.code === 'PGRST205') {
      console.error('❌ FAIL: Table not in schema cache');
      console.error('Error:', error.message);
      console.log('👉 SOLUTION: Reload schema cache in Supabase Dashboard');
      console.log('   Settings → API → Reload schema');
    } else if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
      console.warn('⚠️  PARTIAL SUCCESS: Table exists but permission denied');
      console.error('Error:', error.message);
      console.log('👉 This means schema cache is working!');
      console.log('👉 Check your user role (must be master_admin)');
    } else {
      console.error('❌ UNKNOWN ERROR:', error);
    }
  } else {
    console.log('✅ SUCCESS: Table is accessible!');
    console.log('Data:', data);
    console.log('👉 Schema cache is working correctly');
  }
})();

// ====================================================================
// TEST 2: Check Current User Profile
// ====================================================================

console.log('\n🧪 TEST 2: Check Current User Profile');
console.log('Verifying your user role and organization...\n');

(async () => {
  const { data: { user } } = await window.supabase.auth.getUser();

  if (!user) {
    console.error('❌ Not logged in');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Email:', user.email);

  const { data: profile, error } = await window.supabase
    .from('user_profiles')
    .select('id, email, full_name, role, organization_id, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching profile:', error);
  } else if (profile) {
    console.log('✅ Profile found:');
    console.log('  Role:', profile.role);
    console.log('  Organization ID:', profile.organization_id);
    console.log('  Active:', profile.is_active);

    if (profile.role !== 'master_admin') {
      console.warn('⚠️  You are not a master_admin');
      console.log('👉 Only master_admin can manage customizations');
    } else {
      console.log('✅ You have master_admin role');
    }
  } else {
    console.error('❌ Profile not found');
  }
})();

// ====================================================================
// TEST 3: Attempt to Insert Test Record
// ====================================================================

console.log('\n🧪 TEST 3: Attempt to Insert Test Record');
console.log('Testing if you can create a customization...\n');

(async () => {
  const { data: { user } } = await window.supabase.auth.getUser();

  if (!user) {
    console.error('❌ Not logged in');
    return;
  }

  const { data: profile } = await window.supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.organization_id) {
    console.error('❌ No organization found for user');
    return;
  }

  const testData = {
    organization_id: profile.organization_id,
    vertical_id: 'church',
    dashboard_config: { test: true },
    navigation_config: {},
    branding_config: {},
    stats_config: {},
    department_config: {},
    version: 1,
    is_active: true,
    created_by: user.id,
    updated_by: user.id
  };

  const { data, error } = await window.supabase
    .from('organization_ui_customizations')
    .insert(testData)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST205') {
      console.error('❌ FAIL: Table not in schema cache');
      console.log('👉 Reload schema cache in Supabase Dashboard');
    } else if (error.code === '23505' || error.message.includes('duplicate')) {
      console.log('ℹ️  Record already exists for this org/vertical');
      console.log('👉 This is actually GOOD - means table is accessible!');
      console.log('👉 Try updating instead of inserting');
    } else if (error.code === 'PGRST116') {
      console.error('❌ Permission denied');
      console.log('👉 Check RLS policies or user role');
    } else {
      console.error('❌ Insert failed:', error);
    }
  } else {
    console.log('✅ SUCCESS: Test record created!');
    console.log('Data:', data);
    console.log('👉 Everything is working correctly');

    // Clean up test record
    if (data?.id) {
      await window.supabase
        .from('organization_ui_customizations')
        .delete()
        .eq('id', data.id);
      console.log('🧹 Test record cleaned up');
    }
  }
})();

// ====================================================================
// TEST 4: Check Network Request
// ====================================================================

console.log('\n🧪 TEST 4: Monitor Network Requests');
console.log('Instructions:');
console.log('1. Keep DevTools open');
console.log('2. Go to Network tab');
console.log('3. Try saving a customization in the UI');
console.log('4. Look for request to "organization_ui_customizations"');
console.log('5. Check the status code:\n');
console.log('   404 = Schema cache issue (reload needed)');
console.log('   403 = Permission issue (check role)');
console.log('   400 = Bad request (check data format)');
console.log('   200/201 = Success! ✅\n');

// ====================================================================
// TEST 5: Environment Variables Check
// ====================================================================

console.log('\n🧪 TEST 5: Environment Variables Check');
console.log('Checking Supabase configuration...\n');

(async () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const hasAnonKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const demoMode = import.meta.env.VITE_DEMO_MODE;

  console.log('Supabase URL:', url || '❌ NOT SET');
  console.log('Has Anon Key:', hasAnonKey ? '✅ Yes' : '❌ No');
  console.log('Demo Mode:', demoMode === 'true' ? '⚠️  ENABLED (using demo data)' : '✅ Disabled (using real DB)');

  if (!url || !hasAnonKey) {
    console.error('❌ Supabase not configured properly');
  } else {
    console.log('✅ Supabase configuration looks good');
  }
})();

// ====================================================================
// TEST 6: History Table Check
// ====================================================================

console.log('\n🧪 TEST 6: History Table Check');
console.log('Testing if history table is accessible...\n');

(async () => {
  const { data, error } = await window.supabase
    .from('organization_customization_history')
    .select('*')
    .limit(1);

  if (error) {
    if (error.code === 'PGRST205') {
      console.error('❌ History table not in schema cache');
    } else {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('✅ History table is accessible');
    console.log('Data:', data);
  }
})();

// ====================================================================
// QUICK TEST (RUN THIS FIRST)
// ====================================================================

console.log('\n🚀 QUICK TEST - Run This First\n');

(async () => {
  console.log('Testing table accessibility...');

  const { data, error } = await window.supabase
    .from('organization_ui_customizations')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Table NOT accessible');
    console.error('Error code:', error.code);
    console.error('Message:', error.message);

    if (error.code === 'PGRST205') {
      console.log('\n🔧 SOLUTION:');
      console.log('1. Go to Supabase Dashboard');
      console.log('2. Settings → API');
      console.log('3. Click "Reload schema"');
      console.log('4. Wait 30 seconds');
      console.log('5. Run this test again');
    }
  } else {
    console.log('✅ Table IS accessible!');
    console.log('Schema cache is working correctly');
    console.log('If you still have issues, check permissions');
  }
})();

// ====================================================================
// SUMMARY
// ====================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST SUITE COMPLETE');
console.log('='.repeat(60));
console.log('\nNEXT STEPS:');
console.log('1. Review all test results above');
console.log('2. If any test shows PGRST205, reload schema cache');
console.log('3. If tests show permission errors, check your role');
console.log('4. If all tests pass, try saving a customization');
console.log('5. If still broken, run VERIFY_TABLE_STATUS.sql in Supabase\n');

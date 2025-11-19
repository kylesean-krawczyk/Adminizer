# Quick Test Guide - Dashboard Customization

## 5-Minute Test

### Step 1: Login
- Navigate to your application
- Login as `master_admin`

### Step 2: Customize
- Go to **Settings** → **Organization Customization**
- Select **Dashboard** tab
- Change:
  - **Dashboard Title:** "My Custom Dashboard"
  - **Dashboard Subtitle:** "Test customization system"
- Click **Save Changes**
- ✅ You should see: "Customization saved successfully! Changes are now visible on the dashboard."

### Step 3: Verify
- Click **Dashboard** in the sidebar
- ✅ You should see your custom title: "My Custom Dashboard"
- ✅ You should see your custom subtitle: "Test customization system"

### Step 4: Refresh Test
- Press F5 (or Ctrl+R) to refresh the page
- ✅ Custom values should still be visible after refresh

### Step 5: Browser Console Check (Optional)
- Press F12 to open browser console
- Look for these log messages:
  ```
  [VerticalContext] Applying customizations for church: {...}
  [Dashboard] Customization loaded. Dashboard config: {...}
  ```
- ✅ Logs should show your custom title and subtitle values

## Expected Results

### ✅ Success Indicators
1. Save shows success message
2. Dashboard immediately shows custom values
3. Values persist after page refresh
4. Console shows customization logs
5. No errors in console

### ❌ Failure Indicators
1. Dashboard shows default "Dashboard" title
2. Custom values disappear after refresh
3. Console shows errors
4. No customization logs in console

## Troubleshooting

### If customizations don't appear:

1. **Hard refresh:** Ctrl+Shift+R
2. **Check console:** Look for error messages
3. **Verify save:** Go back to Settings and check if values are still in the form
4. **Try again:** Make a small change and save again

### Still not working?

Contact support with:
- Screenshot of Settings page with your custom values
- Screenshot of Dashboard showing defaults
- Browser console logs (F12 → Console tab)
- Your user email and organization name

## What You Can Customize

### Dashboard Tab
- Dashboard Title
- Dashboard Subtitle
- Core Section Title
- Additional Section Title

### Stats Cards Tab
- Stat card configurations
- Metrics displayed

### Departments Tab
- Department visibility
- Department ordering

### Branding Tab
- Colors and theme
- Logo uploads

### Version History Tab
- View all changes
- Rollback to previous versions
- Mark milestones

## Tips

- Save frequently
- Use descriptive titles
- Test after each save
- Check Version History to track changes
- Use Export/Import for backup

## Quick Commands

- **Save:** Click "Save Changes" button
- **Discard:** Click "Discard Changes" to undo
- **Reset:** Click "Reset to Defaults" (careful - can't undo!)
- **Export:** Download current config as JSON
- **Import:** Upload previously exported config

## Success!

If you see your custom title on the dashboard, everything is working correctly! 🎉

You can now customize all aspects of your dashboard through the Organization Customization page.

# Fix GitHub and Netlify Deployment Sync

## The Problem
Your changes in Bolt are not showing up on GitHub Pages or Netlify because:
1. Changes made in Bolt are only in the browser environment
2. These changes haven't been saved to your local file system
3. Without local files, they can't be committed to GitHub
4. GitHub and Netlify deploy from your repository, not from Bolt

## Solution: Download and Sync Your Changes

### Step 1: Download Current Project from Bolt

1. **In Bolt, click the download button** (usually in the top-right corner)
2. **Download the entire project** as a ZIP file
3. **Extract the ZIP** to a new folder on your computer
4. **This gives you all the latest changes** including:
   - Dashboard reorganization
   - Department pages
   - Operations center
   - All your recent modifications

### Step 2: Replace Your Local Files

```bash
# Navigate to your existing local project
cd /path/to/your/existing/adminizer-project

# Backup your current files (optional but recommended)
cp -r . ../adminizer-backup

# Remove old files (keep .git folder!)
rm -rf src/ public/ *.json *.ts *.js *.md
# Keep: .git/ .github/ node_modules/ (if exists)

# Copy new files from downloaded Bolt project
cp -r /path/to/downloaded-bolt-project/* .

# Make sure .git folder is still there
ls -la
```

### Step 3: Install Dependencies and Test

```bash
# Install dependencies
npm install

# Test the demo build locally
npm run build:demo

# Preview locally to verify changes
npm run preview:demo
```

### Step 4: Commit and Push to GitHub

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Update: Latest dashboard reorganization and department features from Bolt"

# Push to GitHub
git push origin main
```

### Step 5: Verify Deployments

**GitHub Pages:**
1. Go to your repository on GitHub
2. Check the "Actions" tab to see if deployment is running
3. Wait for green checkmark (usually 2-3 minutes)
4. Visit: `https://YOUR_USERNAME.github.io/adminizer-demo`

**Netlify:**
1. Go to your Netlify dashboard
2. Check if new deployment was triggered
3. If not, click "Trigger deploy" → "Deploy site"
4. Wait for deployment to complete

## Alternative: Direct Upload to GitHub

If you prefer a simpler approach:

### Option A: GitHub Web Interface

1. **Download project from Bolt**
2. **Go to your GitHub repository**
3. **Delete old files** (except .github folder)
4. **Upload new files** by dragging the downloaded project files
5. **Commit changes** with message: "Update from Bolt"

### Option B: GitHub Desktop

1. **Download project from Bolt**
2. **Open GitHub Desktop**
3. **Select your repository**
4. **Replace files** in the local folder
5. **Commit and push** through GitHub Desktop

## Troubleshooting

### If GitHub Pages Still Shows Old Version:
```bash
# Force rebuild by updating package.json version
# Edit package.json and change version to 2.1.1
git add package.json
git commit -m "Bump version to trigger rebuild"
git push origin main
```

### If Netlify Doesn't Update:
1. **Go to Netlify dashboard**
2. **Site settings** → **Build & deploy**
3. **Trigger deploy** → **Clear cache and deploy site**

### If Build Fails:
```bash
# Check for missing dependencies
npm install

# Test build locally first
npm run build:demo

# Check for TypeScript errors
npm run lint
```

## Verification Checklist

After deployment, verify these features are working:

✅ **Purple demo banner** at the top
✅ **Dashboard shows department cards** (9 departments)
✅ **Operations Center** accessible from dashboard
✅ **Department pages** work (Foster & Adopt, R/Kids, etc.)
✅ **Sample data** loads (Acme Nonprofit Foundation)
✅ **Document management** functions
✅ **User management** shows demo users

## Quick Fix Commands

```bash
# If you're in a hurry, run these commands:

# 1. Download project from Bolt to ~/Downloads/adminizer-bolt
# 2. Then run:

cd /path/to/your/local/adminizer-project
cp -r ~/Downloads/adminizer-bolt/* .
npm install
npm run build:demo
git add .
git commit -m "Sync latest changes from Bolt"
git push origin main
```

## Important Notes

- **Always download from Bolt first** before making changes locally
- **Test locally** before pushing to avoid broken deployments
- **Both GitHub and Netlify** deploy from your repository, not from Bolt
- **Changes in Bolt** are temporary until downloaded and committed

This process ensures your latest dashboard reorganization and department features will be visible on both GitHub Pages and Netlify!
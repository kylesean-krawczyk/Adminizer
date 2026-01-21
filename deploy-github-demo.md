# Deploy Adminizer Demo to GitHub Pages

## Quick Setup Guide

### Step 1: Prepare Your Repository

1. **Create a new GitHub repository** (if you haven't already):
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it: `adminizer-demo`
   - Make it public
   - Don't initialize with README (we'll push existing code)

### Step 2: Connect Your Local Project to GitHub

```bash
# Navigate to your project directory
cd /path/to/your/adminizer-project

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: Adminizer demo version"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/adminizer-demo.git

# Push to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. **Go to your repository on GitHub**
2. **Click "Settings" tab**
3. **Scroll down to "Pages" in the left sidebar**
4. **Under "Source", select "GitHub Actions"**
5. **The workflow will automatically deploy your demo**

### Step 4: Access Your Demo

After the workflow completes (2-3 minutes), your demo will be available at:
```
https://YOUR_USERNAME.github.io/adminizer-demo
```

## Alternative: Manual Deployment

If you prefer manual deployment:

```bash
# Build the demo version
npm run build:demo

# Create gh-pages branch and deploy
npm install -g gh-pages
gh-pages -d dist
```

## Environment Variables

The demo uses these environment variables (already configured):
- `VITE_DEMO_MODE=true`
- `VITE_SUPABASE_URL` (demo Supabase instance)
- `VITE_SUPABASE_ANON_KEY` (demo key)

## Features Included in Demo

✅ **Purple Demo Banner** - Clearly indicates portfolio demo mode
✅ **Sample Organization** - "Acme Nonprofit Foundation"
✅ **Pre-populated Data** - Documents, users, and demo content
✅ **All Features Functional** - Complete functionality with fake data
✅ **Department Pages** - All 9 business departments
✅ **Operations Center** - Full business operations dashboard
✅ **OAuth Simulation** - Demonstrates OAuth flows
✅ **Corporate Status Widget** - Legal compliance tracking
✅ **Document Management** - Upload, view, edit capabilities

## Updating Your Demo

To update the demo with new changes:

```bash
# Make your changes in Bolt
# Save/download the updated files
# Then run:

git add .
git commit -m "Update demo with latest changes"
git push origin main

# GitHub Actions will automatically redeploy
```

## Custom Domain (Optional)

To use a custom domain like `demo.yourdomain.com`:

1. **Add CNAME file** to your repository root:
   ```
   demo.yourdomain.com
   ```

2. **Configure DNS** with your domain provider:
   - Add CNAME record: `demo` → `YOUR_USERNAME.github.io`

3. **Update GitHub Pages settings** to use your custom domain

## Troubleshooting

**Build Fails?**
- Check that all dependencies are in `package.json`
- Ensure `npm run build:demo` works locally

**Demo Not Loading?**
- Check GitHub Actions tab for deployment status
- Verify GitHub Pages is enabled in repository settings

**Changes Not Showing?**
- Clear browser cache
- Check that latest commit triggered workflow
- Verify workflow completed successfully

## Portfolio Integration

Add this to your portfolio:

```html
<div class="project-card">
  <h3>Adminizer - Nonprofit Document Management</h3>
  <p>Full-stack React application with multi-tenant architecture...</p>
  <div class="project-links">
    <a href="https://YOUR_USERNAME.github.io/adminizer-demo" target="_blank">
      🚀 Live Demo
    </a>
    <a href="https://github.com/YOUR_USERNAME/adminizer-demo">
      📝 View Code
    </a>
  </div>
</div>
```

## Next Steps

1. **Follow the setup steps above**
2. **Test your demo thoroughly**
3. **Add the demo link to your portfolio**
4. **Share with potential employers/clients**

Your demo will showcase:
- Modern React development skills
- Database design and management
- Authentication and authorization
- Multi-tenant architecture
- Professional UI/UX design
- Full-stack development capabilities
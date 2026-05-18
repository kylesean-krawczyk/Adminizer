# Quick Netlify Deployment Guide

## Deploy Adminizer Production to Netlify

This repository includes a `netlify.toml` file for the production app. When the
repo is connected to Netlify, Netlify should use:

- Build command: `VITE_DEMO_MODE=false npm run build:production`
- Publish directory: `dist`
- Node.js: `18`

The inline `VITE_DEMO_MODE=false` keeps the production deployment from inheriting
demo-mode settings from the Netlify UI.

### GitHub Integration (Production)

1. **Push code to GitHub**
2. **Connect to Netlify:**
   - "New site from Git"
   - Connect GitHub repo
   - Keep the base directory empty unless this repo is nested inside another repo
   - Netlify will read `netlify.toml` and run the production build
3. **Environment variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Do not set `VITE_DEMO_MODE=true` on the production Netlify site

## Deploy Adminizer Demo to Netlify

### Method 1: Drag & Drop (Easiest)

1. **Build the demo:**
   ```bash
   npm run build:demo
   ```

2. **Go to Netlify:**
   - Visit [netlify.com](https://netlify.com)
   - Sign up/login (free account)

3. **Deploy:**
   - Drag the entire `dist` folder to Netlify
   - Get instant URL: `https://random-name.netlify.app`

4. **Customize URL (Optional):**
   - Click "Site settings"
   - Change site name to: `adminezer-demo`
   - New URL: `https://adminezer-demo.netlify.app`

### Method 2: Custom Domain (Advanced)

1. **Deploy as above**
2. **Add Custom Domain:**
   - Go to "Domain settings"
   - Add: `adminezer.kyleseanportfolio.com`
   - Update DNS in your domain provider

### Method 3: GitHub Integration (Demo Site)

1. **Push code to GitHub**
2. **Connect to Netlify:**
   - "New site from Git"
   - Connect GitHub repo
   - Override the build command for this separate demo site: `npm run build:demo`
   - Publish directory: `dist`

## Alternative: Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   npm run build:demo
   cd dist
   vercel --prod
   ```

## Alternative: GitHub Pages

1. **Build and commit:**
   ```bash
   npm run build:demo
   git add dist
   git commit -m "Add demo build"
   git subtree push --prefix dist origin gh-pages
   ```

2. **Enable GitHub Pages:**
   - Go to repo settings
   - Enable Pages from `gh-pages` branch
   - URL: `https://username.github.io/adminezer`

## Recommended: Netlify with Custom Domain

**Final URLs:**
- Demo: `https://adminezer.kyleseanportfolio.com`
- Portfolio: `https://kyleseanportfolio.com` (Wix)

This gives you a professional setup where your portfolio showcases the demo with a clean, branded URL.
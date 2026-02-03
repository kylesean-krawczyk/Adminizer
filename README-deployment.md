# Dual Deployment Guide

This project supports running both demo and production versions simultaneously.

## Deployment Strategy

### Demo Version (Portfolio Showcase)
- **Domain**: `https://kyleseanportfolio.com`
- **Purpose**: Portfolio demonstration with sample data
- **Build Command**: `npm run build:demo`
- **Environment**: Uses `.env.demo` configuration

### Production Version (Real Application)
- **Domain**: `https://kyleseanpm.com`
- **Purpose**: Actual application for real users
- **Build Command**: `npm run build:production`
- **Environment**: Uses `.env.production` configuration

## Quick Deployment

### For Portfolio Demo:
```bash
# Build demo version
npm run build:demo

# Upload dist/ folder to kyleseanportfolio.com
```

### For Production App:
```bash
# Build production version  
npm run build:production

# Upload dist/ folder to kyleseanpm.com
```

## Environment Files

- `.env.demo` - Demo configuration (sample data, portfolio mode)
- `.env.production` - Production configuration (real Supabase)

## Benefits of This Setup

✅ **Clear Separation**: Portfolio visitors see demo, real users use production
✅ **Portfolio Showcase**: Demo version perfect for showing potential employers/clients
✅ **Independent Updates**: Update either version without affecting the other
✅ **Different Audiences**: 
   - `kyleseanportfolio.com` - Recruiters, clients, portfolio visitors
   - `kyleseanpm.com` - Actual users of the application
✅ **Risk-Free Demo**: No real data exposure in portfolio version

## Features by Version

### Demo Version (`kyleseanportfolio.com`)
- Purple banner indicating demo mode
- Sample organization: "Acme Nonprofit Foundation"
- Pre-populated documents and users
- Simulated OAuth connections
- All features functional with fake data
- No real database connections
- Perfect for portfolio demonstration

### Production Version (`kyleseanpm.com`)
- Full Supabase integration
- Real user authentication
- Actual file uploads and storage
- Live OAuth connections
- Multi-tenant organization support
- Real-time data and notifications

## Maintenance

Both versions share the same codebase but use different data sources:
- Demo: Uses `src/lib/demo.ts` and demo hooks
- Production: Uses Supabase and real hooks

Update both by deploying with different environment configurations.

## Domain Structure
```
kyleseanportfolio.com  → Demo Version (Portfolio)
kyleseanpm.com         → Production Version (Real App)
```

This setup allows you to showcase your development skills on your portfolio domain while maintaining a separate production application for actual users.

## Netlify Deployment

### Setting Up Environment Variables in Netlify

**IMPORTANT**: Netlify does NOT use your `.env` files for security reasons. You must manually add environment variables in the Netlify dashboard.

#### Step-by-Step Guide:

1. **Log into Netlify** and navigate to your site
2. Click **Site settings** in the top navigation
3. Click **Environment variables** in the left sidebar
4. Click **Add a variable** button

#### Required Variables:

Add each of these variables:

**1. VITE_SUPABASE_URL**
   - **Value**: Your Supabase project URL
   - **Example**: `https://abgtunvbbtlhsjphsvqq.supabase.co`
   - **Where to find it**: Supabase Dashboard → Project Settings → API → URL

**2. VITE_SUPABASE_ANON_KEY**
   - **Value**: Your Supabase anonymous/public key
   - **Where to find it**: Supabase Dashboard → Project Settings → API → anon/public key
   - **Note**: This is safe to expose in client-side code

**3. VITE_ANTHROPIC_API_KEY**
   - **Value**: Your Anthropic Claude API key
   - **Where to find it**: https://console.anthropic.com/settings/keys
   - **Note**: Required for AI chat features

**4. VITE_DEMO_MODE** (optional)
   - **Value**: `false` (for production) or `true` (for demo)
   - **Default**: `false` if not set

#### After Adding Variables:

1. Click **Save** for each variable
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Clear cache and deploy site**
4. Watch the build logs for environment variable status

### Verifying Environment Variables

During the build, you'll see output like this:

```
🔧 Build Environment Variables:
  Mode: development
  VITE_SUPABASE_URL: ✓ Found
  VITE_SUPABASE_ANON_KEY: ✓ Found
  VITE_ANTHROPIC_API_KEY: ✓ Found
  VITE_DEMO_MODE: false
  Running on Netlify: Yes
```

If any variables show "✗ Missing", go back and double-check they're added in the Netlify dashboard.

### Common Issues

**Problem**: White screen with "Missing Supabase environment variables" error

**Solution**:
- Environment variables are not set in Netlify dashboard
- Variables have typos in their names (must match exactly)
- Site needs to be redeployed after adding variables

**Problem**: Variables are set but still not working

**Solution**:
- Clear Netlify's build cache: Deploys → Trigger deploy → Clear cache and deploy
- Verify variable names don't have extra spaces
- Check that you saved each variable after entering it
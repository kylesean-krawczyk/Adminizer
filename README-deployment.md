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
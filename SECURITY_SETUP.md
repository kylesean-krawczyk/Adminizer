# Security Setup Guide

## Critical: Protecting Your API Keys

This guide ensures your sensitive information stays secure.

## Quick Start (After Fresh Git Init)

### 1. Create Local Environment File

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 2. Add Your Keys to .env.local

Edit `.env.local` and replace the placeholders:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your_actual_key
VITE_DEMO_MODE=false
VITE_DEFAULT_VERTICAL=church
```

### 3. Verify .gitignore is Working

Run this command to check what Git will track:

```bash
git status
```

**You should NOT see:**
- `.env.local`
- `.env`
- Any files with API keys

**You should see:**
- `.env.example` (this is safe to commit)
- `.gitignore` (this is safe to commit)

## For Netlify Deployment

Add these environment variables in Netlify dashboard (Site settings → Environment variables):

1. `VITE_SUPABASE_URL` - Your Supabase project URL
2. `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
3. `VITE_ANTHROPIC_API_KEY` - Your Anthropic API key
4. `VITE_DEMO_MODE` - Set to `false` for production
5. `VITE_DEFAULT_VERTICAL` - Your default vertical (`church`, `business`, or `estate`)

## Security Checklist

- [x] `.gitignore` is properly configured
- [ ] `.env.local` created with actual keys
- [ ] No `.env` files visible in `git status`
- [ ] Environment variables added to Netlify
- [ ] Old exposed API keys revoked
- [ ] New API keys generated and secured

## What Gets Committed vs What Doesn't

### ✅ Safe to Commit
- `.env.example` (template with placeholders)
- `.gitignore` (security rules)
- Source code
- Documentation

### ❌ NEVER Commit
- `.env.local` (contains real keys)
- `.env` (contains real keys)
- Any file with actual API keys
- `node_modules/`
- `dist/` (build output)

## If You Accidentally Commit a Secret

1. **Immediately revoke** the exposed key in the provider's dashboard
2. Generate a **new key**
3. Update your `.env.local` with the new key
4. Update Netlify environment variables
5. Follow the "Fresh Git Start" guide to clean your Git history

## Getting API Keys

### Supabase
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy the URL and anon/public key

### Anthropic
1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy the key immediately (you won't see it again)

## Questions?

If something doesn't work or you see sensitive files in `git status`, STOP and don't commit. Review this guide or ask for help.

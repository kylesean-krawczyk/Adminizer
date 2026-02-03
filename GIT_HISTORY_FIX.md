# Fix Git History - Remove Anthropic API Key

## Problem
GitHub push protection detected an Anthropic API key in commit `666b0234ce60609f98a3ebab007239d5c7a98774` in the file `.env.development:6`.

## Solution Steps

### Option 1: Amend the Last Commit (If it's the most recent commit)

```bash
# Navigate to your repository
cd "D:\Product Development\Adminizer\Adminizer 2.0\project"

# Check your commit history
git log --oneline -5

# If the problematic commit is the most recent one, amend it
git add .
git commit --amend --no-edit

# Force push to overwrite the remote history
git push origin master --force
```

### Option 2: Interactive Rebase (If it's not the most recent commit)

```bash
# Navigate to your repository
cd "D:\Product Development\Adminizer\Adminizer 2.0\project"

# Start an interactive rebase from the commit before the problematic one
git rebase -i 666b0234ce60609f98a3ebab007239d5c7a98774~1

# In the editor that opens:
# - Change 'pick' to 'edit' for commit 666b0234ce60609f98a3ebab007239d5c7a98774
# - Save and close the editor

# Remove the API key from .env.development
# (The files have already been cleaned in this workspace)

# Add the changes
git add .

# Continue the rebase
git rebase --continue

# Force push to overwrite the remote history
git push origin master --force
```

### Option 3: Reset and Re-commit (Simplest - if you don't mind losing commit messages)

```bash
# Navigate to your repository
cd "D:\Product Development\Adminizer\Adminizer 2.0\project"

# Find the commit before the problematic one
git log --oneline

# Reset to the commit before the API key was added
# Replace COMMIT_HASH with the hash of the commit BEFORE 666b0234ce60609f98a3ebab007239d5c7a98774
git reset --soft COMMIT_HASH

# Stage all current files (which now have the API key removed)
git add .

# Create a new commit
git commit -m "Update configuration files"

# Force push
git push origin master --force
```

## Important Notes

1. **Revoke the API Key**: Since the API key was exposed in the git history, you should:
   - Go to your Anthropic console
   - Revoke the exposed API key (`sk-ant-api03-9a72fUlNY4-Q_...`)
   - Generate a new API key
   - Add it to Netlify's environment variables

2. **Environment Variables Setup**:
   - For local development: Create a `.env.local` file with your API key (this file is now git-ignored)
   - For Netlify: Add `VITE_ANTHROPIC_API_KEY` to Netlify's environment variables
     - Go to: Site settings > Environment variables > Add new variable

3. **Files Updated**:
   - `.env` - Removed the API key, added instructions
   - `.env.development` - Already clean
   - `.gitignore` - Created to prevent committing `.env.local` files

## Verify the Fix

After completing the above steps:

```bash
# Verify no secrets in recent commits
git log -p -5 | grep -i "sk-ant-api"

# If nothing is found, you're good to push
git push origin master
```

## Need Help?

If you encounter issues:
1. Check GitHub's guide: https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection
2. Consider using GitHub's "allow the secret" option if this is a test/demo key (not recommended for production)

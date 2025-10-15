#!/bin/bash

# Quick Sync Script for Adminizer Demo
# This script helps sync changes from Bolt to GitHub

echo "🚀 Adminizer Demo Sync Script"
echo "================================"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    echo "Please run this script from your adminizer project directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Check git status
echo "📊 Checking git status..."
git status --porcelain

echo ""
echo "🔄 Steps to sync your Bolt changes:"
echo ""
echo "1. Download your project from Bolt (click download button)"
echo "2. Extract the downloaded ZIP file"
echo "3. Copy the extracted files to this directory"
echo "4. Run the following commands:"
echo ""
echo "   npm install"
echo "   npm run build:demo"
echo "   git add ."
echo "   git commit -m 'Update: Latest changes from Bolt'"
echo "   git push origin main"
echo ""

# Ask if user wants to continue with automated steps
read -p "Have you already copied the Bolt files here? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Installing dependencies..."
    npm install
    
    echo "🏗️  Building demo version..."
    npm run build:demo
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        
        echo "📝 Adding changes to git..."
        git add .
        
        echo "💾 Committing changes..."
        git commit -m "Update: Latest dashboard and department changes from Bolt"
        
        echo "🚀 Pushing to GitHub..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Success! Your changes have been pushed to GitHub"
            echo ""
            echo "🌐 Your demo will be available at:"
            echo "   GitHub Pages: https://$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\)\/\([^.]*\).*/\1.github.io\/\2/')/"
            echo ""
            echo "⏱️  Allow 2-3 minutes for deployment to complete"
            echo "🔄 Netlify will also update automatically if connected"
        else
            echo "❌ Error pushing to GitHub. Please check your git configuration."
        fi
    else
        echo "❌ Build failed. Please check for errors and try again."
    fi
else
    echo ""
    echo "📋 Manual steps:"
    echo "1. Download project from Bolt"
    echo "2. Extract and copy files to: $(pwd)"
    echo "3. Run this script again"
fi

echo ""
echo "🔍 Need help? Check the sync-changes-guide.md file"
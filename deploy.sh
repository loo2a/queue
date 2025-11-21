#!/bin/bash

# Script to deploy Queue Management System to GitHub Pages

echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "⚠️  Git repository not found. Initializing..."
    git init
fi

# Check if remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No GitHub repository set. Please run:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Add all files
echo "📁 Adding files to git..."
git add .

# Check if firebase-config.js exists
if [ ! -f "firebase-config.js" ]; then
    echo "⚠️  firebase-config.js not found. Creating from template..."
    cp firebase-config-template.js firebase-config.js
    echo "⚠️  Please edit firebase-config.js with your Firebase credentials before deploying!"
    echo "After editing, run this script again."
    exit 1
fi

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy Queue Management System"

# Push to main branch
echo "📤 Pushing to GitHub..."
git push -u origin main

# Check if GitHub Pages is enabled
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your GitHub repository settings"
echo "2. Scroll down to 'Pages' section"
echo "3. Select 'Deploy from a branch'"
echo "4. Choose 'main' branch and '/ (root)' folder"
echo "5. Click 'Save'"
echo ""
echo "🌐 Your system will be available at:"
echo "https://YOUR_USERNAME.github.io/YOUR_REPO/"
echo ""
echo "📖 Don't forget to:"
echo "- Edit firebase-config.js with your Firebase credentials"
echo "- Test the system before production use"
echo "- Configure Firebase security rules"
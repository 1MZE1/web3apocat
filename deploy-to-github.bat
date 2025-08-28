@echo off
echo 🐱💥 APOCAT Game - GitHub Deployment Script
echo ==========================================

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Git found

REM Initialize git repository if not already initialized
if not exist ".git" (
    echo 📁 Initializing Git repository...
    git init
    git branch -M main
) else (
    echo ✅ Git repository already initialized
)

REM Add all files
echo 📦 Adding files to Git...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "🚀 Launch APOCAT Game - apoCATlypse Meow with Web3 integration"

REM Add remote origin (replace with your repository URL)
echo 🔗 Setting up remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/1MZE1/web3apocat.git

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push -u origin main

echo.
echo 🎉 APOCAT Game successfully deployed to GitHub!
echo 🌐 Your game will be available at:
echo    https://1mze1.github.io/web3apocat/
echo.
echo 📋 Next steps:
echo 1. Go to your GitHub repository settings
echo 2. Enable GitHub Pages
echo 3. Set source to "Deploy from a branch"
echo 4. Select "main" branch and "/ (root)" folder
echo 5. Your game will be live in a few minutes!
echo.
echo 🐱⚔️ Ready to launch the apoCATlypse!
pause

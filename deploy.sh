#!/bin/bash

# APOCAT Game Deployment Script
echo "🐱💥 APOCAT Game Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the APOCAT_GAME_DEPLOY directory."
    exit 1
fi

echo "✅ Found game files"

# Create a timestamp for this deployment
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "📅 Deployment timestamp: $TIMESTAMP"

# Create a deployment package
echo "📦 Creating deployment package..."
mkdir -p "dist"
cp -r * dist/ 2>/dev/null || true
rm -f dist/deploy.sh 2>/dev/null || true

echo "🔍 Validating files..."

# Check required files
REQUIRED_FILES=("index.html" "js/game.js" "js/web3.js" "package.json" "README.md")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

echo ""
echo "🚀 APOCAT Game is ready for deployment!"
echo ""
echo "📋 Deployment Options:"
echo "1. 🌐 GitHub Pages:"
echo "   - Push to GitHub repository"
echo "   - Enable GitHub Pages in repository settings"
echo "   - Access at: https://yourusername.github.io/apocat-game"
echo ""
echo "2. 🔥 Firebase Hosting:"
echo "   - npm install -g firebase-tools"
echo "   - firebase login"
echo "   - firebase init hosting"
echo "   - firebase deploy"
echo ""
echo "3. 📡 Netlify:"
echo "   - Drag and drop the 'dist' folder to netlify.com/drop"
echo "   - Or connect GitHub repository"
echo ""
echo "4. 🌊 Vercel:"
echo "   - npm install -g vercel"
echo "   - vercel --prod"
echo ""
echo "5. 🐙 Traditional Web Hosting:"
echo "   - Upload contents of 'dist' folder to your web server"
echo "   - Ensure HTTPS is enabled for Web3 functionality"
echo ""
echo "⚠️  Important Notes:"
echo "- Ensure HTTPS is enabled for Web3/MetaMask functionality"
echo "- Test wallet connectivity after deployment"
echo "- Configure token distribution bot for production"
echo ""
echo "🎮 Game Features Ready:"
echo "✅ Apocalyptic wasteland theme"
echo "✅ Progressive difficulty system"
echo "✅ APOCAT MEOW token integration"
echo "✅ Community chat system"
echo "✅ Leaderboard with token tracking"
echo "✅ MetaMask wallet connectivity"
echo "✅ Mobile-responsive design"
echo ""
echo "🔗 Next Steps:"
echo "1. Deploy to your chosen platform"
echo "2. Set up token distribution bot"
echo "3. Configure analytics and monitoring"
echo "4. Share with the APOCAT community!"
echo ""
echo "🐱⚔️ Ready to launch the apoCATlypse! 🔥"

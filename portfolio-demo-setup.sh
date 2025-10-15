#!/bin/bash

# Portfolio Demo Setup Script
echo "🎯 Setting up Adminezer demo for portfolio integration..."
echo ""

# Build the demo version
echo "📦 Building demo version..."
npm run build:demo

echo ""
echo "✅ Demo build complete!"
echo ""
echo "🚀 Integration Options:"
echo ""
echo "Option 1 (Recommended): Subdirectory"
echo "  • Upload dist/ contents to: kyleseanportfolio.com/adminezer/"
echo "  • Demo URL: https://kyleseanportfolio.com/adminezer"
echo ""
echo "Option 2: Subdomain"
echo "  • Create subdomain: adminezer.kyleseanportfolio.com"
echo "  • Upload dist/ contents to subdomain root"
echo ""
echo "Option 3: Modal/Iframe"
echo "  • Upload dist/ contents to: kyleseanportfolio.com/adminezer/"
echo "  • Embed in portfolio using iframe"
echo ""
echo "📋 Next Steps:"
echo "1. Choose your integration method"
echo "2. Upload the dist/ folder contents"
echo "3. Update your portfolio to link to the demo"
echo "4. Test the integration"
echo ""
echo "💡 Pro Tip: Use the subdirectory approach for best SEO and user experience!"
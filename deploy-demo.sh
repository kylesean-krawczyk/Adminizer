#!/bin/bash

# Deploy Demo Version to Portfolio Domain
echo "Building demo version for kyleseanportfolio.com..."
npm run build:demo

echo "Demo build complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Upload the 'dist' folder contents to kyleseanportfolio.com"
echo "2. The demo will be available at: https://kyleseanportfolio.com"
echo ""
echo "📋 Demo Features:"
echo "• Purple 'Portfolio Demo Mode' banner"
echo "• Sample organization: Acme Nonprofit Foundation"
echo "• Pre-populated demo data"
echo "• All features functional with fake data"
echo "• Perfect for showcasing your development skills"
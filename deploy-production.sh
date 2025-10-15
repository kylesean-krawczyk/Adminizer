#!/bin/bash

# Deploy Production Version
echo "Building production version..."
npm run build:production

echo "Production build complete! Deploy the 'dist' folder to your production domain."
echo "Example: app.yourdomain.com or yourdomain.com"
#!/bin/bash
echo "🚀 Running performance tests..."

# Install lighthouse globally
npm install -g lighthouse

# Test desktop performance
echo "Testing desktop performance..."
lighthouse http://localhost:3000 \
  --chrome-flags="--headless" \
  --output=html \
  --output-path=./lighthouse-desktop.html \
  --preset=desktop

# Test mobile performance  
echo "Testing mobile performance..."
lighthouse http://localhost:3000 \
  --chrome-flags="--headless" \
  --output=html \
  --output-path=./lighthouse-mobile.html \
  --preset=mobile

echo "✅ Performance reports generated:"
echo "📊 Desktop: lighthouse-desktop.html"
echo "📱 Mobile: lighthouse-mobile.html"

#!/bin/bash
echo "📊 Analyzing bundle composition..."

# Install bundle analyzer
npm install -g webpack-bundle-analyzer

# Analyze the main bundle
webpack-bundle-analyzer build/static/js/main.*.js -p 8888 -O

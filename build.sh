#!/bin/bash

set -e

echo "🚀 Starting Cooperative ERP Platform Build Process"
echo "=================================================="

# Step 1: Install root dependencies
echo "📦 Installing root dependencies..."
npm install --legacy-peer-deps --force

# Step 2: Navigate to frontend and install dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps --force

# Step 3: Set environment variables and build
echo "🔨 Building React application..."
export SKIP_PREFLIGHT_CHECK=true
export CI=false
export TSC_COMPILE_ON_ERROR=true
export ESLINT_NO_DEV_ERRORS=true
export GENERATE_SOURCEMAP=false

# Build the React app
npm run build

echo "✅ Build completed successfully!"
echo "📁 Build output is in frontend/build/"
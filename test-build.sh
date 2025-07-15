#!/bin/bash

echo "🔧 Testing Vercel Build Configuration Locally"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Step 1: Checking project structure...${NC}"

# Check if required files exist
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Root package.json not found${NC}"
    exit 1
fi

if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Error: vercel.json not found${NC}"
    exit 1
fi

if [ ! -f ".npmrc" ]; then
    echo -e "${RED}❌ Error: Root .npmrc not found${NC}"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: frontend directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required files and directories found${NC}"

echo -e "${BLUE}📦 Step 2: Installing dependencies (simulating Vercel)...${NC}"

# Install root dependencies with legacy peer deps
npm install --legacy-peer-deps --force

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to install root dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Root dependencies installed successfully${NC}"

echo -e "${BLUE}🔨 Step 3: Building project (simulating Vercel)...${NC}"

# Run the build command that Vercel will use
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Step 4: Checking build output...${NC}"

# Check if build directory exists
if [ ! -d "frontend/build" ]; then
    echo -e "${RED}❌ Error: Build directory not found${NC}"
    exit 1
fi

# Check if index.html exists
if [ ! -f "frontend/build/index.html" ]; then
    echo -e "${RED}❌ Error: index.html not found in build directory${NC}"
    exit 1
fi

# Check if static assets exist
if [ ! -d "frontend/build/static" ]; then
    echo -e "${RED}❌ Error: Static assets directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build output looks good${NC}"

echo -e "${BLUE}📊 Step 5: Build summary...${NC}"

# Display build size
BUILD_SIZE=$(du -sh frontend/build 2>/dev/null | cut -f1)
echo -e "${BLUE}   Build size: ${BUILD_SIZE}${NC}"

# Count number of files
FILE_COUNT=$(find frontend/build -type f | wc -l)
echo -e "${BLUE}   Files generated: ${FILE_COUNT}${NC}"

echo -e "${GREEN}🎉 SUCCESS: Your build is ready for Vercel deployment!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Commit and push your changes to GitHub"
echo "2. Import your repository in Vercel dashboard"
echo "3. Set these environment variables in Vercel:"
echo "   - REACT_APP_API_URL=https://your-backend-api.herokuapp.com/api/v1"
echo "   - CI=false"
echo "   - SKIP_PREFLIGHT_CHECK=true"
echo "4. Deploy!"
echo ""
echo -e "${BLUE}📚 For detailed instructions, see VERCEL_DEPLOYMENT_FIXED.md${NC}"

# Optional: Start local server to test
echo -e "${BLUE}🚀 Want to test the build locally?${NC}"
echo "Run: npx serve -s frontend/build"
echo ""
echo -e "${GREEN}🎯 Your Cooperative ERP Platform is ready for production!${NC}"
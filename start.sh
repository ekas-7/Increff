#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting AI-Enhanced Autocomplete System${NC}"
echo "=========================================="

# Check if MongoDB is running
echo -e "${BLUE}📊 Checking MongoDB connection...${NC}"
if ! mongosh --eval "db.runCommand('ping').ok" mongodb://localhost:27017/autocomplete_db --quiet > /dev/null 2>&1; then
    echo -e "${RED}❌ MongoDB is not running or not accessible${NC}"
    echo -e "${RED}Please start MongoDB first:${NC}"
    echo "   - macOS (Homebrew): brew services start mongodb-community"
    echo "   - Linux (systemd): sudo systemctl start mongod"
    echo "   - Or use MongoDB Atlas cloud service"
    exit 1
fi
echo -e "${GREEN}✅ MongoDB is running${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create a .env file with:"
    echo "MONGODB_URI=mongodb://localhost:27017/autocomplete_db"
    echo "OPENAI_API_KEY=your_openai_api_key_here"
    echo "PORT=3001"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"

# Start backend server in background
echo -e "${BLUE}🔧 Starting backend server on port 3001...${NC}"
npm run server &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Backend server started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start backend server${NC}"
    exit 1
fi

# Start frontend server
echo -e "${BLUE}🌐 Starting frontend server on port 3000...${NC}"
npm run dev

# Cleanup function
cleanup() {
    echo -e "\n${BLUE}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

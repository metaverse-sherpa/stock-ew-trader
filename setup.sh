#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print with color
echo_color() {
    echo -e "${1}${2}${NC}"
}

# Check if Docker is installed and running
echo_color "$YELLOW" "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo_color "$YELLOW" "Docker not found. Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo_color "$YELLOW" "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Create docker-compose.yml if it doesn't exist
if [ ! -f "docker-compose.yml" ]; then
    echo_color "$YELLOW" "Creating docker-compose.yml..."
    cat > docker-compose.yml << 'EOL'
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
EOL
fi

# Create Dockerfile if it doesn't exist
if [ ! -f "Dockerfile" ]; then
    echo_color "$YELLOW" "Creating Dockerfile..."
    cat > Dockerfile << 'EOL'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Set permissions
RUN chmod -R 755 scripts/
RUN chmod -R 755 node_modules/.bin/

EXPOSE 3000

CMD ["npm", "run", "dev"]
EOL
fi

# Create .env.example if it doesn't exist
if [ ! -f ".env.example" ]; then
    echo_color "$YELLOW" "Creating .env.example..."
    cat > .env.example << 'EOL'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Base Path
VITE_BASE_PATH=/

# Environment flag for Tempo
VITE_TEMPO=true
EOL
fi

# Set correct permissions
echo_color "$YELLOW" "Setting file permissions..."
chmod +x scripts/*
chmod -R 755 .

# Build and start containers
echo_color "$YELLOW" "Building and starting Docker containers..."
docker compose up --build -d

# Wait for containers to be ready
echo_color "$YELLOW" "Waiting for containers to be ready..."
sleep 10

echo_color "$GREEN" "
Setup completed successfully!

Next steps:
1. Copy .env.example to .env and update with your Supabase credentials
2. Run 'docker compose exec app npm run seed' to populate the database
3. Visit http://localhost:3000 in your browser

To view logs, run: docker compose logs -f
"
#!/bin/bash

# Neo-docs deployment script for DigitalOcean droplet
set -e

echo "🚀 Starting Neo-docs deployment..."

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Clone or update repository
if [ -d "neo-docs" ]; then
    echo "📥 Updating repository..."
    cd neo-docs
    git pull origin master
else
    echo "📥 Cloning repository..."
    git clone https://github.com/omar-elbaz/neo-docs.git
    cd neo-docs
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please create .env file with required variables."
    echo "See .env.example for reference"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Pull latest images and build
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment complete!"
echo "🌐 Your application should be available at:"
echo "   Frontend: http://$(curl -s ifconfig.me)"
echo "   Backend API: http://$(curl -s ifconfig.me):3001"
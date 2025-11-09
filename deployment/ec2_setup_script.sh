#!/bin/bash

# XYZ Chatbot Backend - EC2 Setup Script
# Run this script on your EC2 instance after connecting via SSH

set -e  # Exit on error

echo "=========================================="
echo "XYZ Chatbot Backend Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as ubuntu user."
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
print_status "Installing Python 3.11..."
sudo apt install -y python3.11 python3.11-venv python3-pip git curl

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_status "Docker installed successfully"
else
    print_status "Docker already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt install -y docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose already installed"
fi

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Install Certbot
print_status "Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Create application directory
APP_DIR="$HOME/xyz-chatbot"
print_status "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR

# Prompt for API keys
echo ""
print_warning "API Keys Configuration"
echo "Please enter your API keys (they will not be displayed):"
echo ""

read -p "OpenAI API Key: " -s OPENAI_KEY
echo ""
read -p "Tavily API Key: " -s TAVILY_KEY
echo ""

# Create .env file
print_status "Creating .env file..."
cat > $APP_DIR/.env << EOF
OPENAI_API_KEY=$OPENAI_KEY
TAVILY_API_KEY=$TAVILY_KEY
OPENAI_MODEL=gpt-4
HOST=0.0.0.0
PORT=8000
EOF

print_status ".env file created successfully"

# Create directory structure
print_status "Creating directory structure..."
mkdir -p chroma_db uploads

# Prompt for deployment method
echo ""
print_warning "Deployment Method Selection"
echo "Choose deployment method:"
echo "1) Docker (Recommended)"
echo "2) Systemd Service"
read -p "Enter choice (1 or 2): " DEPLOY_METHOD

if [ "$DEPLOY_METHOD" == "1" ]; then
    print_status "Deploying with Docker..."
    
    # Check if files exist
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found. Please upload all files first."
        exit 1
    fi
    
    # Build and start
    docker-compose up -d
    
    print_status "Application started with Docker"
    print_status "Checking status..."
    sleep 5
    docker-compose ps
    
elif [ "$DEPLOY_METHOD" == "2" ]; then
    print_status "Deploying with Systemd..."
    
    # Create virtual environment
    print_status "Creating virtual environment..."
    python3.11 -m venv venv
    source venv/bin/activate
    
    # Install requirements
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found. Please upload all files first."
        exit 1
    fi
    
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Create systemd service
    print_status "Creating systemd service..."
    sudo tee /etc/systemd/system/xyz-chatbot.service > /dev/null << EOF
[Unit]
Description=XYZ Chatbot Backend API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
EnvironmentFile=$APP_DIR/.env
ExecStart=$APP_DIR/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable and start service
    sudo systemctl daemon-reload
    sudo systemctl enable xyz-chatbot
    sudo systemctl start xyz-chatbot
    
    print_status "Service started successfully"
    sleep 3
    sudo systemctl status xyz-chatbot --no-pager
else
    print_error "Invalid choice. Exiting."
    exit 1
fi

# Configure Nginx
print_status "Configuring Nginx..."
read -p "Enter your domain name (or press Enter to use IP address): " DOMAIN

if [ -z "$DOMAIN" ]; then
    DOMAIN="_"
    print_warning "Using default server block (accessible via IP)"
fi

sudo tee /etc/nginx/sites-available/xyz-chatbot > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/xyz-chatbot /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
print_status "Restarting Nginx..."
sudo systemctl restart nginx

# Configure UFW firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp

# SSL Setup
if [ "$DOMAIN" != "_" ]; then
    echo ""
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " SETUP_SSL
    if [ "$SETUP_SSL" == "y" ]; then
        print_status "Setting up SSL..."
        read -p "Enter your email for SSL certificate: " EMAIL
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect
        print_status "SSL configured successfully"
    fi
fi

# Test the API
echo ""
print_status "Testing API..."
sleep 3

if curl -f http://localhost:8000/health &> /dev/null; then
    print_status "API is responding successfully!"
else
    print_error "API is not responding. Check logs for issues."
fi

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)

# Print summary
echo ""
echo "=========================================="
print_status "Setup Complete!"
echo "=========================================="
echo ""
echo "Your XYZ Chatbot Backend is now running!"
echo ""
echo "Access URLs:"
if [ "$DOMAIN" != "_" ]; then
    echo "  - https://$DOMAIN"
    echo "  - http://$DOMAIN"
fi
echo "  - http://$PUBLIC_IP"
echo "  - http://localhost:8000 (from this server)"
echo ""
echo "API Endpoints:"
echo "  - GET  /health          - Health check"
echo "  - POST /upload          - Upload documents"
echo "  - POST /query           - Send chat queries"
echo "  - GET  /documents       - List documents"
echo "  - DELETE /documents     - Clear documents"
echo ""
echo "Useful Commands:"
if [ "$DEPLOY_METHOD" == "1" ]; then
    echo "  - View logs:        docker-compose logs -f"
    echo "  - Restart:          docker-compose restart"
    echo "  - Stop:             docker-compose down"
    echo "  - Update:           git pull && docker-compose up -d --build"
else
    echo "  - View logs:        sudo journalctl -u xyz-chatbot -f"
    echo "  - Restart:          sudo systemctl restart xyz-chatbot"
    echo "  - Stop:             sudo systemctl stop xyz-chatbot"
    echo "  - Status:           sudo systemctl status xyz-chatbot"
fi
echo ""
print_warning "Note: Update your frontend API URL to: http://$PUBLIC_IP:8000"
if [ "$DOMAIN" != "_" ]; then
    print_warning "Or use: https://$DOMAIN"
fi
echo ""
print_status "Setup script completed successfully!"
echo ""
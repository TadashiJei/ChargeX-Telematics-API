#!/bin/bash

# ChargeX Telematics Automatic VPS Deployment Script
# This script will automatically install and configure all necessary components
# for running the ChargeX Telematics application on a VPS.

# Configuration variables - change these as needed
APP_DOMAIN="chargex-api.yourdomain.com"
DOCS_DOMAIN="docs.chargex-api.yourdomain.com"
APP_PORT=3000
DOCS_PORT=3050
INSTALL_DIR="/var/www/chargex-telematics"
ENABLE_SSL=true
SETUP_FIREWALL=true

# Colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${GREEN}=== ChargeX Telematics Automatic Deployment ===${NC}"
echo -e "${YELLOW}This script will install and configure all necessary components.${NC}"
echo -e "${YELLOW}It requires sudo privileges for system-level operations.${NC}"
echo ""

# Check if running as root or with sudo
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${YELLOW}This script must be run with sudo. Attempting to use sudo for commands...${NC}"
    SUDO="sudo"
else
    SUDO=""
 fi

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success: $1${NC}"
    else
        echo -e "\033[0;31m✗ Error: $1 failed. Please check the output above for details.${NC}"
        exit 1
    fi
}

# 1. Update system packages
print_section "Updating System Packages"
echo "Updating package lists..."
$SUDO apt-get update
check_success "Package list update"

echo "Upgrading packages..."
$SUDO apt-get upgrade -y
check_success "Package upgrade"

# 2. Install required packages
print_section "Installing Required Packages"

# Install Node.js and npm
if ! command -v node &> /dev/null; then
    echo "Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO bash -
    $SUDO apt-get install -y nodejs
    check_success "Node.js installation"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node --version)${NC}"
fi

# Install MongoDB
if ! command -v mongod &> /dev/null; then
    echo "Installing MongoDB..."
    $SUDO apt-get install -y mongodb
    $SUDO systemctl enable mongodb
    $SUDO systemctl start mongodb
    check_success "MongoDB installation"
else
    echo -e "${GREEN}✓ MongoDB already installed${NC}"
fi

# Install Redis
if ! command -v redis-server &> /dev/null; then
    echo "Installing Redis..."
    $SUDO apt-get install -y redis-server
    $SUDO systemctl enable redis-server
    $SUDO systemctl start redis-server
    check_success "Redis installation"
else
    echo -e "${GREEN}✓ Redis already installed${NC}"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    $SUDO apt-get install -y nginx
    $SUDO systemctl enable nginx
    $SUDO systemctl start nginx
    check_success "Nginx installation"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    $SUDO npm install -g pm2
    check_success "PM2 installation"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi

# 3. Create application directory and set permissions
print_section "Setting Up Application Directory"
echo "Creating application directory at $INSTALL_DIR..."
$SUDO mkdir -p $INSTALL_DIR
$SUDO chown -R $USER:$USER $INSTALL_DIR
check_success "Directory setup"

# 4. Clone repository or copy files
print_section "Deploying Application Code"

# Check if we're running from the application directory or need to clone
if [ -f "./package.json" ] && [ -d "./src" ]; then
    echo "Detected local application files. Copying to installation directory..."
    rsync -av --exclude="node_modules" --exclude=".git" ./ $INSTALL_DIR/
    check_success "File copy"
else
    echo "Cloning repository..."
    git clone https://github.com/TadashiJei/ChargeX-Telematics-API.git $INSTALL_DIR
    check_success "Repository clone"
fi

# 5. Install application dependencies
print_section "Installing Application Dependencies"
cd $INSTALL_DIR

echo "Installing main application dependencies..."
npm install --production
check_success "Main dependencies installation"

echo "Installing API docs dependencies..."
cd api-docs
npm install --production
check_success "API docs dependencies installation"
cd ..

# 6. Configure environment
print_section "Configuring Environment"
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/JWT_SECRET=your_jwt_secret_key/JWT_SECRET=$JWT_SECRET/g" .env
    
    # Set production environment
    sed -i "s/NODE_ENV=development/NODE_ENV=production/g" .env
    
    check_success "Environment configuration"
    echo -e "${YELLOW}Note: Please review and update the .env file with your specific settings.${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# 7. Configure Nginx
print_section "Configuring Nginx"
echo "Creating Nginx configuration..."

NGINX_CONF="server {
    listen 80;
    server_name $APP_DOMAIN;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80;
    server_name $DOCS_DOMAIN;

    location / {
        proxy_pass http://localhost:$DOCS_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}"

echo "$NGINX_CONF" | $SUDO tee /etc/nginx/sites-available/chargex-telematics > /dev/null
$SUDO ln -sf /etc/nginx/sites-available/chargex-telematics /etc/nginx/sites-enabled/
$SUDO nginx -t
check_success "Nginx configuration"

$SUDO systemctl restart nginx
check_success "Nginx restart"

# 8. Set up SSL with Certbot (if enabled)
if [ "$ENABLE_SSL" = true ]; then
    print_section "Setting Up SSL"
    
    if ! command -v certbot &> /dev/null; then
        echo "Installing Certbot..."
        $SUDO apt-get install -y certbot python3-certbot-nginx
        check_success "Certbot installation"
    fi
    
    echo "Obtaining SSL certificates..."
    echo -e "${YELLOW}Note: This will only work if your domain is properly configured to point to this server.${NC}"
    echo -e "${YELLOW}If you're testing, you may want to use the --staging flag with certbot.${NC}"
    
    read -p "Do you want to proceed with SSL setup? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $SUDO certbot --nginx -d $APP_DOMAIN -d $DOCS_DOMAIN
        check_success "SSL certificate installation"
    else
        echo -e "${YELLOW}SSL setup skipped. You can run certbot manually later.${NC}"
    fi
fi

# 9. Configure firewall
if [ "$SETUP_FIREWALL" = true ]; then
    print_section "Configuring Firewall"
    
    if command -v ufw &> /dev/null; then
        echo "Setting up firewall rules..."
        $SUDO ufw allow ssh
        $SUDO ufw allow http
        $SUDO ufw allow https
        
        # Only enable if not already enabled to prevent being locked out
        if ! $SUDO ufw status | grep -q "Status: active"; then
            echo "Enabling firewall..."
            echo "y" | $SUDO ufw enable
        fi
        
        check_success "Firewall configuration"
    else
        echo -e "${YELLOW}UFW not installed. Skipping firewall setup.${NC}"
    fi
fi

# 10. Start application with PM2
print_section "Starting Application"
echo "Starting main application..."
pm2 start src/server.js --name chargex-telematics
check_success "Main application startup"

echo "Starting API documentation server..."
cd api-docs
pm2 start server.js --name chargex-api-docs
check_success "API docs startup"
cd ..

# 11. Configure PM2 to start on boot
print_section "Configuring Startup"
echo "Setting up PM2 to start on system boot..."
pm2 save
$SUDO env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
check_success "PM2 startup configuration"

# 12. Create systemd service as an alternative
print_section "Creating Systemd Service"
echo "Creating systemd service file..."

SYSTEMD_SERVICE="[Unit]
Description=ChargeX Telematics API Service
After=network.target mongodb.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which node) src/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT

[Install]
WantedBy=multi-user.target"

echo "$SYSTEMD_SERVICE" | $SUDO tee /etc/systemd/system/chargex-telematics.service > /dev/null
$SUDO systemctl daemon-reload
check_success "Systemd service creation"

echo -e "${YELLOW}Note: The application is currently managed by PM2. To use systemd instead, run:${NC}"
echo -e "${YELLOW}  pm2 delete all${NC}"
echo -e "${YELLOW}  sudo systemctl enable chargex-telematics.service${NC}"
echo -e "${YELLOW}  sudo systemctl start chargex-telematics.service${NC}"

# 13. Final summary
print_section "Deployment Complete"
echo -e "${GREEN}ChargeX Telematics has been successfully deployed!${NC}"
echo ""
echo -e "${BLUE}Main application:${NC} http://$APP_DOMAIN"
echo -e "${BLUE}API documentation:${NC} http://$DOCS_DOMAIN"
echo ""
echo -e "${BLUE}Local access:${NC}"
echo -e "  Main application: http://localhost:$APP_PORT"
echo -e "  API documentation: http://localhost:$DOCS_PORT"
echo ""
echo -e "${BLUE}Management commands:${NC}"
echo -e "  View logs: ${YELLOW}pm2 logs${NC}"
echo -e "  Restart apps: ${YELLOW}pm2 restart all${NC}"
echo -e "  Application status: ${YELLOW}pm2 status${NC}"
echo ""
echo -e "${BLUE}Configuration files:${NC}"
echo -e "  Environment: ${YELLOW}$INSTALL_DIR/.env${NC}"
echo -e "  Nginx: ${YELLOW}/etc/nginx/sites-available/chargex-telematics${NC}"
echo -e "  Systemd: ${YELLOW}/etc/systemd/system/chargex-telematics.service${NC}"
echo ""
echo -e "${GREEN}Thank you for using ChargeX Telematics!${NC}"


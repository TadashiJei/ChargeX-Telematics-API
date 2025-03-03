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
USE_IP_INSTEAD_OF_DOMAIN=false
SERVER_IP="$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"

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
    local critical=${2:-true}
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success: $1${NC}"
        return 0
    else
        if [ "$critical" = true ]; then
            echo -e "\033[0;31m✗ Error: $1 failed. Please check the output above for details.${NC}"
            exit 1
        else
            echo -e "\033[0;33m⚠ Warning: $1 failed, but continuing deployment.${NC}"
            return 1
        fi
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

# Check for environment files in order of preference
if [ -f ".env.production" ]; then
    echo "Found .env.production, using for deployment..."
    cp .env.production .env
    ENV_SOURCE="production"
elif [ -f ".env.example" ]; then
    echo "Found .env.example, copying to .env..."
    cp .env.example .env
    ENV_SOURCE="example"
else
    echo -e "${YELLOW}No environment template found. Creating basic .env file...${NC}"
    cat > .env << EOL
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chargex-telematics

# JWT Authentication
JWT_SECRET=placeholder_jwt_secret

# Feature Flags
ENABLE_ENERGY_TRADING=true
ENABLE_GEOFENCING=true
USE_MOCK_DATA=false
EOL
    ENV_SOURCE="basic"
fi

# Generate secure random keys
echo "Generating secure keys..."

# Generate random JWT secret
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env

# Generate random encryption key if present in file
if grep -q "ENCRYPTION_KEY" .env; then
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|g" .env
fi

# Ensure production environment
sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env

# Ask for MongoDB URI
echo -e "${YELLOW}Do you want to configure MongoDB connection?${NC}"
read -p "Enter MongoDB URI (leave empty to use default): " MONGO_URI
if [ ! -z "$MONGO_URI" ]; then
    # Replace MongoDB URI in .env file
    sed -i "s|MONGODB_URI=.*|MONGODB_URI=$MONGO_URI|g" .env
    echo -e "${GREEN}MongoDB URI updated.${NC}"
fi

# Inform user about environment setup
echo -e "${GREEN}Environment configuration complete using $ENV_SOURCE template.${NC}"
echo -e "${YELLOW}You can edit additional settings in $INSTALL_DIR/.env${NC}"

    check_success "Environment configuration"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
    echo -e "${YELLOW}Note: You may want to review and update the existing .env file.${NC}"
    
    # Ask if user wants to regenerate secure keys in existing .env
    read -p "Do you want to regenerate secure keys in the existing .env file? (y/n) [default: n]: " REGEN_KEYS
    if [[ "$REGEN_KEYS" =~ ^[Yy]$ ]]; then
        # Generate random JWT secret
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
        
        # Generate random encryption key if present in file
        if grep -q "ENCRYPTION_KEY" .env; then
            ENCRYPTION_KEY=$(openssl rand -base64 32)
            sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|g" .env
        fi
        
        echo -e "${GREEN}Secure keys regenerated.${NC}"
    fi
fi

# 7. Configure Nginx
print_section "Configuring Nginx"

# Ask if we should use IP address instead of domains
echo -e "${YELLOW}Do you want to use the server IP address instead of domain names?${NC}"
echo -e "${YELLOW}This is useful for testing when you don't have domain names configured.${NC}"
read -p "Use IP address? (y/n) [default: n]: " USE_IP_RESPONSE
if [[ "$USE_IP_RESPONSE" =~ ^[Yy]$ ]]; then
    USE_IP_INSTEAD_OF_DOMAIN=true
    echo -e "${GREEN}Using server IP address: $SERVER_IP${NC}"
    
    # Configure for IP-based access
    APP_LOCATION="/"
    DOCS_LOCATION="/docs/"
    
    NGINX_CONF="server {
    listen 80;
    server_name $SERVER_IP;

    location $APP_LOCATION {
        proxy_pass http://localhost:$APP_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location $DOCS_LOCATION {
        proxy_pass http://localhost:$DOCS_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}"

    # Disable SSL for IP-based setup
    ENABLE_SSL=false
    echo -e "${YELLOW}SSL has been disabled for IP-based setup.${NC}"
else
    echo "Creating domain-based Nginx configuration..."
    
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
fi

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
    
    # Email collection with validation
    echo -e "${YELLOW}SSL setup requires a valid email address for certificate renewal notifications.${NC}"
    
    # Function to validate email format
    validate_email() {
        local email=$1
        if [[ $email =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            return 0
        else
            return 1
        fi
    }
    
    # Default email (you can change this)
    DEFAULT_EMAIL="admin@chargex-telematics.com"
    
    # Keep asking until we get a valid email or user decides to skip
    while true; do
        read -p "Enter your email address [default: $DEFAULT_EMAIL] (or type 'skip' to skip SSL setup): " EMAIL_ADDRESS
        
        # Handle skip option
        if [[ "$EMAIL_ADDRESS" == "skip" ]]; then
            echo -e "${YELLOW}SSL setup skipped. You can run certbot manually later.${NC}"
            break
        fi
        
        # Use default if empty
        if [[ -z "$EMAIL_ADDRESS" ]]; then
            EMAIL_ADDRESS="$DEFAULT_EMAIL"
            echo -e "${YELLOW}Using default email: $EMAIL_ADDRESS${NC}"
        fi
        
        # Validate email format
        if validate_email "$EMAIL_ADDRESS"; then
            echo -e "${GREEN}Email address is valid.${NC}"
            
            # Confirm with user
            read -p "Proceed with SSL setup using $EMAIL_ADDRESS? (y/n): " CONFIRM
            if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
                echo "Setting up SSL certificates..."
                $SUDO certbot --nginx --email "$EMAIL_ADDRESS" --agree-tos -d $APP_DOMAIN -d $DOCS_DOMAIN || {
                    echo -e "${YELLOW}SSL setup failed. Continuing without SSL.${NC}"
                    # Don't exit on SSL failure, just continue
                }
                break
            else
                echo "Let's try again."
            fi
        else
            echo -e "\033[0;31mInvalid email format. Please enter a valid email address.${NC}"
        fi
    done
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

if [ "$USE_IP_INSTEAD_OF_DOMAIN" = true ]; then
    echo -e "${BLUE}Access your application at:${NC}"
    echo -e "  Main application: http://$SERVER_IP$APP_LOCATION"
    echo -e "  API documentation: http://$SERVER_IP$DOCS_LOCATION"
else
    echo -e "${BLUE}Access your application at:${NC}"
    echo -e "  Main application: http://$APP_DOMAIN"
    echo -e "  API documentation: http://$DOCS_DOMAIN"
fi

echo ""
echo -e "${BLUE}Local access (from the server):${NC}"
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


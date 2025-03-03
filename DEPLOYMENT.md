# ChargeX Telematics VPS Deployment Guide

This guide provides detailed instructions for deploying the ChargeX Telematics API and documentation to a Virtual Private Server (VPS).

## Prerequisites

- A VPS running Ubuntu 20.04 or later
- SSH access to your VPS
- A domain name (optional, but recommended)
- Basic knowledge of Linux commands

## Deployment Options

### Option 1: Automated Deployment Script

1. **SSH into your VPS**:
   ```bash
   ssh username@your-vps-ip
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/TadashiJei/ChargeX-Telematics-API.git
   cd ChargeX-Telematics-API
   ```

3. **Make the deployment script executable**:
   ```bash
   chmod +x deploy.sh
   ```

4. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

5. **Update the .env file with your configuration**:
   ```bash
   nano .env
   ```

6. **Restart the application**:
   ```bash
   pm2 restart all
   ```

### Option 2: Manual Deployment

1. **SSH into your VPS**:
   ```bash
   ssh username@your-vps-ip
   ```

2. **Install required dependencies**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y nodejs npm mongodb redis-server nginx
   ```

3. **Clone the repository**:
   ```bash
   git clone https://github.com/TadashiJei/ChargeX-Telematics-API.git
   cd ChargeX-Telematics-API
   ```

4. **Install application dependencies**:
   ```bash
   npm install
   cd api-docs
   npm install
   cd ..
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   nano .env
   ```

6. **Install PM2 globally**:
   ```bash
   sudo npm install -g pm2
   ```

7. **Start the application with PM2**:
   ```bash
   pm2 start src/server.js --name chargex-telematics
   cd api-docs
   pm2 start server.js --name chargex-api-docs
   ```

8. **Set up PM2 to start on system boot**:
   ```bash
   pm2 startup
   pm2 save
   ```

9. **Configure Nginx**:
   ```bash
   sudo cp nginx-config.conf /etc/nginx/sites-available/chargex-telematics
   sudo ln -s /etc/nginx/sites-available/chargex-telematics /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Set up SSL with Certbot (optional but recommended)**:
    ```bash
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d chargex-api.yourdomain.com -d docs.chargex-api.yourdomain.com
    ```

## Setting Up as a Systemd Service (Alternative to PM2)

1. **Copy the service file to systemd**:
   ```bash
   sudo cp chargex-telematics.service /etc/systemd/system/
   ```

2. **Enable and start the service**:
   ```bash
   sudo systemctl enable chargex-telematics
   sudo systemctl start chargex-telematics
   ```

3. **Check the service status**:
   ```bash
   sudo systemctl status chargex-telematics
   ```

## Verifying the Deployment

1. **Check if the main application is running**:
   ```bash
   curl http://localhost:3000/api/v1/status
   ```

2. **Check if the API documentation is running**:
   ```bash
   curl http://localhost:3050
   ```

3. **Access via domain (if configured)**:
   - Main API: `https://chargex-api.yourdomain.com`
   - API Docs: `https://docs.chargex-api.yourdomain.com`

## Troubleshooting

### Application Not Starting

Check the logs:
```bash
pm2 logs
```

### MongoDB or Redis Issues

Check if services are running:
```bash
sudo systemctl status mongodb
sudo systemctl status redis
```

### Nginx Configuration Issues

Check Nginx configuration:
```bash
sudo nginx -t
```

### Firewall Issues

Make sure the required ports are open:
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 3050
```

## Updating the Application

To update the application:

1. **Pull the latest changes**:
   ```bash
   cd /path/to/ChargeX-Telematics-API
   git pull
   ```

2. **Install any new dependencies**:
   ```bash
   npm install
   ```

3. **Restart the application**:
   ```bash
   pm2 restart all
   ```

## Backup Strategy

1. **Database Backup**:
   ```bash
   mongodump --out /path/to/backup/folder
   ```

2. **Application Code Backup**:
   ```bash
   cp -r /path/to/ChargeX-Telematics-API /path/to/backup/folder
   ```

3. **Environment Variables Backup**:
   ```bash
   cp /path/to/ChargeX-Telematics-API/.env /path/to/backup/folder
   ```

## Security Considerations

1. **Set up a firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   ```

2. **Secure MongoDB and Redis**:
   - Configure MongoDB authentication
   - Set a password for Redis
   - Bind to localhost only

3. **Keep the system updated**:
   ```bash
   sudo apt-get update
   sudo apt-get upgrade
   ```

4. **Use SSL/TLS for all connections**

# ChargeX Telematics Environment Configuration Guide

This guide explains how to properly configure the environment variables for your ChargeX Telematics deployment. The system uses a `.env` file to store configuration settings.

## Creating Your .env File

During deployment, the script will automatically create a `.env` file by copying from `.env.example`. You should then edit this file to include your specific configuration values.

```bash
# On your VPS after running deploy.sh
nano /var/www/chargex-telematics/.env
```

## Essential Configuration Categories

### 1. Server Configuration

```
PORT=3000                # The port your API will run on
NODE_ENV=production      # Set to 'production' for deployment
```

### 2. Database Configuration

```
# MongoDB (Required for user management, device registry, etc.)
MONGODB_URI=mongodb://localhost:27017/chargex-telematics
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/chargex-telematics

# InfluxDB (Required for time-series telemetry data)
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=chargex
INFLUXDB_BUCKET=telemetry
```

### 3. Redis Configuration (Required for caching and real-time features)

```
REDIS_URL=redis://localhost:6379
```

### 4. JWT Authentication (Required for API security)

```
JWT_SECRET=your_jwt_secret_key        # Use a strong random string
JWT_EXPIRATION=24h                    # Token expiration time
```

### 5. MQTT Broker (Optional - for IoT device communication)

```
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=chargex
MQTT_PASSWORD=your_mqtt_password
MQTT_CLIENT_ID=chargex-telematics-server
```

### 6. Blockchain Integration (Optional)

```
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
WALLET_PRIVATE_KEY=your_private_key
```

### 7. API Keys (Optional - for external services)

```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
WEATHER_API_KEY=your_weather_api_key
```

### 8. Alerts and Notifications (Optional)

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@chargex.hacktivators.com
SMTP_PASSWORD=your_smtp_password
NOTIFICATION_EMAIL=alerts@chargex.hacktivators.com
```

### 9. Security (Recommended)

```
ENCRYPTION_KEY=your_encryption_key      # For encrypting sensitive data
RATE_LIMIT_WINDOW_MS=900000             # Rate limiting window (15 minutes)
RATE_LIMIT_MAX=100                      # Maximum requests per window
```

### 10. Energy Trading Configuration (Optional)

```
ENABLE_ENERGY_TRADING=true
ENERGY_TRADING_MIN_PRICE=0.05
ENERGY_TRADING_MAX_DISTANCE=50
```

### 11. Feature Flags (Customize as needed)

```
ENABLE_PREDICTIVE_MAINTENANCE=true
ENABLE_BLOCKCHAIN_INTEGRATION=true
ENABLE_GEOFENCING=true
ENABLE_WEATHER_INTEGRATION=true
USE_MOCK_DATA=false                   # Set to true for testing without real devices
```

## Minimum Required Configuration

For a basic deployment, you must configure at least:

1. `MONGODB_URI` - Database connection string
2. `JWT_SECRET` - Security token for API authentication
3. `NODE_ENV=production` - Set environment to production

## Generating Secure Keys

Use these commands to generate secure random strings for your keys:

```bash
# Generate a random JWT secret
openssl rand -hex 32

# Generate an encryption key
openssl rand -base64 32
```

## Testing Your Configuration

After setting up your `.env` file, you can test if it's properly configured:

```bash
# Test the API server
curl http://localhost:3000/api/v1/status

# Test the MongoDB connection
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch(err => console.error(err))"
```

## Troubleshooting

If you encounter issues with your environment configuration:

1. Check log files: `pm2 logs chargex-telematics`
2. Verify MongoDB connection: `mongo $MONGODB_URI`
3. Ensure Redis is running: `redis-cli ping`
4. Restart the application after changing `.env`: `pm2 restart chargex-telematics`

## Security Considerations

- Never commit your `.env` file to version control
- Use different JWT secrets for development and production
- Regularly rotate your API keys and passwords
- Use strong, unique passwords for all services
- Consider using a secrets management service for production deployments

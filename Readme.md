# ChargeX Telematics System

## Overview

The ChargeX Telematics System is a sophisticated IoT solution designed to monitor, track, and manage battery health and performance in real-time. This system serves as the critical link between physical battery assets and the ChargeX blockchain-powered battery leasing platform, enabling advanced features like predictive maintenance, real-time tracking, and usage-based billing.

## Hardware Components

### Communication Module
- **ESP8266 Microcontroller**
  - Wi-Fi enabled microcontroller for data processing and transmission
  - Operating voltage: 3.3V
  - Flash memory: 4MB
  - Clock speed: 80MHz (can be overclocked to 160MHz)

- **SIM800L V2 5V Wireless GSM GPRS Module (Blue)**
  - Cellular connectivity for remote areas without Wi-Fi
  - Quad-band GSM/GPRS: 850/900/1800/1900MHz
  - Power supply: 5V (with voltage regulation)
  - Features: SMS, voice calls, and GPRS data transmission
  - Integrated TCP/IP stack for HTTP communication

### GPS Tracking
- **GY-NEO6MV2 NEO-6M / NEO-M8N Flight Controller GPS Module**
  - High-precision positioning for real-time battery tracking
  - Position accuracy: 2.5m CEP (NEO-6M) / 1.5m CEP (NEO-M8N)
  - Cold start acquisition: 27s (NEO-6M) / 26s (NEO-M8N)
  - Hot start acquisition: <1s
  - Operating voltage: 3.3-5V
  - Update rate: 5Hz (configurable)
  - Interface: UART (TTL)

### Battery Management System (BMS)
- **4S BW-4S-S30A Battery Protection Board BMS PCM**
  - Protects and monitors 4-cell lithium battery packs
  - Maximum continuous discharge current: 30A
  - Overcharge protection: 4.25-4.35V per cell
  - Over-discharge protection: 2.3-2.4V per cell
  - Short circuit protection: Automatic cutoff
  - Temperature monitoring: NTC thermistor
  - Balance current: 60mA
  - Standby current: <20μA

## System Architecture

```
┌─────────────────────────────────────────┐
│             Battery Pack                │
│  ┌─────────────┐       ┌─────────────┐  │
│  │    BMS      │◄─────►│ Temperature │  │
│  │ 4S BW-4S-   │       │   Sensors   │  │
│  │   S30A      │       └─────────────┘  │
│  └─────┬───────┘                        │
└────────┼────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│           Telematics Control Unit          │
│  ┌─────────────┐       ┌─────────────────┐ │
│  │   ESP8266   │◄─────►│    SIM800L V2   │ │
│  │Microcontrol.│       │  GSM/GPRS Module│ │
│  └─────┬───────┘       └────────┬────────┘ │
│        │                        │          │
│        │       ┌────────────────┘          │
│        │       │                           │
│  ┌─────▼───────▼───┐                       │
│  │   NEO-M8N GPS   │                       │
│  │     Module      │                       │
│  └─────────────────┘                       │
└────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│              Cloud Services                │
│  ┌─────────────┐       ┌─────────────────┐ │
│  │  Real-time  │       │   Blockchain    │ │
│  │ Data Server │◄─────►│   Integration   │ │
│  └─────┬───────┘       └────────┬────────┘ │
│        │                        │          │
│  ┌─────▼────────┐    ┌──────────▼───────┐  │
│  │  Analytics   │    │  Smart Contract  │  │
│  │    Engine    │    │    Execution     │  │
│  └──────────────┘    └──────────────────┘  │
└────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│              User Interface                │
│  ┌─────────────┐       ┌─────────────────┐ │
│  │  Dashboard  │       │  Mobile App     │ │
│  │   Web App   │◄─────►│                 │ │
│  └─────────────┘       └─────────────────┘ │
└────────────────────────────────────────────┘
```

## Data Collection & Transmission

The telematics system collects the following data points in real-time:

1. **Battery Health Metrics**
   - Cell voltages (individual and total)
   - Current draw (charge/discharge rate)
   - Temperature at multiple points
   - Charge cycles completed
   - State of charge (SoC)
   - State of health (SoH)

2. **Location Data**
   - Real-time GPS coordinates
   - Altitude
   - Speed (if in transit)
   - Geofence violations

3. **Usage Patterns**
   - Charge/discharge cycles
   - Peak current demands
   - Operating temperature ranges
   - Idle time

## Communication Protocol

The system uses a secure, lightweight communication protocol:

- **Primary Connection**: Wi-Fi (ESP8266) when available
- **Backup Connection**: GPRS (SIM800L) when Wi-Fi is unavailable
- **Data Format**: JSON payloads with encryption
- **Transmission Frequency**: 
  - Normal operation: Every 5 minutes
  - Critical events: Immediate transmission
  - Low power mode: Every 30 minutes

## Battery Tracking & Geofencing

The ChargeX Telematics system includes advanced battery tracking and geofencing capabilities:

1. **Real-time Location Tracking**
   - GPS-based tracking of battery positions
   - Historical location data storage and retrieval
   - Movement detection and path visualization

2. **Geofencing**
   - Define circular geofence boundaries with configurable radius
   - Assign batteries to specific geofences
   - Automatic detection of geofence violations
   - Distance calculation using Haversine formula for accuracy

3. **Alert System**
   - Real-time notifications for geofence violations
   - Battery status alerts (low charge, temperature, etc.)
   - Customizable alert thresholds and notification methods

4. **Visualization**
   - Interactive map display of battery locations
   - Geofence boundary visualization
   - Color-coded status indicators
   - Historical movement playback

## AI-Powered Predictive Maintenance

The ChargeX Telematics system features advanced predictive maintenance capabilities using artificial intelligence:

1. **LSTM-Based Prediction Model**
   - Deep learning model trained on historical battery telemetry data
   - Accurate prediction of Remaining Useful Life (RUL) for batteries
   - Early detection of potential battery failures
   - Confidence scoring for all predictions

2. **Maintenance Recommendations**
   - Automated maintenance scheduling based on predicted battery health
   - Prioritized maintenance actions with deadlines
   - Customized recommendations based on battery usage patterns
   - Cost-effective maintenance planning

3. **Fleet Health Management**
   - Fleet-wide battery health monitoring dashboard
   - Status distribution visualization (critical, warning, good)
   - Average fleet RUL tracking
   - Identification of batteries requiring immediate attention

## Rivalz.ai RAG Integration

The ChargeX Telematics system integrates with Rivalz.ai to provide advanced Retrieval Augmented Generation (RAG) capabilities for battery telemetry data. This allows users to query telemetry data using natural language and get AI-powered insights.

Key features:
- Knowledge base creation from device telemetry data
- Natural language querying of telemetry information
- PDF generation for data vectorization
- Conversation tracking and follow-up questions support
- Decentralized P2P storage for enhanced data availability and ownership

To use this feature, configure the following environment variables:
```
RIVALZ_ENABLED=true
RIVALZ_SECRET_TOKEN=your_rivalz_secret_token
```

See the [Rivalz Integration Documentation](./docs/rivalz-integration.md) for more details.

## Rivalz.ai Decentralized Storage Integration

The ChargeX Telematics system integrates with Rivalz.ai decentralized storage for advanced vector storage of telemetry data.

Key features:
- **Decentralized Storage**: Utilizes peer-to-peer network for resilient data storage
- **Vector Database**: Enables semantic search and natural language querying
- **End-to-End Encryption**: Ensures data privacy and security
- **High Availability**: Data remains accessible even during network disruptions
- **Cost-Effective Solution**: Lower storage costs compared to traditional cloud solutions

## Peer-to-Peer Energy Trading

The ChargeX Telematics system now includes a comprehensive peer-to-peer energy trading platform that allows battery owners to sell excess energy to other users in the network.

Key features:
- **Energy Marketplace**: Create and browse energy offers from other users
- **Geolocation-Based Matching**: Find nearby energy offers based on location
- **Flexible Pricing**: Set your own price per kWh for energy sales
- **Secure Transactions**: Complete transaction tracking and verification
- **Real-Time Statistics**: Monitor trading activity and market trends
- **Partial Purchases**: Buy only the amount of energy you need
- **Trade Management**: Track the status of your trades from creation to completion

To use this feature, configure the following environment variables:
```
ENABLE_ENERGY_TRADING=true
ENERGY_TRADING_MIN_PRICE=0.05
ENERGY_TRADING_MAX_DISTANCE=50
```

## Setup Instructions

### Hardware Setup

1. **Hardware Assembly**
   - Connect the BMS to the battery pack
   - Wire the ESP8266 to the BMS for data collection
   - Connect the SIM800L and GPS module to the ESP8266

2. **Hardware Testing & Calibration**
   - Verify sensor readings against known values
   - Test cellular and Wi-Fi connectivity
   - Validate GPS accuracy
   - Perform blockchain transaction tests

### Software Development Environment

1. **Prerequisites**
   - Node.js (v18 or higher)
   - MongoDB
   - Redis
   - Git

2. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/ChargeX/ChargeX-Telematics.git
   cd ChargeX-Telematics
   
   # Install dependencies
   npm install
   
   # Configure environment variables
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start the development server
   npm run dev
   ```

3. **Environment Variables**
   - Configure the `.env` file with appropriate settings
   - Set `ENABLE_GEOFENCING=true` to enable geofencing features
   - Use `USE_MOCK_DATA=true` during development for testing
   - Set `RIVALZ_ENABLED=true` to enable Rivalz.ai decentralized storage
   - Configure `RIVALZ_SECRET_TOKEN` with your Rivalz.ai API token

4. **Testing**
   - Run unit tests: `npm test`
   - API testing: Use Postman or curl to test endpoints
   - Example test endpoint: `http://localhost:3030/api/v1/tracking/geofences`

## API Documentation

The telematics system exposes RESTful APIs for integration:

### Telemetry and Device Management
- `POST /api/v1/telemetry` - Submit telemetry data
- `GET /api/v1/device/{id}/status` - Retrieve device status
- `PUT /api/v1/device/{id}/config` - Update device configuration
- `POST /api/v1/alerts` - Register for alert notifications

### Battery Tracking and Geofencing
- `GET /api/v1/tracking/geofences` - Retrieve all geofences
- `GET /api/v1/tracking/geofences/{id}` - Get details of a specific geofence
- `POST /api/v1/tracking/geofences` - Create a new geofence
- `PUT /api/v1/tracking/geofences/{id}` - Update an existing geofence
- `DELETE /api/v1/tracking/geofences/{id}` - Delete a geofence
- `GET /api/v1/tracking/geofences/{id}/batteries` - Get batteries within a specific geofence
- `GET /api/v1/tracking/geofence-violations` - Get batteries outside their assigned geofences

### Predictive Maintenance
- `GET /api/v1/predictive/battery/{batteryId}/prediction` - Get RUL prediction for a specific battery
- `GET /api/v1/predictive/battery/{batteryId}/recommendations` - Get maintenance recommendations for a specific battery
- `GET /api/v1/predictive/fleet/overview` - Get fleet-wide maintenance overview
- `GET /api/v1/predictive/health` - Health check for predictive maintenance service

### Rivalz.ai RAG Integration
- `POST /api/v1/rivalz/device/{deviceId}/knowledge-base` - Create a knowledge base from device telemetry data
- `GET /api/v1/rivalz/knowledge-base/{knowledgeBaseId}` - Get knowledge base status and information
- `POST /api/v1/rivalz/knowledge-base/{knowledgeBaseId}/query` - Query a knowledge base with natural language
- `GET /api/v1/rivalz/knowledge-base/{knowledgeBaseId}/conversations` - Retrieve conversation history

### Rivalz.ai Decentralized Storage Integration
- `POST /api/v1/rivalz/telemetry/{deviceId}` - Process telemetry data and store in decentralized storage
- `GET /api/v1/rivalz/knowledge-base/{knowledgeBaseId}` - Get knowledge base status and information
- `POST /api/v1/rivalz/knowledge-base/{knowledgeBaseId}/query` - Query a knowledge base with natural language
- `DELETE /api/v1/rivalz/knowledge-base/{knowledgeBaseId}` - Delete a knowledge base

### Peer-to-Peer Energy Trading
- `POST /api/v1/energy-trading/offers` - Create a new energy offer
- `GET /api/v1/energy-trading/offers` - Retrieve all energy offers
- `GET /api/v1/energy-trading/offers/{id}` - Get details of a specific energy offer
- `PUT /api/v1/energy-trading/offers/{id}` - Update an existing energy offer
- `DELETE /api/v1/energy-trading/offers/{id}` - Delete an energy offer
- `POST /api/v1/energy-trading/trades` - Create a new trade
- `GET /api/v1/energy-trading/trades` - Retrieve all trades
- `GET /api/v1/energy-trading/trades/{id}` - Get details of a specific trade
- `PUT /api/v1/energy-trading/trades/{id}` - Update an existing trade
- `DELETE /api/v1/energy-trading/trades/{id}` - Delete a trade

## Data Storage

The ChargeX Telematics system uses a combination of storage solutions:

1. **MongoDB**: Primary database for telemetry data, device configurations, and user settings
2. **Redis**: Caching layer for frequently accessed data and real-time tracking information
3. **Rivalz.ai Decentralized Storage**: Advanced vector storage for telemetry data with the following benefits:
   - **Decentralized Storage**: Utilizes peer-to-peer network for resilient data storage
   - **Vector Database**: Enables semantic search and natural language querying
   - **End-to-End Encryption**: Ensures data privacy and security
   - **High Availability**: Data remains accessible even during network disruptions
   - **Cost-Effective Solution**: Lower storage costs compared to traditional cloud solutions

## Security Considerations

- End-to-end encryption for all data transmission
- Secure boot and firmware verification
- Tamper detection and reporting
- Role-based access control for API endpoints
- Regular security updates via OTA

## Development Roadmap

The ChargeX Telematics system is being developed in phases:

- **Phase 1**: Basic telemetry and GPS tracking ✅
- **Phase 2**: Battery tracking and geofencing ✅
- **Phase 3**: Blockchain integration and smart contract execution ✅
- **Phase 4**: AI-powered predictive maintenance ✅
- **Phase 5**: Rivalz.ai RAG integration for intelligent data querying ✅
- **Phase 6**: Peer-to-peer energy trading capabilities ✅
- **Phase 7**: Advanced battery swapping automation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For technical support or inquiries, contact the ChargeX development team at dev@chargex.io
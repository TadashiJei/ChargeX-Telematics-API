# ChargeX Telematics API Documentation

This repository contains the documentation website for the ChargeX Telematics API. The website provides comprehensive documentation for all API endpoints, including authentication, request/response formats, and examples.

## Features

- Interactive API documentation using Swagger UI
- Customized theme to match the ChargeX Dashboard
- Responsive design for desktop and mobile devices
- Detailed documentation for all API endpoints

## API Sections

- Tracking - Battery tracking and geofencing operations
- Energy Trading - Peer-to-peer energy trading operations
- Predictive Maintenance - AI-powered battery health prediction and maintenance recommendations
- Telemetry - Battery telemetry data operations
- Devices - Device management operations
- Rivalz.ai - Rivalz.ai RAG integration for telemetry data

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd api-docs
npm install
```

### Running the Documentation Server

```bash
npm start
```

The documentation website will be available at http://localhost:3050.

### Development Mode

To run the server in development mode with automatic reloading:

```bash
npm run dev
```

## Customization

The documentation website is built using:

- HTML, CSS, and JavaScript
- Swagger UI for API documentation
- Express.js for serving the static files

The main files are:

- `public/index.html` - Main HTML file
- `public/css/style.css` - Custom styles
- `public/js/main.js` - JavaScript for customizing Swagger UI
- `public/swagger.json` - OpenAPI specification file

## License

This project is licensed under the MIT License.

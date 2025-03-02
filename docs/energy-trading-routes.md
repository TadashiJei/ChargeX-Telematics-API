# Energy Trading API Routes

The ChargeX Telematics system provides a comprehensive set of API endpoints for peer-to-peer energy trading. These endpoints allow users to create and manage energy offers, initiate trades, and track transactions.

## Base URL

All energy trading endpoints are prefixed with:

```
/api/v1/energy-trading
```

## Authentication

All endpoints require authentication using a valid JWT token. Include the token in the `Authorization` header as follows:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Energy Offers

#### Create an Energy Offer

```
POST /api/v1/energy-trading/offers
```

**Request Body:**
```json
{
  "sellerId": "user-001",
  "batteryId": "battery-001",
  "energyAmount": 5.0,
  "pricePerKwh": 0.15,
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "availableTo": "2023-06-16T10:30:00Z"
}
```

**Response:**
```json
{
  "id": "offer-123456",
  "sellerId": "user-001",
  "batteryId": "battery-001",
  "energyAmount": 5.0,
  "pricePerKwh": 0.15,
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "status": "active",
  "createdAt": "2023-06-15T10:30:00Z",
  "updatedAt": "2023-06-15T10:30:00Z",
  "availableTo": "2023-06-16T10:30:00Z"
}
```

#### Get All Energy Offers

```
GET /api/v1/energy-trading/offers
```

**Query Parameters:**
- `status` (optional): Filter by offer status (active, completed, cancelled)
- `sellerId` (optional): Filter by seller ID
- `minEnergy` (optional): Minimum energy amount
- `maxPrice` (optional): Maximum price per kWh
- `latitude` (optional): Latitude for location-based search
- `longitude` (optional): Longitude for location-based search
- `maxDistance` (optional): Maximum distance in km for location-based search

**Response:**
```json
[
  {
    "id": "offer-123456",
    "sellerId": "user-001",
    "batteryId": "battery-001",
    "energyAmount": 5.0,
    "pricePerKwh": 0.15,
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "status": "active",
    "createdAt": "2023-06-15T10:30:00Z",
    "updatedAt": "2023-06-15T10:30:00Z",
    "availableTo": "2023-06-16T10:30:00Z",
    "distance": 2.5
  }
]
```

#### Get Energy Offer by ID

```
GET /api/v1/energy-trading/offers/:offerId
```

**Response:**
```json
{
  "id": "offer-123456",
  "sellerId": "user-001",
  "batteryId": "battery-001",
  "energyAmount": 5.0,
  "pricePerKwh": 0.15,
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "status": "active",
  "createdAt": "2023-06-15T10:30:00Z",
  "updatedAt": "2023-06-15T10:30:00Z",
  "availableTo": "2023-06-16T10:30:00Z"
}
```

#### Update Energy Offer

```
PUT /api/v1/energy-trading/offers/:offerId
```

**Request Body:**
```json
{
  "energyAmount": 4.0,
  "pricePerKwh": 0.18,
  "status": "active"
}
```

**Response:**
```json
{
  "id": "offer-123456",
  "sellerId": "user-001",
  "batteryId": "battery-001",
  "energyAmount": 4.0,
  "pricePerKwh": 0.18,
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "status": "active",
  "createdAt": "2023-06-15T10:30:00Z",
  "updatedAt": "2023-06-15T11:15:00Z",
  "availableTo": "2023-06-16T10:30:00Z"
}
```

#### Delete Energy Offer

```
DELETE /api/v1/energy-trading/offers/:offerId
```

**Response:**
```json
{
  "success": true,
  "message": "Energy offer deleted successfully"
}
```

### Energy Trades

#### Create an Energy Trade

```
POST /api/v1/energy-trading/trades
```

**Request Body:**
```json
{
  "offerId": "offer-123456",
  "buyerId": "user-002",
  "energyAmount": 2.0
}
```

**Response:**
```json
{
  "id": "trade-123456",
  "offerId": "offer-123456",
  "buyerId": "user-002",
  "sellerId": "user-001",
  "energyAmount": 2.0,
  "pricePerKwh": 0.15,
  "totalPrice": 0.30,
  "status": "pending",
  "createdAt": "2023-06-15T11:30:00Z",
  "updatedAt": "2023-06-15T11:30:00Z"
}
```

#### Get All Energy Trades

```
GET /api/v1/energy-trading/trades
```

**Query Parameters:**
- `status` (optional): Filter by trade status (pending, accepted, rejected, completed)
- `buyerId` (optional): Filter by buyer ID
- `sellerId` (optional): Filter by seller ID

**Response:**
```json
[
  {
    "id": "trade-123456",
    "offerId": "offer-123456",
    "buyerId": "user-002",
    "sellerId": "user-001",
    "energyAmount": 2.0,
    "pricePerKwh": 0.15,
    "totalPrice": 0.30,
    "status": "pending",
    "createdAt": "2023-06-15T11:30:00Z",
    "updatedAt": "2023-06-15T11:30:00Z"
  }
]
```

#### Get Energy Trade by ID

```
GET /api/v1/energy-trading/trades/:tradeId
```

**Response:**
```json
{
  "id": "trade-123456",
  "offerId": "offer-123456",
  "buyerId": "user-002",
  "sellerId": "user-001",
  "energyAmount": 2.0,
  "pricePerKwh": 0.15,
  "totalPrice": 0.30,
  "status": "pending",
  "createdAt": "2023-06-15T11:30:00Z",
  "updatedAt": "2023-06-15T11:30:00Z"
}
```

#### Update Trade Status

```
PUT /api/v1/energy-trading/trades/:tradeId/status
```

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Response:**
```json
{
  "id": "trade-123456",
  "offerId": "offer-123456",
  "buyerId": "user-002",
  "sellerId": "user-001",
  "energyAmount": 2.0,
  "pricePerKwh": 0.15,
  "totalPrice": 0.30,
  "status": "accepted",
  "createdAt": "2023-06-15T11:30:00Z",
  "updatedAt": "2023-06-15T11:45:00Z"
}
```

### Transactions and Statistics

#### Get All Transactions

```
GET /api/v1/energy-trading/transactions
```

**Query Parameters:**
- `buyerId` (optional): Filter by buyer ID
- `sellerId` (optional): Filter by seller ID

**Response:**
```json
[
  {
    "id": "tx-123456",
    "tradeId": "trade-123456",
    "buyerId": "user-002",
    "sellerId": "user-001",
    "energyAmount": 2.0,
    "pricePerKwh": 0.15,
    "totalPrice": 0.30,
    "timestamp": "2023-06-15T12:30:00Z",
    "blockchainTxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }
]
```

#### Get Energy Trading Statistics

```
GET /api/v1/energy-trading/statistics
```

**Response:**
```json
{
  "activeOffers": 5,
  "totalOffers": 10,
  "completedTrades": 8,
  "pendingTrades": 2,
  "totalEnergyTraded": 25.5,
  "totalValueTraded": 3.83,
  "transactionCount": 8
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response body:

```json
{
  "error": true,
  "message": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

## Feature Flag

The energy trading feature can be enabled or disabled using the `ENABLE_ENERGY_TRADING` environment variable. If disabled, all endpoints will return a `403 Forbidden` response with the message "Energy trading is not enabled".

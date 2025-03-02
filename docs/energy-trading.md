# Peer-to-Peer Energy Trading Documentation

## Overview

The ChargeX Telematics platform now includes a comprehensive peer-to-peer energy trading system that allows battery owners to sell excess energy to other users in the network. This feature enables a decentralized energy marketplace where users can create offers, find nearby energy sources, and complete secure transactions.

## Key Features

- **Energy Marketplace**: Create and browse energy offers from other users
- **Geolocation-Based Matching**: Find nearby energy offers based on location
- **Flexible Pricing**: Set your own price per kWh for energy sales
- **Secure Transactions**: Complete transaction tracking and verification
- **Real-Time Statistics**: Monitor trading activity and market trends
- **Partial Purchases**: Buy only the amount of energy you need
- **Trade Management**: Track the status of your trades from creation to completion

## Configuration

To enable the energy trading feature, configure the following environment variables:

```
ENABLE_ENERGY_TRADING=true
ENERGY_TRADING_MIN_PRICE=0.05
ENERGY_TRADING_MAX_DISTANCE=50
```

- `ENABLE_ENERGY_TRADING`: Set to `true` to enable the energy trading feature
- `ENERGY_TRADING_MIN_PRICE`: Minimum allowed price per kWh (in USD)
- `ENERGY_TRADING_MAX_DISTANCE`: Maximum distance (in km) for displaying nearby offers

## API Endpoints

### Energy Offers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/energy-trading/offers` | Create a new energy offer |
| GET | `/api/v1/energy-trading/offers` | Retrieve all energy offers |
| GET | `/api/v1/energy-trading/offers/{id}` | Get details of a specific energy offer |
| PUT | `/api/v1/energy-trading/offers/{id}` | Update an existing energy offer |
| DELETE | `/api/v1/energy-trading/offers/{id}` | Delete an energy offer |

### Energy Trades

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/energy-trading/trades` | Create a new trade |
| GET | `/api/v1/energy-trading/trades` | Retrieve all trades |
| GET | `/api/v1/energy-trading/trades/{id}` | Get details of a specific trade |
| PUT | `/api/v1/energy-trading/trades/{id}/status` | Update trade status |

### Transactions and Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/energy-trading/transactions` | Retrieve all completed transactions |
| GET | `/api/v1/energy-trading/statistics` | Get energy trading statistics |

## Data Models

### Energy Offer

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

### Energy Trade

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

### Energy Transaction

```json
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
```

## Workflow

### Creating an Energy Offer

1. Battery owner creates an offer specifying:
   - Energy amount available (kWh)
   - Price per kWh
   - Current location
   - Availability period

2. System validates the offer:
   - Ensures minimum price requirements are met
   - Verifies battery has sufficient energy
   - Validates location data

3. Offer is published to the marketplace and becomes visible to nearby users

### Purchasing Energy

1. Buyer searches for available energy offers:
   - Can filter by location, price, and amount
   - System shows distance to each offer

2. Buyer selects an offer and creates a trade:
   - Specifies amount of energy to purchase (can be partial)
   - System calculates total price

3. Seller receives trade request and can accept or reject:
   - If accepted, trade status changes to "accepted"
   - If rejected, trade status changes to "rejected"

4. Upon acceptance, a transaction is created:
   - Energy transfer is initiated
   - Payment is processed
   - Transaction is recorded (optionally on blockchain)

5. After completion, offer is updated:
   - If partially fulfilled, remaining energy is still available
   - If fully fulfilled, offer status changes to "completed"

## Security Considerations

- **Authentication**: All API endpoints require authentication
- **Authorization**: Only the offer creator can update or delete offers
- **Validation**: Comprehensive input validation for all API requests
- **Transaction Verification**: Optional blockchain integration for transaction verification
- **Rate Limiting**: API rate limiting to prevent abuse
- **Data Privacy**: Location data is only shared with necessary precision

## Future Enhancements

- **Smart Contract Integration**: Fully automated trades using blockchain smart contracts
- **Reputation System**: User ratings and reputation scores for sellers and buyers
- **Automated Pricing**: Dynamic pricing based on supply and demand
- **Energy Futures**: Ability to reserve energy for future use
- **Mobile App Integration**: Dedicated mobile app features for energy trading
- **Payment Options**: Multiple payment methods including cryptocurrency

## Testing

To test the energy trading functionality, run the test script:

```bash
node src/test-energy-trading.js
```

This script simulates the entire energy trading workflow:
1. Creating energy offers
2. Searching for offers
3. Creating trades
4. Accepting trades
5. Completing transactions
6. Viewing statistics

## Troubleshooting

Common issues and solutions:

1. **Offer creation fails**:
   - Ensure `ENABLE_ENERGY_TRADING` is set to `true`
   - Verify price is above minimum threshold
   - Check that location data is valid

2. **Cannot find nearby offers**:
   - Verify `ENERGY_TRADING_MAX_DISTANCE` is set appropriately
   - Ensure location data is accurate
   - Check that there are active offers in the system

3. **Trade creation fails**:
   - Verify offer is still active
   - Ensure requested energy amount is available
   - Check that buyer has a valid account

4. **Transaction not recorded**:
   - Verify trade status is "accepted"
   - Check for errors in transaction processing
   - Ensure blockchain integration is configured correctly if enabled

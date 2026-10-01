# API Testing Guide

Quick reference for testing all implemented endpoints using curl.

## Setup

```bash
# Set base URL
API_URL="http://localhost:5000/api"

# For authenticated requests, save token
TOKEN=$(curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# Use in requests
curl -H "Authorization: Bearer $TOKEN" $API_URL/auth/me
```

---

## AUTHENTICATION ENDPOINTS

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"secure123",
    "name":"John Doe",
    "phone":"+55 11 99999-9999"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+55 11 99999-9999"
  }
}
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"secure123"
  }'
```

### Get Current User (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Profile (Protected)
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Jane Doe",
    "phone":"+55 11 88888-8888"
  }'
```

### Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout
```

---

## SHIPPING ENDPOINTS

### Calculate Shipping
```bash
# For Brazil
curl -X POST http://localhost:5000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "destination":"Sao Paulo",
    "weight":2.5,
    "region":"BR",
    "items":[
      {"weight":1.0,"quantity":2},
      {"weight":0.5,"quantity":1}
    ]
  }'

# For Portugal
curl -X POST http://localhost:5000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "destination":"Porto",
    "weight":1.5,
    "region":"PT"
  }'
```

**Expected Response:**
```json
{
  "region": "BR",
  "weight": 2.5,
  "destination": "Sao Paulo",
  "options": [
    {
      "id": "uuid",
      "carrier": "correios",
      "name": "correios - 5 dias",
      "price": 16.25,
      "estimatedDays": 5,
      "weight": 2.5
    }
  ]
}
```

### Validate CEP (Brazil)
```bash
curl -X POST http://localhost:5000/api/shipping/validate-cep \
  -H "Content-Type: application/json" \
  -d '{"cep":"01310-100"}'
```

### Validate Postal Code (Portugal)
```bash
curl -X POST http://localhost:5000/api/shipping/validate-postal-code \
  -H "Content-Type: application/json" \
  -d '{"postalCode":"4000-100"}'
```

### Get Shipping Rates for Region
```bash
curl -X GET http://localhost:5000/api/shipping/rates/BR
curl -X GET http://localhost:5000/api/shipping/rates/PT
curl -X GET http://localhost:5000/api/shipping/rates/EU
```

### Create Shipping Label
```bash
curl -X POST http://localhost:5000/api/shipping/create-label \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"order-uuid",
    "shippingMethod":"correios",
    "recipientCep":"01310-100",
    "recipientName":"John Doe"
  }'
```

### Track Shipment
```bash
curl -X GET "http://localhost:5000/api/shipping/track/BR1234567890"
```

### Update Tracking Status
```bash
curl -X POST http://localhost:5000/api/shipping/update-tracking \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber":"BR1234567890",
    "status":"in_transit",
    "lastUpdate":"2024-09-30T10:00:00Z"
  }'
```

---

## TAX ENDPOINTS

### Get Tax Rate for Country
```bash
curl -X GET http://localhost:5000/api/taxes/rate/BR
curl -X GET http://localhost:5000/api/taxes/rate/PT
curl -X GET http://localhost:5000/api/taxes/rate/ES
```

**Expected Response:**
```json
{
  "id": "uuid",
  "country": "BR",
  "tax_rate": 18.00,
  "tax_type": "ICMS"
}
```

### Calculate Tax
```bash
curl -X POST http://localhost:5000/api/taxes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "amount":100.00,
    "country":"BR"
  }'
```

**Expected Response:**
```json
{
  "country": "BR",
  "amount": 100.00,
  "taxRate": 18.0,
  "taxAmount": 18.00,
  "total": 118.00
}
```

### Get All Tax Rates
```bash
curl -X GET http://localhost:5000/api/taxes/rates
```

---

## CURRENCY ENDPOINTS

### Get Exchange Rate
```bash
curl -X GET "http://localhost:5000/api/currency/rate?from=EUR&to=BRL"
curl -X GET "http://localhost:5000/api/currency/rate?from=BRL&to=EUR"
```

**Expected Response:**
```json
{
  "from": "EUR",
  "to": "BRL",
  "rate": 5.90
}
```

### Convert Currency
```bash
curl -X POST http://localhost:5000/api/currency/convert \
  -H "Content-Type: application/json" \
  -d '{
    "amount":100.00,
    "from":"EUR",
    "to":"BRL"
  }'
```

**Expected Response:**
```json
{
  "from": "EUR",
  "to": "BRL",
  "amount": 100.00,
  "rate": 5.90,
  "convertedAmount": 590.00
}
```

### Get All Currency Rates
```bash
curl -X GET http://localhost:5000/api/currency/all
```

### Update Exchange Rate (Admin)
```bash
curl -X PUT http://localhost:5000/api/currency/update-rate \
  -H "Content-Type: application/json" \
  -d '{
    "from":"EUR",
    "to":"BRL",
    "rate":5.95
  }'
```

---

## ORDER ENDPOINTS

### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "cartId":"cart-uuid",
    "userId":"user-uuid",
    "items":[
      {
        "product_id":"product-uuid",
        "product_name":"Product Name",
        "quantity":2,
        "price":50.00,
        "weight":1.0
      }
    ],
    "customerEmail":"user@example.com",
    "customerName":"John Doe",
    "customerPhone":"+55 11 99999-9999",
    "shippingAddress":{
      "street":"Rua Augusta",
      "number":"2500",
      "city":"Sao Paulo",
      "state":"SP",
      "cep":"01305-100"
    },
    "subtotal":100.00,
    "tax":18.00,
    "shippingCost":15.00,
    "paymentMethod":"stripe",
    "currency":"BRL"
  }'
```

### Get User Orders (Protected)
```bash
curl -X GET "http://localhost:5000/api/orders/user/USER_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Order Details
```bash
curl -X GET http://localhost:5000/api/orders/ORDER_UUID
```

### Update Order Status (Admin)
```bash
curl -X PUT http://localhost:5000/api/orders/ORDER_UUID/status \
  -H "Content-Type: application/json" \
  -d '{"status":"paid"}'
```

Valid statuses: `pending`, `payment_processing`, `paid`, `shipped`, `delivered`, `cancelled`

### Cancel Order
```bash
curl -X DELETE http://localhost:5000/api/orders/ORDER_UUID
```

### Search Orders by Email
```bash
curl -X GET "http://localhost:5000/api/orders/search?email=user@example.com"
```

---

## Test Scenarios

### Scenario 1: Complete Brazil Purchase
1. Register: `POST /auth/register`
2. Login: `POST /auth/login` → save TOKEN
3. Calculate shipping: `POST /shipping/calculate` with region=BR
4. Calculate tax: `POST /taxes/calculate` with country=BR
5. Create order: `POST /orders` with all details
6. Get user orders: `GET /orders/user/{userId}` with TOKEN

### Scenario 2: International Purchase (PT)
1. Validate postal code: `POST /shipping/validate-postal-code`
2. Calculate shipping: `POST /shipping/calculate` with region=PT
3. Get tax rate: `GET /taxes/rate/PT`
4. Convert price: `POST /currency/convert` from BRL to EUR
5. Create order with EUR currency

### Scenario 3: Track Order
1. Create order: `POST /orders`
2. Create label: `POST /shipping/create-label`
3. Get tracking: `GET /shipping/track/{trackingNumber}`
4. Update tracking: `POST /shipping/update-tracking`

---

## Error Responses

### 400 Bad Request
```json
{"error": "Email and password are required"}
```

### 401 Unauthorized
```json
{"error": "Invalid credentials"}
```

### 403 Forbidden
```json
{"error": "Unauthorized"}
```

### 404 Not Found
```json
{"error": "Order not found"}
```

### 409 Conflict
```json
{"error": "Email already registered"}
```

### 500 Server Error
```json
{"error": "Registration failed"}
```

---

## Performance Tips

- Cache shipping rates per region
- Cache tax rates per country
- Update currency rates daily via background job
- Use connection pooling for database
- Add indexes on frequently queried fields
- Implement rate limiting on auth endpoints

---

## Security Notes

- Always use HTTPS in production
- Never log sensitive data (passwords, tokens)
- Implement CORS correctly
- Validate all input server-side
- Use prepared statements (already implemented)
- Rotate JWT_SECRET regularly
- Implement CAPTCHA on registration (optional)
- Add rate limiting to auth endpoints


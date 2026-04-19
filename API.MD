supabase Transaction pooler api key: postgresql://postgres.kbtuskvfqdpoplbaehll:[SUSHOVAN_GHOSH_1908]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres



## 1. Purpose of This Document

This document defines the complete API surface for the project. It separates:

1. **Own APIs** — the APIs we build and control inside our application.
2. **Third-Party APIs** — external services we call for authentication, database, blockchain, or infrastructure support.

The system is being built with **Supabase** and related tooling for the hackathon version. This document assumes:

* Supabase is used for authentication, database, and possibly storage.
* The app will not expose secret keys in the frontend.
* Sensitive configuration values will live in server-side environment variables.
* The internal INR wallet is an app-managed ledger, not a real bank account for the hackathon version.
* Polygon Amoy is used for blockchain settlement.
* MetaMask is used for wallet signing.

The purpose of this document is to make API design clear enough for implementation, testing, and demo preparation.

---

## 2. API Design Philosophy

The API must be designed around a few strict rules.

### 2.1 Separate Business Logic from External Services

Our application APIs should not directly depend on UI state. They must represent the real business workflow:

* user login,
* wallet connection,
* QR scan,
* order creation,
* rate lock,
* escrow execution,
* transaction verification,
* INR ledger update,
* refund,
* and history retrieval.

### 2.2 Idempotent Where Necessary

Payment systems often receive repeated requests. APIs must be safe to call multiple times when appropriate.

### 2.3 Clear State Transitions

Every order must move through valid states only. APIs must not allow invalid jumps.

### 2.4 Security First

The frontend must never receive sensitive secret values. Private keys, service-role keys, and provider secrets must stay on the server.

### 2.5 Hackathon-Friendly but Production-Meaningful

The APIs should feel like a real payment system while staying simple enough to build quickly.

---

## 3. System API Categories

The API surface is divided into the following groups:

1. Authentication APIs
2. User Profile APIs
3. Wallet Connection APIs
4. QR Code APIs
5. Rate and Quote APIs
6. Order APIs
7. INR Ledger APIs
8. Blockchain/Escrow APIs
9. Transaction History APIs
10. Notification / Status APIs
11. Admin / Debug APIs

---

# PART A — OUR OWN APIs

These are the APIs we design and implement ourselves.

---

## 4. Authentication APIs

The app uses Supabase Auth for login and session management, but our application still exposes app-level auth routes or wrappers for a clean frontend experience.

### 4.1 `POST /api/auth/signup`

Creates a new app user.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "displayName": "Sushovan"
}
```

#### Behavior

* Creates a Supabase auth account.
* Creates a user profile record in our database.
* Initializes internal INR balance.
* Prepares QR metadata.

#### Response

```json
{
  "success": true,
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "displayName": "Sushovan"
  }
}
```

---

### 4.2 `POST /api/auth/login`

Logs in an existing user.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

#### Response

```json
{
  "success": true,
  "session": {
    "accessToken": "<token>",
    "refreshToken": "<token>"
  }
}
```

---

### 4.3 `POST /api/auth/logout`

Ends the current session.

#### Behavior

* Clears session on the server if needed.
* Frontend removes local session state.

---

### 4.4 `GET /api/auth/me`

Returns the currently authenticated user.

#### Response

```json
{
  "success": true,
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "displayName": "Sushovan",
    "walletAddress": "0xabc..."
  }
}
```

---

## 5. User Profile APIs

### 5.1 `GET /api/users/:userId`

Fetches a user profile.

#### Response

```json
{
  "success": true,
  "user": {
    "id": "usr_123",
    "displayName": "Sushovan",
    "walletAddress": "0xabc...",
    "qrCodeId": "qr_123",
    "inrBalance": 2500,
    "createdAt": "2026-04-18T10:00:00Z"
  }
}
```

---

### 5.2 `PATCH /api/users/:userId`

Updates user metadata.

#### Request Body

```json
{
  "displayName": "New Name",
  "avatarUrl": "https://..."
}
```

---

### 5.3 `POST /api/users/link-wallet`

Links a wallet address to the user profile.

#### Request Body

```json
{
  "userId": "usr_123",
  "walletAddress": "0xabc123..."
}
```

#### Behavior

* Validates address format.
* Stores wallet mapping.
* Marks wallet as connected.

---

## 6. Wallet Connection APIs

These APIs are application-level wrappers around wallet-related flows.

### 6.1 `POST /api/wallet/connect`

Associates the wallet signature or wallet address with a user session.

#### Request Body

```json
{
  "userId": "usr_123",
  "walletAddress": "0xabc123...",
  "network": "polygon-amoy"
}
```

---

### 6.2 `GET /api/wallet/status`

Returns connection state and network details.

#### Response

```json
{
  "success": true,
  "connected": true,
  "walletAddress": "0xabc123...",
  "network": "polygon-amoy"
}
```

---

## 7. QR Code APIs

### 7.1 `GET /api/qr/:userId`

Returns QR payload data for a user.

#### Response

```json
{
  "success": true,
  "qrPayload": {
    "userId": "usr_123",
    "walletAddress": "0xabc123...",
    "preferredCurrency": "INR",
    "displayName": "Sushovan"
  }
}
```

---

### 7.2 `POST /api/qr/generate`

Generates a QR payload object and optionally a QR image reference.

#### Request Body

```json
{
  "userId": "usr_123"
}
```

#### Response

```json
{
  "success": true,
  "qrPayload": {
    "userId": "usr_123",
    "walletAddress": "0xabc123...",
    "preferredCurrency": "INR"
  }
}
```

---

### 7.3 `POST /api/qr/scan`

Validates a scanned QR payload.

#### Request Body

```json
{
  "qrPayload": {
    "userId": "usr_456",
    "walletAddress": "0xdef456...",
    "preferredCurrency": "INR"
  }
}
```

#### Behavior

* Validates structure.
* Resolves receiver user.
* Returns payment context.

---

## 8. Rate and Quote APIs

### 8.1 `GET /api/rates/current`

Returns the current exchange rate for supported pairs.

#### Example Response

```json
{
  "success": true,
  "rates": {
    "AMOY_INR": 100,
    "INR_AMOY": 0.01
  },
  "source": "mock-fixed-rate"
}
```

---

### 8.2 `POST /api/rates/quote`

Creates a locked quote for a payment order.

#### Request Body

```json
{
  "fromCurrency": "AMOY",
  "toCurrency": "INR",
  "amount": 10
}
```

#### Response

```json
{
  "success": true,
  "quote": {
    "lockedRate": 100,
    "fromAmount": 10,
    "toAmount": 1000,
    "expiresAt": "2026-04-18T10:05:00Z"
  }
}
```

---

## 9. Order APIs

The order APIs are the core business APIs of the system.

### 9.1 `POST /api/orders`

Creates a new payment order.

#### Request Body

```json
{
  "senderId": "usr_123",
  "receiverId": "usr_456",
  "fromCurrency": "AMOY",
  "toCurrency": "INR",
  "fromAmount": 10,
  "qrContext": {
    "scanSource": "qr"
  }
}
```

#### Behavior

* Creates order record.
* Locks rate.
* Calculates conversion result.
* Sets initial order status.

#### Response

```json
{
  "success": true,
  "order": {
    "orderId": "ord_001",
    "status": "RATE_LOCKED",
    "fromAmount": 10,
    "toAmount": 1000,
    "lockedRate": 100
  }
}
```

---

### 9.2 `GET /api/orders/:orderId`

Returns full order details.

#### Response

```json
{
  "success": true,
  "order": {
    "orderId": "ord_001",
    "senderId": "usr_123",
    "receiverId": "usr_456",
    "status": "ESCROW_DEPOSITED",
    "fromCurrency": "AMOY",
    "toCurrency": "INR",
    "fromAmount": 10,
    "toAmount": 1000,
    "lockedRate": 100
  }
}
```

---

### 9.3 `POST /api/orders/:orderId/cancel`

Cancels an order if allowed.

#### Behavior

* Checks current order state.
* If safe, marks as canceled.
* Triggers refund if escrow exists.

---

### 9.4 `POST /api/orders/:orderId/retry`

Retries a failed or stuck order.

#### Behavior

* Re-checks blockchain state.
* Attempts settlement again.
* Prevents duplicate execution.

---

## 10. INR Ledger APIs

These APIs manage the internal INR wallet balances.

### 10.1 `GET /api/ledger/:userId/balance`

Returns current INR balance.

#### Response

```json
{
  "success": true,
  "userId": "usr_456",
  "inrBalance": 1000
}
```

---

### 10.2 `GET /api/ledger/:userId/history`

Returns ledger entries for the user.

#### Response

```json
{
  "success": true,
  "entries": [
    {
      "entryId": "led_001",
      "type": "CREDIT",
      "amount": 1000,
      "balanceAfter": 2500,
      "orderId": "ord_001"
    }
  ]
}
```

---

### 10.3 `POST /api/ledger/credit`

Credits INR to a user.

#### Request Body

```json
{
  "userId": "usr_456",
  "amount": 1000,
  "orderId": "ord_001"
}
```

---

### 10.4 `POST /api/ledger/debit`

Debits INR from a user.

#### Request Body

```json
{
  "userId": "usr_123",
  "amount": 1000,
  "orderId": "ord_002"
}
```

---

## 11. Blockchain and Escrow APIs

These APIs connect our application to the smart contract on Polygon Amoy.

### 11.1 `POST /api/chain/deposit`

Registers the initiation of a blockchain deposit.

#### Request Body

```json
{
  "orderId": "ord_001",
  "walletAddress": "0xabc123...",
  "amount": 10
}
```

---

### 11.2 `POST /api/chain/verify`

Verifies a transaction hash against an order.

#### Request Body

```json
{
  "orderId": "ord_001",
  "txHash": "0xhash..."
}
```

#### Behavior

* Confirms that tx exists.
* Confirms it matches order amount.
* Confirms it came from the expected sender.
* Confirms the escrow contract emitted the right event.

---

### 11.3 `POST /api/chain/release`

Marks an order ready for settlement release.

#### Behavior

* Called only after verification.
* Releases escrow funds on-chain.

---

### 11.4 `POST /api/chain/refund`

Refunds an order if the settlement fails.

#### Behavior

* Calls the smart contract refund path.
* Marks order refunded.
* Updates the frontend and history.

---

## 12. Transaction History APIs

### 12.1 `GET /api/transactions/:userId`

Returns the user’s transaction feed.

#### Response

```json
{
  "success": true,
  "transactions": [
    {
      "transactionId": "txn_001",
      "orderId": "ord_001",
      "type": "AMOY_TO_INR",
      "status": "SETTLED",
      "amount": 10,
      "createdAt": "2026-04-18T10:00:00Z"
    }
  ]
}
```

---

### 12.2 `GET /api/transactions/:transactionId`

Returns details of a single transaction.

---

## 13. Notification / Live Status APIs

### 13.1 `GET /api/orders/:orderId/status`

Returns the current live order status.

#### Response

```json
{
  "success": true,
  "status": "VERIFICATION_PENDING"
}
```

---

### 13.2 `POST /api/webhooks/order-updated`

Internal webhook endpoint used by worker services or chain listeners to inform the API that an order has changed state.

---

## 14. Admin / Debug APIs

These APIs are optional and should be protected.

### 14.1 `GET /api/admin/orders`

Returns all orders for debugging.

### 14.2 `GET /api/admin/logs`

Returns audit logs.

### 14.3 `POST /api/admin/reset-demo`

Resets demo state for presentations.

---

# PART B — THIRD-PARTY APIs

These are external services we depend on. They should be treated as replaceable modules.

---

## 15. Supabase APIs

Supabase is the main third-party platform for auth, database, and possibly file storage.

### 15.1 What Supabase Is Used For

* user authentication,
* user table storage,
* order table storage,
* ledger table storage,
* transaction history storage,
* optional file storage for avatars or QR assets.

### 15.2 Why Supabase Fits This Project

* free tier available,
* quick setup,
* Postgres-backed,
* easy auth integration,
* secure server-side service role model.

### 15.3 Important Note About Keys

The frontend should only use the public Supabase URL and anon key if necessary.

The **service role key must never be exposed in the client**.

### 15.4 Supabase Auth Usage

Supabase Auth can handle:

* email/password login,
* session handling,
* sign out,
* user identity.

### 15.5 Supabase Database Usage

Can store:

* profiles,
* orders,
* transactions,
* ledger entries,
* audit logs.

### 15.6 Supabase Storage Usage

Optional usage:

* profile avatars,
* QR images,
* demo screenshots,
* or receipts.

---

## 16. Blockchain RPC Provider APIs

For reliable chain reading, we may use a third-party RPC provider.

### Possible Providers

* Alchemy
* Infura
* public Polygon RPC

### 16.1 Why Use an RPC Provider

* better uptime,
* faster event listening,
* more stable than public endpoints,
* easier debugging.

### 16.2 Key Requirement

Yes, these providers usually require an API key, even if they have free tiers.

### 16.3 What We Use It For

* read blockchain state,
* listen for escrow events,
* fetch transaction receipts,
* verify deposits.

---

## 17. Wallet and Signature APIs

### MetaMask

MetaMask does not require an API key.

We use it for:

* connecting wallet,
* signing messages,
* signing transactions,
* verifying user control.

### WalletConnect (Optional)

If mobile support is needed, WalletConnect may be used.

---

## 18. Price / Rate APIs

For the hackathon version, the app can use a fixed mock rate.

### Optional External Sources

* CoinGecko
* CoinMarketCap

### Usage

* fetch approximate token value,
* display rate context,
* back the quote UI.

### Note

For the hackathon, rate can be hardcoded or read from a simple backend config. No third-party key is strictly required.

---

## 19. Notification APIs

Optional, but useful.

### Possible Services

* Firebase Cloud Messaging
* email services like Resend or SendGrid

### Use Cases

* transaction completed,
* payment failed,
* order refunded,
* wallet connected.

These are not required for the core demo.

---

## 20. Hosting / Infrastructure APIs

These are not part of the application logic, but they matter for deployment.

### Examples

* Vercel for frontend hosting
* Render or Railway for backend hosting
* Supabase managed hosting for database and auth

---

# PART C — KEY MANAGEMENT RULES

---

## 21. Which Keys Are Needed?

### 21.1 Supabase

Needed:

* Supabase project URL
* Supabase anon key for client-side safe access
* Supabase service role key for server-side privileged operations

### 21.2 RPC Provider

Needed:

* RPC endpoint URL
* RPC API key if using Alchemy or Infura

### 21.3 Blockchain Contract

Needed:

* deployed contract address
* contract ABI

### 21.4 MetaMask

No key required.

### 21.5 QR System

No key required.

### 21.6 Internal Rate Engine

No key required.

---

## 22. Key Storage Rules

### Must Go in Backend Environment Variables

* SUPABASE_SERVICE_ROLE_KEY
* SUPABASE_URL
* SUPABASE_ANON_KEY if needed by server tooling
* RPC_URL
* RPC_API_KEY
* CONTRACT_ADDRESS
* PRIVATE_DEPLOYER_KEY if deployment scripts need it

### Must Never Go in Frontend Code

* service role key
* private deployer key
* any signing secret
* any production credential

---

## 23. Recommended .env Separation

### Frontend `.env.local`

* PUBLIC_SUPABASE_URL
* PUBLIC_SUPABASE_ANON_KEY
* NEXT_PUBLIC_CHAIN_ID
* NEXT_PUBLIC_CONTRACT_ADDRESS

### Backend `.env`

* SUPABASE_URL
* SUPABASE_SERVICE_ROLE_KEY
* RPC_URL
* RPC_API_KEY
* CONTRACT_ADDRESS
* PRIVATE_KEY
* JWT_SECRET

---

# PART D — RECOMMENDED REQUEST FLOW THROUGH APIS

---

## 24. AMOY to INR Request Chain

1. User logs in through Supabase auth.
2. User connects MetaMask.
3. Frontend fetches receiver QR.
4. Frontend creates order via `POST /api/orders`.
5. Backend locks rate.
6. Frontend asks MetaMask to sign deposit.
7. Blockchain tx is broadcast.
8. Backend verifies tx using RPC provider.
9. Backend updates ledger.
10. Backend returns settlement state.
11. Frontend updates UI.

---

## 25. INR to AMOY Request Chain

1. User logs in.
2. User opens QR scan.
3. User creates order.
4. Backend locks rate.
5. Backend debits INR ledger.
6. Backend or system wallet sends AMOY.
7. Backend confirms status.
8. Frontend updates history.

---

# PART E — RECOMMENDED RESPONSE SHAPES

---

## 26. Standard Success Response

```json
{
  "success": true,
  "data": {}
}
```

---

## 27. Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ORDER_STATE",
    "message": "The order cannot be modified in its current state."
  }
}
```

---

## 28. Standard Order Object

```json
{
  "orderId": "ord_001",
  "senderId": "usr_123",
  "receiverId": "usr_456",
  "fromCurrency": "AMOY",
  "toCurrency": "INR",
  "fromAmount": 10,
  "toAmount": 1000,
  "lockedRate": 100,
  "status": "SETTLED"
}
```

---

# PART F — API IMPLEMENTATION NOTES

---

## 29. API Idempotency

The following endpoints should be idempotent or safely repeatable:

* `POST /api/orders`
* `POST /api/chain/verify`
* `POST /api/ledger/credit`
* `POST /api/ledger/debit`
* `POST /api/orders/:orderId/retry`

This prevents duplicate money movement.

---

## 30. Validation Layer

Every endpoint should validate:

* required fields,
* field types,
* allowed currencies,
* positive amounts,
* valid wallet addresses,
* and correct order state.

---

## 31. Authorization Layer

Each request should check whether:

* the user owns the account,
* the user is allowed to modify the order,
* or the action is admin-only.

---

## 32. Logging Layer

Log every critical payment event:

* order created,
* quote locked,
* transaction broadcast,
* event received,
* ledger updated,
* refund issued,
* order closed.

---

## 33. Final Recommended API Stack

### Own APIs

* Next.js API routes or Express endpoints
* Supabase-backed auth wrapper
* order service
* ledger service
* chain listener service

### Third-Party APIs

* Supabase Auth / Database / Storage
* Polygon RPC provider such as Alchemy or Infura
* MetaMask
* optional price feed service

---

## 34. Final Summary

This API structure gives the project a clean split:

* **Own APIs** handle business logic and user flows.
* **Third-party APIs** provide infrastructure, blockchain access, and authentication support.

This separation is important because it lets the team:

* build fast,
* keep secrets safe,
* switch providers later,
* and keep the project understandable during the hackathon demo.

---

## 35. One-Line API Summary

**A modular API system built on Supabase and Polygon that separates our core payment logic from third-party infrastructure so the app can support QR-based crypto-to-INR workflows safely and cleanly.**

## 1. Purpose of This Document

This document explains how to actually build the project described in the idea and architecture documents. It is written as a practical implementation manual for a hackathon team. The goal is to convert the concept into a working web application with a clear development sequence, defined responsibilities, stable state handling, and a demo-ready user flow.

The implementation is designed around the following constraints:

* The app must be buildable quickly.
* The crypto side must use **MetaMask**.
* The blockchain network must be **Polygon Amoy testnet**.
* The INR wallet must be an **internal ledger**, not a real bank wallet, for the hackathon version.
* The UX must be QR-first and easy to understand.
* The payment flow must include **rate locking** and **escrow-based safety**.
* The codebase must be modular so the team can develop in parallel.

This guide covers the entire implementation lifecycle:

1. Planning the codebase.
2. Choosing the stack.
3. Building the frontend.
4. Building wallet integration.
5. Building QR generation and scanning.
6. Building the backend order engine.
7. Building the internal INR wallet.
8. Building the escrow smart contract.
9. Building transaction verification.
10. Building state transitions and failure handling.
11. Testing the full workflow.
12. Preparing the demo.
13. Preparing for future production expansion.

---

## 2. Implementation Strategy

The implementation should be built in **layers**, not all at once. Each layer has one job and exposes clean interfaces to the next layer.

### Recommended Implementation Order

1. **Frontend skeleton**
2. **MetaMask connection**
3. **Backend APIs**
4. **Database models**
5. **QR generation and scanning**
6. **Order creation and rate locking**
7. **Escrow smart contract**
8. **Chain event listener**
9. **INR wallet ledger updates**
10. **Refund and timeout logic**
11. **Transaction history and dashboard**
12. **Polish and demo flow**

This sequence is important because the payment flow depends on backend order state and contract state. If the team builds the UI too early without backend state management, the system will feel incomplete.

---

## 3. Recommended Tech Stack

The stack should be simple, standard, and hackathon-friendly.

### Frontend

* **Next.js** or **React** for the web app.
* **Tailwind CSS** for fast UI styling.
* **QR scanner library** for camera-based scanning.
* **ethers.js** or **viem** for wallet and chain interaction.
* **React Query** or a similar library for server state.

### Backend

* **Node.js** with **Express** or **NestJS**.
* **MongoDB** or **PostgreSQL**.
* **Prisma** if PostgreSQL is used.
* **ethers.js** for blockchain event listening.
* **Zod** or a similar schema validator for request validation.

### Blockchain

* **Solidity** smart contract.
* **Polygon Amoy** testnet.
* **Hardhat** or **Foundry** for contract development.

### Tooling

* **GitHub** for version control.
* **Docker** optional for consistent local setup.
* **Postman** or **Insomnia** for API testing.

---

## 4. Codebase Structure

A clean folder structure makes the project easier to maintain and easier to present during evaluation.

### Recommended Repository Layout

```text
project-root/
├── apps/
│   ├── web/
│   └── api/
├── contracts/
├── packages/
│   ├── shared/
│   └── sdk/
├── docs/
├── scripts/
└── README.md
```

### If the Team Wants a Simpler Setup

```text
project-root/
├── frontend/
├── backend/
├── contracts/
├── shared/
└── docs/
```

### Why This Structure Works

* `frontend` holds user-facing pages and components.
* `backend` handles business logic and APIs.
* `contracts` contains Solidity code.
* `shared` can hold types, utilities, and constants.
* `docs` contains architecture, idea, and implementation notes.

---

## 5. Core Data Flow Before Coding

Before writing code, the team should understand the full transaction flow.

### Main Flow Summary

1. User logs in.
2. User connects MetaMask.
3. User scans receiver QR.
4. User chooses transaction currency.
5. Backend creates an order.
6. Backend locks the conversion rate.
7. Frontend asks the user to sign the AMOY transaction.
8. Crypto goes into escrow.
9. Backend verifies the on-chain event.
10. INR ledger is updated.
11. Order is marked complete.
12. Transaction appears in the history list.

Each of these steps should correspond to code, state, and a backend record.

---

## 6. Frontend Implementation

The frontend should be built as a payment app dashboard, not as a generic dApp page.

### 6.1 Key Pages

#### 6.1.1 Landing Page

Purpose:

* Introduce the product.
* Explain the QR-based payment experience.
* Give login and connect wallet actions.

Components:

* Hero section.
* Join / login card.
* Connect wallet button.
* Feature cards.
* Footer.

#### 6.1.2 Dashboard Page

Purpose:

* Show current wallet status.
* Show INR balance.
* Show recent transactions.
* Show quick actions.

Components:

* Balance card.
* Wallet connection status.
* Quick buttons: Send, Receive, Scan QR, Add Money.
* Activity feed.

#### 6.1.3 QR Scanner Page

Purpose:

* Scan receiver QR.
* Extract receiver metadata.
* Start a payment order.

Components:

* Camera view.
* Scan button.
* Manual entry fallback.
* QR validation state.

#### 6.1.4 Payment Confirmation Page

Purpose:

* Let the user review and confirm the transaction.

Components:

* Receiver profile.
* Selected currencies.
* Locked exchange rate.
* Amount breakdown.
* Confirm payment button.

#### 6.1.5 Transaction Detail Page

Purpose:

* Show full lifecycle of the order.

Components:

* Order ID.
* Tx hash.
* Status timeline.
* Escrow status.
* Timestamp list.

---

## 6.2 Frontend State Design

The frontend should maintain a small set of clearly named states.

### Example UI State

* `isWalletConnected`
* `walletAddress`
* `userProfile`
* `inrBalance`
* `activeOrder`
* `lockedRate`
* `txHash`
* `paymentStatus`
* `scannerOpen`
* `qrData`

### State Rule

The frontend should never invent payment completion by itself. It may optimistically show progress, but completion must come from backend confirmation.

---

## 6.3 Frontend Components

### Important Reusable Components

#### BalanceCard

Shows INR wallet balance and any crypto-related summary data.

#### WalletStatusBadge

Shows whether MetaMask is connected.

#### QRScanner

Handles camera permissions and decoding.

#### PaymentQuoteCard

Displays locked rate and final amount.

#### TransactionTimeline

Shows all payment stages in order.

#### QuickActionButton

Used for actions like Send, Receive, and Scan.

#### TransactionListItem

Shows each payment row in the recent history.

---

## 7. Wallet Integration Implementation

Wallet integration is one of the first technical milestones.

### 7.1 MetaMask Connection Flow

1. User clicks Connect Wallet.
2. Browser requests wallet access.
3. User approves account access.
4. App receives the wallet address.
5. App stores the address in the session or user profile.
6. App updates UI to show connected state.

### 7.2 Important Wallet Functions

* Get current account.
* Detect account changes.
* Detect network changes.
* Request transaction signature.
* Request chain switch to Polygon Amoy if needed.

### 7.3 Why Network Detection Matters

The app should not allow an AMOY transaction if the wallet is on the wrong network. The frontend should guide the user to switch to the correct chain.

### 7.4 Wallet Error Handling

Possible wallet errors:

* user rejects connection,
* user rejects signature,
* wallet is not installed,
* wrong network,
* insufficient gas,
* unsupported account state.

The frontend should display clear messages for each of these.

---

## 8. Backend Implementation

The backend is the heart of the system.

### 8.1 Core Backend Modules

#### Auth Module

Handles app login and user session management.

#### User Module

Stores and retrieves user data.

#### Order Module

Creates payment orders and manages state transitions.

#### Rate Module

Locks and returns exchange rates.

#### Ledger Module

Maintains the INR wallet balance.

#### Chain Module

Listens to blockchain events and verifies transfers.

#### Refund Module

Handles failure recovery.

#### Notification Module

Returns live status updates to the frontend.

---

## 8.2 Backend API Design

### Authentication APIs

* `POST /auth/login`
* `POST /auth/logout`
* `GET /auth/me`

### Wallet and User APIs

* `POST /users/connect-wallet`
* `GET /users/:id`
* `PATCH /users/:id`

### QR APIs

* `GET /qr/:userId`
* `POST /qr/scan`

### Order APIs

* `POST /orders`
* `GET /orders/:orderId`
* `POST /orders/:orderId/cancel`
* `POST /orders/:orderId/retry`

### Ledger APIs

* `GET /ledger/:userId/balance`
* `GET /ledger/:userId/history`
* `POST /ledger/credit`
* `POST /ledger/debit`

### Blockchain APIs

* `POST /chain/deposit`
* `POST /chain/verify`
* `POST /chain/release`
* `POST /chain/refund`

---

## 8.3 Backend Request Validation

Every incoming request should be validated using a schema layer.

Example validations:

* userId must exist,
* amount must be positive,
* currency must be one of the supported values,
* orderId must be unique,
* wallet address must be valid,
* rate must be numeric and finite.

This prevents malformed payloads from corrupting state.

---

## 8.4 Backend Order Lifecycle

### Order Creation

The backend receives payment intent and creates an order record.

### Rate Lock

The backend calculates or fetches the exchange rate and freezes it.

### Pending Escrow

The order waits for on-chain deposit.

### Verification

The chain listener confirms the correct contract event.

### Settlement

The INR ledger or destination token transfer is updated.

### Completion

The order is marked finalized.

### Failure

If something goes wrong, the order is canceled or refunded.

---

## 9. Database Implementation

A good database design is necessary because payments require history and traceability.

### 9.1 Users Table or Collection

Stores:

* id
* name
* email
* walletAddress
* qrPayload
* inrBalance
* createdAt
* updatedAt

### 9.2 Orders Table or Collection

Stores:

* id
* senderId
* receiverId
* fromCurrency
* toCurrency
* amountFrom
* amountTo
* lockedRate
* status
* escrowAddress
* txHash
* createdAt
* expiresAt

### 9.3 Transactions Table or Collection

Stores:

* id
* orderId
* chainTxHash
* verificationStatus
* settlementStatus
* errorReason
* timestamps

### 9.4 LedgerEntries Table or Collection

Stores:

* id
* userId
* orderId
* entryType
* amount
* balanceBefore
* balanceAfter
* createdAt

### 9.5 AuditLogs Table or Collection

Stores:

* id
* entityType
* entityId
* action
* metadata
* createdAt

---

## 10. INR Wallet Implementation

The internal INR wallet should behave like a lightweight banking wallet.

### Core INR Functions

* create wallet balance on user signup,
* show current balance,
* debit on outgoing INR transaction,
* credit on incoming INR transaction,
* maintain history,
* and keep ledger records.

### Ledger Rule

Every change in INR balance must have a matching ledger entry. The balance should never be updated blindly without a transaction record.

### Why Ledger Entries Matter

If a user complains or the demo needs debugging, the ledger makes it easy to explain what happened and when.

---

## 11. QR Code Implementation

QR generation and scanning are core to the user experience.

### 11.1 QR Generation

The QR should be generated from public payment metadata such as:

* user ID,
* wallet address,
* preferred receiving currency,
* display name,
* and payment alias.

### 11.2 QR Scanning

The scanner should:

* open camera access,
* decode the QR payload,
* validate the payload structure,
* send the data to the backend,
* and open the payment confirmation screen.

### 11.3 QR Validation Rules

The QR payload must be checked for:

* valid user identity,
* valid address format,
* supported currency field,
* and tamper-resistant structure.

---

## 12. Smart Contract Implementation

The smart contract should remain simple and reliable.

### 12.1 Contract Objectives

* receive deposit,
* record order ID,
* emit events,
* release funds,
* refund funds,
* and expose order state.

### 12.2 Recommended Contract Functions

* `createOrder()`
* `deposit()`
* `release()`
* `refund()`
* `getStatus()`

### 12.3 Contract Event Design

Events should be emitted for every major state change.

Example events:

* `OrderCreated`
* `DepositReceived`
* `SettlementReleased`
* `SettlementRefunded`

### 12.4 Contract State Rules

The contract should ensure:

* deposit can happen once,
* release can happen only after deposit,
* refund can happen only if unresolved or expired,
* and terminal states cannot be reversed.

---

## 13. Blockchain Listener Implementation

The chain listener is the bridge between on-chain events and backend state.

### Responsibilities

* subscribe to escrow contract events,
* verify event data against local orders,
* update backend status,
* and trigger ledger updates.

### Implementation Notes

The listener should run as a dedicated worker or service. It should not be buried in the HTTP request handler because chain confirmation is asynchronous.

### Important Checks

* event contract address is correct,
* order ID matches,
* amount matches,
* sender matches,
* event has enough confirmations,
* and the event has not been processed before.

### Idempotency Requirement

The listener must be idempotent. If the same event is seen twice, the backend should not process the order twice.

---

## 14. Rate Locking Implementation

Rate locking should be implemented as a backend service.

### Rate Source

For hackathon purposes, the rate can come from:

* a fixed mock rate,
* a manually configured rate table,
* or a lightweight rate oracle abstraction.

### Rate Lock Record

When an order is created, the backend stores:

* the current rate,
* the timestamp,
* the expiry time,
* and the source used.

### Rate Application

The order must use the locked rate for all later calculations.

### Example

If the order begins when 1 AMOY = ₹100, that value remains fixed until settlement.

---

## 15. Failure Handling Implementation

Failure handling is one of the most important parts of the system.

### Common Failures

* user rejects wallet signature,
* chain transaction fails,
* blockchain confirmation is delayed,
* order amount mismatch,
* ledger update fails,
* duplicate event arrives,
* or the order times out.

### Handling Strategy

#### 15.1 User Rejects Signature

Cancel the order before any on-chain action completes.

#### 15.2 Blockchain Transaction Fails

Mark order as failed and show error in UI.

#### 15.3 Confirmation Timeout

If the chain listener does not confirm the deposit in time, refund or cancel.

#### 15.4 Ledger Update Fails

Retry the ledger update while preserving event record. Do not lose the on-chain truth.

#### 15.5 Duplicate Event

Ignore it if already processed.

---

## 16. Refund Implementation

Refund handling is essential to keep the app safe.

### Refund Triggers

* escrow deposit never confirmed,
* verification failed,
* order expired,
* or any internal consistency failure.

### Refund Sequence

1. Detect failed or expired order.
2. Validate refund eligibility.
3. Call smart contract refund method.
4. Update backend order status.
5. Add refund record to transaction history.
6. Notify frontend.

### Refund Rule

Refunds must be traceable and must not create duplicate final states.

---

## 17. Transaction History Implementation

The transaction history page is a key part of the product feel.

### Each History Row Should Show

* recipient or sender,
* amount,
* currencies,
* status,
* time,
* and a short reference ID.

### History Types

* completed
* pending
* refunded
* failed

### Why History Matters

It gives the app the feel of a real financial product and helps the user trust the system.

---

## 18. Demo Mode Implementation

The hackathon demo should be smooth and deterministic.

### Demo Requirements

* no broken transactions,
* no unpredictable live dependencies,
* clear payment flow,
* visible status progression,
* and obvious value movement.

### Suggested Demo Scenario

1. Log in.
2. Connect MetaMask.
3. Open QR scan.
4. Scan a receiver code.
5. Enter amount.
6. Confirm AMOY to INR.
7. Show escrow deposit.
8. Show verified settlement.
9. Show INR balance increase.
10. Show history entry.

This demo path should be rehearsed multiple times.

---

## 19. Testing Strategy

Testing should be done at several levels.

### 19.1 Unit Testing

Test:

* rate calculations,
* ledger logic,
* order state transitions,
* QR parsing,
* and validation schemas.

### 19.2 Integration Testing

Test:

* frontend to backend calls,
* backend to smart contract interaction,
* chain listener event handling,
* and ledger updates.

### 19.3 End-to-End Testing

Test the full payment flow from QR scan to completion.

### 19.4 Failure Testing

Test:

* rejected signatures,
* failed deposit,
* timeout refund,
* repeated event delivery,
* wrong network,
* and invalid QR data.

---

## 20. Performance and Reliability Considerations

Even in a hackathon, the design should think about reliability.

### Recommendations

* Keep the contract minimal.
* Keep backend API responses fast.
* Process blockchain events asynchronously.
* Store every order state transition.
* Avoid long synchronous operations in request handlers.

---

## 21. Security Implementation Notes

The implementation should avoid insecure shortcuts.

### Do Not

* store seed phrases,
* hardcode private keys in frontend,
* trust frontend state for final settlement,
* update ledger without verification,
* or allow order completion without backend confirmation.

### Do

* validate everything server-side,
* sign blockchain actions only in wallet,
* use unique order IDs,
* and verify event authenticity.

---

## 22. Build Timeline for the Team

### Day 1

* finalize UI flow,
* set up repository,
* create database schema,
* create frontend skeleton.

### Day 2

* implement MetaMask connection,
* implement QR generation,
* implement backend APIs.

### Day 3

* deploy smart contract,
* integrate contract with backend,
* implement escrow deposit.

### Day 4

* implement rate lock,
* implement ledger updates,
* implement history and status screens.

### Day 5

* test failure paths,
* debug synchronization,
* polish UI,
* prepare demo.

---

## 23. What the Team Should Build First

If the team is short on time, the first build order should be:

1. Frontend layout.
2. MetaMask connection.
3. Backend order API.
4. QR scan and QR payload.
5. Escrow deposit and contract event.
6. INR ledger update.
7. History and status timeline.

This gives a visible demo sooner.

---

## 24. What the Team Should Avoid

* Overengineering the smart contract.
* Trying to build real bank integrations in the hackathon.
* Adding too many unsupported currencies.
* Building too many screens before the core flow works.
* Letting the frontend become the source of truth.
* Creating a complicated token system that no one understands.

---

## 25. Final Implementation Summary

The implementation is a step-by-step construction of a QR-based payment app that combines:

* MetaMask-based crypto signing,
* Polygon Amoy escrow settlement,
* internal INR wallet logic,
* locked conversion rates,
* backend order orchestration,
* blockchain event verification,
* and robust failure handling.

The final result is a working hackathon product that behaves like a simplified cross-currency payment platform and can later evolve into a real payments system.

---

## 26. One-Line Implementation Statement

**Build a QR-first payment app with MetaMask, Polygon Amoy escrow, rate-locked conversion, backend order orchestration, and an internal INR wallet that together simulate a complete hybrid crypto-fiat transfer flow.**

## 1. Architecture Overview

This document describes the full system architecture for a QR-based payment application that combines:

* a **MetaMask-connected crypto wallet**,
* an **internal INR wallet** inside the web app,
* a **Polygon Amoy testnet** payment layer,
* an **escrow smart contract** for safe settlement,
* and a **backend orchestration service** that manages order creation, rate locking, verification, and state transitions.

The goal of the architecture is to make the user experience feel as simple as a normal QR payment app while preserving the technical rigor of blockchain-based settlement.

The product is designed for a hackathon environment, which means the architecture must satisfy the following goals:

1. **Free to build** with no real-money integration.
2. **Realistic enough** to demonstrate a production-style flow.
3. **Non-custodial on the crypto side**.
4. **Deterministic on the internal INR side**.
5. **Safe against failed or partial transactions** through escrow and state management.
6. **Extensible** so it can later evolve into a real payment system.

---

## 2. Architectural Principles

The architecture follows a few strict principles. These are important because they define what the system is allowed to do and what it must never do.

### 2.1 User Control on the Crypto Side

The user must always control their crypto wallet through MetaMask or a similar wallet provider. The platform should never take private keys, never store seed phrases, and never act as a secret custodian.

### 2.2 Internal Ledger on the INR Side

The INR balance in the hackathon version is an internal balance sheet maintained by the platform. It behaves like a wallet, but it is not connected to real bank rails in the prototype.

### 2.3 Escrow for Safety

Any transaction that moves value from crypto to internal INR, or vice versa, must pass through a safe transactional lifecycle. Escrow is the mechanism that prevents money from being lost if one side of the transfer fails.

### 2.4 Rate Lock at Transaction Creation

The conversion rate must be fixed when the order is created. The user should not be exposed to market drift during the execution window.

### 2.5 Event-Driven Settlement

Blockchain transfer confirmation should not rely on blind frontend trust. The backend must listen to chain events and update application state only after verifying the expected on-chain behavior.

### 2.6 Small, Focused Responsibilities

Each subsystem should do one thing well:

* Frontend: user interaction
* Wallet provider: signature management
* Smart contract: escrow and release/refund
* Backend: orchestration and verification
* Database: persistence and audit trail

---

## 3. High-Level System Components

The system is divided into six major layers.

### 3.1 Frontend Application

The frontend is the user-facing interface built as a web app. It handles:

* login and onboarding,
* wallet connection,
* QR scanning,
* payment initiation,
* balance display,
* transaction history,
* and real-time status updates.

### 3.2 Wallet Layer

The wallet layer is the crypto identity and signing layer. In this hackathon version, the user connects MetaMask. This gives the app access to:

* wallet address,
* account permissions,
* transaction signing,
* and blockchain interaction.

### 3.3 Backend Orchestration Layer

The backend is the central control plane. It creates and manages payment orders, locks rates, verifies transactions, tracks state, and coordinates settlement.

### 3.4 Smart Contract Layer

The smart contract lives on Polygon Amoy and acts as the crypto escrow layer. It receives deposits, records escrow state, and releases or refunds funds based on backend-confirmed status.

### 3.5 Internal INR Ledger Layer

This is the app’s own balance system for INR representation. It is a database-backed ledger that can credit or debit balances based on completed payment flows.

### 3.6 Persistence and Audit Layer

The database stores all durable application state:

* user profiles,
* wallet mappings,
* QR metadata,
* payment orders,
* escrow state,
* transaction state,
* and logs used for debugging and reconciliation.

---

## 4. Detailed Component Architecture

## 4.1 Frontend Architecture

The frontend should be designed as a clean, modular interface rather than a single monolithic page.

### Primary Frontend Modules

#### 4.1.1 Authentication and Wallet Connection Screen

This is the entry point. It allows the user to:

* create or access an account,
* connect MetaMask,
* and initialize the internal INR wallet.

#### 4.1.2 Dashboard Screen

This is the financial control panel. It shows:

* current INR balance,
* recent transactions,
* connected wallet address,
* quick action buttons,
* and QR-related actions.

#### 4.1.3 QR Scanner Screen

This screen opens the device camera and scans the receiver’s QR code. It extracts the user identity and payment preferences.

#### 4.1.4 Payment Confirmation Screen

This screen is where the sender reviews:

* sender currency,
* receiver currency,
* locked rate,
* expected received amount,
* and the final approval button.

#### 4.1.5 Transaction Status Screen

This screen shows the payment lifecycle:

* order created,
* escrow locked,
* blockchain tx sent,
* verified,
* settled,
* refunded,
* or failed.

### Frontend State Management

The frontend must maintain application state carefully because payment flows are multi-step and asynchronous.

Important client-side states include:

* connected wallet address,
* current active order,
* locked exchange rate,
* transaction hash,
* verification status,
* and settlement result.

The frontend should never be the source of truth for payment completion. It should only present what the backend confirms.

---

## 4.2 Wallet Architecture

The wallet layer is intentionally simple in the hackathon version.

### Wallet Responsibilities

* hold the user’s blockchain identity,
* sign outgoing AMOY transactions,
* expose the account address,
* and confirm user authorization.

### Why MetaMask is Enough

MetaMask is a good choice for the prototype because:

* it is free,
* familiar to Web3 users,
* easy to integrate,
* and suitable for testnet development.

### Wallet Security Boundary

The app must never attempt to store:

* private keys,
* seed phrases,
* or signed secrets.

The wallet remains external and controlled by the user.

---

## 4.3 Backend Architecture

The backend is the most important system component because it ties together the frontend, blockchain, database, and internal ledger.

### Backend Responsibilities

1. Create a new order when a user initiates a payment.
2. Lock the exchange rate.
3. Store the order in a database.
4. Generate or validate the escrow reference.
5. Listen for blockchain events.
6. Validate transaction hashes and amounts.
7. Update the INR ledger when settlement is confirmed.
8. Trigger refunds if payment fails.
9. Keep an audit trail for every transition.

### Backend Services

A clean backend can be split into logical services.

#### 4.3.1 Order Service

Handles creation and retrieval of payment orders.

#### 4.3.2 Rate Service

Fetches the current conversion rate and freezes it for each order.

#### 4.3.3 Chain Listener Service

Subscribes to smart contract events on Polygon Amoy.

#### 4.3.4 Ledger Service

Manages internal INR account updates.

#### 4.3.5 Reconciliation Service

Ensures the blockchain state and internal database state remain consistent.

#### 4.3.6 Notification Service

Updates the frontend about order progress, success, or failure.

### Backend Trust Model

The backend is not trusted blindly. It should verify on-chain evidence before changing payment state.

---

## 4.4 Smart Contract Architecture

The smart contract is the trust anchor for the crypto side.

### Smart Contract Goals

* hold deposited AMOY during payment execution,
* store escrow status,
* release funds when settlement is confirmed,
* refund funds on timeout or failure,
* emit auditable events for the backend.

### Recommended Contract Design

A single escrow contract is enough for the hackathon MVP.

#### Core Functions

* `deposit(orderId, amount)`
* `release(orderId)`
* `refund(orderId)`
* `getOrderState(orderId)`

#### Core Events

* `OrderCreated`
* `FundsDeposited`
* `FundsReleased`
* `FundsRefunded`
* `OrderExpired`

### Contract State Machine

The contract should be stateful and deterministic.

Possible states:

* INIT
* DEPOSITED
* VERIFICATION_PENDING
* RELEASED
* REFUNDED
* EXPIRED

### Why the Contract Should Stay Minimal

The contract should not contain UI logic, rate logic, or complex business logic. Those belong to the backend. The smart contract should only protect money and expose reliable state transitions.

---

## 4.5 Internal INR Ledger Architecture

The INR wallet is a software ledger, not a real bank account in the hackathon version.

### Ledger Responsibilities

* store each user’s INR balance,
* update balances after successful transfer,
* reverse balances on failure if needed,
* and maintain a transaction trail.

### Ledger Behavior

The ledger should work like accounting software:

* every credit has a matching debit,
* every transfer is a recorded entry,
* balance changes are traceable,
* and past states can be audited.

### Why a Ledger Instead of a Single Balance Field

A single balance value is not enough for serious systems. A proper ledger stores:

* source of funds,
* destination of funds,
* timestamp,
* transaction reference,
* order ID,
* and status.

This makes debugging and future expansion easier.

---

## 4.6 Database Architecture

The database is the long-term memory of the app.

### What the Database Stores

* user profiles,
* connected wallet addresses,
* QR metadata,
* order records,
* escrow state,
* rate locks,
* transaction history,
* ledger entries,
* and failure reasons.

### Recommended Data Collections or Tables

#### Users

Contains identity and wallet mapping.

#### Orders

Contains payment intents and status.

#### Transactions

Contains execution details, hashes, and timestamps.

#### LedgerEntries

Contains all INR-side internal accounting records.

#### AuditLogs

Contains event-level logs for debugging and traceability.

### Database Integrity Rules

* An order must map to exactly one payment lifecycle.
* A transaction should not be finalized twice.
* Every refund must correspond to an original debit.
* Every successful deposit should have a matching release or refund path.

---

## 5. End-to-End Transaction Architecture

The most important part of the architecture is the actual payment flow.

## 5.1 AMOY to INR Flow

This is the main flow.

### Step 1: Receiver QR is scanned

The sender scans the receiver’s QR code.

### Step 2: Order is created

The frontend sends payment intent data to the backend.

### Step 3: Rate is locked

The backend calculates the conversion rate and stores it.

### Step 4: Escrow is prepared

The smart contract creates the escrow record for that order.

### Step 5: Sender signs blockchain transaction

MetaMask opens and the sender approves the AMOY transfer.

### Step 6: Contract receives funds

The blockchain transaction deposits funds into escrow.

### Step 7: Backend verifies the deposit

The chain listener checks whether the deposit matches the order.

### Step 8: INR ledger is credited

The receiver’s internal INR balance is updated.

### Step 9: Settlement is finalized

The order is marked completed in the database.

### Step 10: UI is updated

Both users see the result in their dashboards.

## 5.2 INR to AMOY Flow

This is the reverse direction.

### Step 1: Receiver QR is scanned

The receiver’s code is read and the system knows they prefer AMOY.

### Step 2: Order is created

The sender chooses INR as the sending currency.

### Step 3: Rate is locked

The backend freezes the amount conversion.

### Step 4: INR wallet is debited

The sender’s internal INR balance is reduced.

### Step 5: AMOY transfer is executed

The app sends AMOY to the receiver’s wallet address.

### Step 6: Result is recorded

The transaction is finalized in the backend and database.

## 5.3 AMOY to AMOY Flow

This is the simplest direct crypto transfer.

### Step 1: QR scan

### Step 2: Amount entry

### Step 3: MetaMask signature

### Step 4: On-chain transfer

### Step 5: Event confirmation

### Step 6: History update

This flow may bypass the INR ledger entirely.

---

## 6. QR Code Architecture

QR is not just a picture. It is a data container.

### What QR Can Contain

* userId
* walletAddress
* preferredReceivingCurrency
* optional display name
* optional avatar or profile tag
* optional payment routing metadata

### QR Design Principle

The QR should not contain sensitive secrets. It should only contain public or low-risk routing data.

### Why QR Matters

QR scanning is what makes the app feel like a normal payment app. It removes the need to manually type addresses, wallet IDs, or long blockchain strings.

---

## 7. Rate Locking Architecture

The rate lock engine prevents value drift.

### Rate Lock Lifecycle

1. User begins payment.
2. Backend fetches current rate.
3. Rate is stored in the order.
4. All later execution uses that stored rate.
5. Final result is calculated from the locked rate.

### Why Rate Locking Is Critical

Without locking, price changes during the transaction could create confusion, underpayment, or overpayment. Locking gives the user certainty.

### Rate Lock Data

The order should store:

* lockedRate
* lockedAtTimestamp
* expiryTime
* sourceOfRate

---

## 8. Escrow and Failure Recovery Architecture

Escrow is the mechanism that makes the system safe under failure.

### Failure Scenarios Escrow Protects Against

* blockchain transaction not confirmed,
* transaction amount mismatch,
* backend timeout,
* receiver ledger update failure,
* duplicate order execution,
* or invalid blockchain state.

### Recovery Paths

#### Refund Path

If the order cannot be completed, the contract refunds the sender.

#### Expiry Path

If the order is not settled in time, it expires and is canceled.

#### Retry Path

If the backend is unsure, it can retry verification before final refund.

### Escrow as a State Machine

Escrow should not be treated as a simple vault. It should behave as a finite state machine with explicit transitions.

---

## 9. Verification Architecture

Verification is what turns a payment attempt into a completed transaction.

### 9.1 Blockchain Verification

The backend verifies:

* the tx hash exists,
* the tx is confirmed,
* the amount matches the order,
* the correct contract was called,
* and the expected event was emitted.

### 9.2 Internal INR Verification

The INR side is verified through internal application logic:

* ledger debit succeeded,
* ledger credit succeeded,
* order status changed correctly,
* and the database log matches the event chain.

### 9.3 Why Two Verification Paths Are Needed

The crypto side is on-chain and public. The INR side is internal and software-defined. Both must be checked independently to maintain integrity.

---

## 10. API Architecture

The backend should expose a set of clear APIs.

### Suggested API Groups

#### Authentication APIs

* sign up
* log in
* connect wallet
* fetch profile

#### User and QR APIs

* fetch QR payload
* generate QR code
* update profile

#### Order APIs

* create order
* fetch order status
* cancel order
* retry order

#### Ledger APIs

* fetch INR balance
* credit INR balance
* debit INR balance
* get transaction history

#### Blockchain APIs

* initiate escrow deposit
* fetch tx status
* listen to order events
* release/refund order

### API Design Principle

Each API should be idempotent wherever possible. This is important because payment systems can receive repeated requests due to network retries or frontend refreshes.

---

## 11. Event Flow Architecture

This system should be event-driven rather than purely request-response.

### Important Events

* wallet connected
* QR scanned
* order created
* rate locked
* escrow funded
* blockchain confirmed
* INR credited
* payment settled
* payment refunded
* order expired

### Why Event-Driven Matters

Event-driven systems are better for payment workflows because:

* they naturally reflect asynchronous settlement,
* they are easier to audit,
* they are safer for handling retries,
* and they separate user interaction from settlement completion.

---

## 12. State Transition Architecture

Every order should move through valid states only.

### Example State Flow

INIT → RATE_LOCKED → ESCROW_DEPOSITED → VERIFICATION_PENDING → SETTLED

Or:

INIT → RATE_LOCKED → ESCROW_DEPOSITED → VERIFICATION_PENDING → REFUNDED

### Why State Transitions Matter

A payment system must not allow invalid jumps. For example:

* an order should not jump from INIT directly to SETTLED,
* a refund should not happen after final completion,
* and the same order should never be settled twice.

---

## 13. Audit and Observability Architecture

Because this is a transaction system, logs and tracing are not optional.

### What Should Be Logged

* order creation,
* rate lock data,
* blockchain transaction hash,
* contract event confirmations,
* ledger updates,
* refund actions,
* API failures,
* retries,
* and timeout handling.

### Why Observability Matters

If something breaks during a payment flow, the team must be able to answer:

* what happened,
* where it failed,
* which subsystem was involved,
* and whether the user money state is still valid.

---

## 14. Security Architecture

Even for a hackathon, security should be treated seriously.

### Security Goals

* prevent unauthorized wallet actions,
* prevent duplicate settlement,
* prevent state tampering,
* prevent fake completion,
* and protect the ledger from invalid writes.

### Security Controls

#### Authentication

User must authenticate into the web app.

#### Wallet Signature

Crypto transfers require user signature.

#### Order Validation

Backend validates order IDs and amounts.

#### Escrow Isolation

Funds are locked in a contract rather than handled directly by backend memory.

#### Database Access Control

Only backend services should be able to modify sensitive transactional tables.

---

## 15. Scalability Architecture

The hackathon version can be simple, but the structure should support growth.

### How the Architecture Can Scale

* separate order service from ledger service,
* use queue-based processing for blockchain confirmations,
* keep the smart contract minimal,
* add provider adapters later,
* and make rate service swappable.

### Horizontal Scaling Possibilities

* more backend instances,
* more chain listener workers,
* separate notification service,
* externalized rate engine,
* and modular payment adapters.

---

## 16. Production Evolution Path

This architecture is deliberately designed so it can later evolve into a real-world product.

### What Would Change in Production

* the internal INR wallet could be replaced with real fiat rails,
* the backend could integrate a regulated payment partner,
* the ledger could connect to actual settlement systems,
* and the escrow mechanism could continue as the safety anchor.

### What Would Stay the Same

* QR-based UX,
* wallet connection,
* order creation,
* rate locking,
* escrow lifecycle,
* and event-based verification.

---

## 17. Recommended Technology Roles

### Frontend

* Next.js or React
* QR scanner library
* wallet connection SDK
* state management
* transaction UI

### Backend

* Node.js / Express or NestJS
* database ORM
* blockchain client
* rate service
* audit logger

### Blockchain

* Polygon Amoy
* Solidity escrow contract
* event emission

### Database

* MongoDB or PostgreSQL
* transaction tables
* ledger tables
* audit logs

### Wallet

* MetaMask
* browser wallet integration

---

## 18. Recommended Request Lifecycle

A clean request lifecycle should look like this:

1. User scans QR.
2. Frontend requests receiver metadata.
3. Backend creates order.
4. Backend locks rate.
5. Frontend prompts wallet signature.
6. Transaction goes on-chain.
7. Listener confirms escrow deposit.
8. Backend finalizes settlement.
9. Ledger updates.
10. UI refreshes.

This sequence should be strictly maintained for correctness.

---

## 19. Final Architecture Summary

The architecture combines:

* **front-end payment UX**,
* **wallet-based crypto signing**,
* **smart contract escrow**,
* **backend orchestration**,
* **internal INR ledger**,
* **rate locking**,
* **event-driven verification**,
* and **audit-safe state transitions**.

The result is a QR payment platform that feels simple to the user but is built on a serious payment architecture.

---

## 20. One-Line Architecture Statement

**A QR-driven, escrow-backed, rate-locked payment architecture where MetaMask handles the crypto side, the backend orchestrates order settlement, and the internal INR wallet provides UPI-like balance behavior for a seamless hybrid payment experience.**

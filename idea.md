## 1. Project Overview

This project is a **QR-based payment application** that lets users transfer value between a crypto wallet and an internal INR wallet with a very simple user experience. The user connects a **MetaMask wallet** for blockchain-based transactions on **Polygon Amoy testnet**, while the app also provides an **internal INR wallet** that behaves like a UPI-style balance inside the website.

The core idea is:

* A user scans another user’s QR code.
* The sender selects the transaction currency, for example **AMOY**.
* The receiver selects or has a preferred receiving currency, for example **INR**.
* The system locks the exchange rate at the time of initiation.
* The sender’s crypto is transferred through an escrow smart contract.
* The receiver’s INR balance is updated inside the app’s internal ledger.
* If the transfer fails, the escrow contract refunds the sender.

This gives the experience of a modern payments app while remaining hackathon-friendly, testnet-based, and technically realistic.

---

## 2. Problem Statement

Existing payment systems are fragmented:

* Crypto wallets are fast and programmable, but they are not user-friendly for everyday payments.
* UPI is extremely convenient, but it only works within fiat rails.
* Most users do not want to think in terms of chain, token, gas fee, or conversion steps.
* QR-based payments are familiar, but crypto wallets and fiat wallets are usually disconnected from each other.

There is no clean user experience that lets a sender pay using crypto while the receiver sees value in a familiar INR-style balance in the same app flow.

The project solves this gap by abstracting away the complexity of blockchain and balance conversion behind a single QR-driven payment interaction.

---

## 3. Product Vision

The vision is to create a **single payment interface** where money can move across two representations of value:

1. **Blockchain value** through MetaMask and Polygon Amoy.
2. **Internal INR value** through a wallet system inside the app.

The user should not need to understand the underlying conversion, escrow, or verification logic. The app should feel as simple as scanning a QR code and tapping Pay.

The product is designed to be:

* **Non-custodial on the crypto side**: users sign transactions themselves.
* **Wallet-centric**: users own or control the blockchain wallet.
* **Ledger-based on the INR side**: INR balance is represented internally for the hackathon.
* **Rate-locked**: exchange rate is fixed at the time of transaction initiation.
* **Escrow-backed**: transactions are protected against partial failure.
* **QR-first**: the main interaction is scanning and paying.

---

## 4. Scope of the Hackathon Version

For the hackathon, the product will **not use real UPI rails or real bank integrations**. Instead:

* **AMOY** is real on Polygon Amoy testnet.
* **INR** is represented as an internal wallet balance in the web app.
* **Price conversion** is locked using a backend rate engine or mock oracle.
* **Transaction verification** is done through blockchain event listening and backend state management.
* **Escrow** is used to handle failures safely.

This keeps the build free, realistic, and demoable, while also allowing a future upgrade path to real fiat rails.

---

## 5. Main User Experience

The app experience should feel like a hybrid of a crypto wallet and a UPI wallet.

### 5.1 Login and Onboarding

* A user opens the app.
* They either sign in or create an account.
* They connect their **MetaMask wallet**.
* The wallet address becomes their blockchain identity.
* The app also creates or loads their internal INR wallet balance.

### 5.2 QR Payment Flow

* User 1 scans User 2’s QR code.
* The QR code contains User 2’s identity and payment preferences.
* The sender chooses the outgoing currency, such as **AMOY**.
* The receiver side shows the expected receiving currency, such as **INR**.
* The sender confirms the transaction.
* The system locks the rate.
* The sender signs the blockchain transaction.
* Escrow receives the crypto.
* The receiver’s internal INR balance updates.
* The app shows the transaction as completed.

### 5.3 Reverse Flow

The same system can also support the reverse direction:

* User pays using INR from the internal wallet.
* Receiver gets AMOY.
* The app handles the conversion using the same order and verification pipeline.

---

## 6. Core Design Philosophy

This project is not trying to be a full bank or a fully decentralized exchange. It is a **currency abstraction layer**.

That means the system hides the complexity of:

* wallet mechanics,
* rate conversion,
* blockchain confirmation,
* transaction failure handling,
* and balance representation.

Users only see a payment flow.

This is important because the product value is not in forcing users to understand Web3. The product value is in making blockchain-backed transfers feel as easy as a normal mobile payment app.

---

## 7. Key Features

### 7.1 MetaMask Wallet Connection

The app uses MetaMask to sign crypto transactions. This is the crypto side of the system.

Why it matters:

* It gives the user full control over the blockchain wallet.
* It keeps the crypto side non-custodial.
* It makes the app immediately understandable to Web3 users.

### 7.2 Internal INR Wallet

The app includes a PhonePe-like INR balance inside the website.

Important note:

* This INR balance is **not real bank money** in the hackathon version.
* It is an internal ledger that simulates fiat balance movement.
* It is used to demonstrate the app’s payment logic and wallet abstraction.

### 7.3 QR-Based Transfers

QR is the main entry point for payments.

A QR code can carry:

* user ID,
* wallet address,
* preferred receiving currency,
* optional alias or display name,
* and payment metadata.

### 7.4 Rate Locking

The exchange rate is locked at the moment the order is created.

This solves price fluctuation issues.

If the value of AMOY changes during the transaction:

* the transaction still uses the original locked value,
* the sender is not charged a moving price,
* the receiver gets the exact expected INR amount based on the initiation rate.

### 7.5 Escrow Protection

The system uses a smart contract escrow to hold the crypto temporarily.

Escrow ensures:

* funds are not lost if verification fails,
* partial settlement can be rolled back,
* the app can recover from timeout or error conditions,
* the transaction is safe and auditable.

### 7.6 Transaction Verification

The system verifies blockchain transactions by checking:

* transaction hash,
* sender address,
* receiver/escrow address,
* transferred amount,
* order ID linkage,
* and confirmation status.

This ensures the app only marks a transaction complete when the expected on-chain event actually occurs.

---

## 8. Data Model

A clean data model is essential for the app.

### 8.1 User

Represents a user account in the app.

Fields:

* userId
* name
* walletAddress
* qrCodeId
* inrBalance
* amoyBalanceDisplay
* transactionHistory
* createdAt

### 8.2 Order

Represents a payment intent.

Fields:

* orderId
* senderUserId
* receiverUserId
* fromCurrency
* toCurrency
* amountInFromCurrency
* lockedRate
* amountInToCurrency
* status
* txHash
* escrowAddress
* createdAt
* expiresAt

### 8.3 Transaction

Represents the actual transfer lifecycle.

Fields:

* transactionId
* orderId
* blockchainTxHash
* verificationStatus
* settlementStatus
* refundStatus
* failureReason
* timestamps

---

## 9. Workflow in Detail

### 9.1 AMOY to INR

This is the primary use case.

#### Step 1: QR Scan

User 1 scans User 2’s QR code.

#### Step 2: Payment Intent

User 1 selects:

* send currency: AMOY
* receive currency: INR

#### Step 3: Rate Lock

The backend fetches or calculates the current AMOY-to-INR rate and freezes it for the order.

#### Step 4: Escrow Creation

A payment order is created and the smart contract escrow is prepared.

#### Step 5: User Signature

User 1 confirms and signs the blockchain transaction from MetaMask.

#### Step 6: On-Chain Verification

The backend listens for escrow deposit events and confirms the transfer.

#### Step 7: INR Credit

Once confirmed, the receiver’s INR balance is updated in the internal wallet.

#### Step 8: Completion

The transaction is marked complete and appears in both users’ histories.

### 9.2 INR to AMOY

This is the reverse payment flow.

#### Step 1: QR Scan

User 1 scans the receiver’s QR.

#### Step 2: Payment Intent

User 1 chooses to pay from INR.

#### Step 3: Rate Lock

The conversion rate is locked.

#### Step 4: INR Debit

The sender’s internal INR balance is debited.

#### Step 5: AMOY Credit

The receiver gets AMOY according to the locked conversion.

#### Step 6: Finalization

The transaction is settled and displayed as complete.

### 9.3 AMOY to AMOY

This is the pure crypto transfer mode.

* The sender scans QR.
* The sender selects AMOY as both the sending and receiving representation.
* The app simply transfers tokens on-chain.
* The internal INR layer is not involved.

This mode is useful for direct wallet-to-wallet transfers.

---

## 10. Escrow Logic

Escrow is the protection mechanism that makes the system trustworthy.

### Why Escrow Matters

Without escrow:

* a failed blockchain transaction could create state mismatch,
* a failed verification could cause loss of funds,
* the receiver could be credited before the sender’s transfer is truly confirmed.

### What Escrow Does

* Holds the crypto temporarily.
* Releases it only when the backend confirms the payment chain is valid.
* Refunds it if the timeout or failure condition is triggered.

### Escrow States

* INIT
* FUNDS_LOCKED
* VERIFICATION_PENDING
* SETTLED
* REFUNDED
* FAILED

---

## 11. Verification Strategy

The verification system must be reliable enough for a demo and realistic enough to scale later.

### Crypto Verification

The app checks:

* whether the transaction hash exists,
* whether it points to the escrow contract,
* whether the value matches the locked order,
* whether the transaction has enough confirmations,
* whether the event emitted matches the expected order.

### INR Verification

For the hackathon version, INR verification is internal.

That means:

* the system directly updates the internal ledger,
* no external bank confirmation is required,
* the app can still display a full payment lifecycle,
* and the flow remains deterministic.

This is a clean solution because it avoids fake UPI integration while preserving the UPI-like feel.

---

## 12. Why Price Fluctuation Does Not Break the Transaction

This project is designed so that the exchange rate is fixed when the user starts the payment.

That means:

* if the sender starts with 10 AMOY and the rate is 1 AMOY = ₹100,
* then the receiver gets ₹1000,
* even if the market value changes later.

This prevents a broken or unfair user experience.

### Why This Matters

Without rate locking:

* the user could see one amount and receive another,
* the transaction could fail due to value drift,
* the system would feel unreliable.

With rate locking:

* the payment is stable,
* the user sees a deterministic quote,
* and the receiver gets the expected amount.

---

## 13. Security Considerations

Even in a hackathon prototype, security should be part of the design.

### 13.1 Wallet Ownership

Only the wallet owner can sign blockchain transfers.

### 13.2 Order Uniqueness

Each payment order must have a unique ID to prevent duplicates.

### 13.3 Timeout Protection

If verification takes too long, the order expires and escrow refunds the sender.

### 13.4 Double Spend Protection

The app must ensure the same order cannot be executed twice.

### 13.5 State Validation

The backend should validate that the order status transitions happen in the correct sequence.

---

## 14. UX Principles

The app should feel simple, fast, and familiar.

### UX Goals

* One primary action: scan QR.
* One primary confirmation: send.
* One primary feedback loop: success/failure status.
* Minimal jargon.
* Clear display of both currency modes.

### Visual Style

The interface can be inspired by mainstream payment apps:

* balance card at the top,
* quick action buttons,
* transaction history feed,
* clean QR scan page,
* clear wallet status.

The important point is that the user should never feel like they are interacting with a complicated blockchain system.

---

## 15. Backend Responsibilities

The backend is the orchestrator of the system.

### It must:

* create payment orders,
* lock exchange rates,
* track transaction states,
* listen to blockchain events,
* update the internal INR ledger,
* handle refunds and failures,
* record audit logs,
* and serve data to the frontend.

The backend is not the wallet and not the chain. It is the brain that coordinates the payment lifecycle.

---

## 16. Smart Contract Responsibilities

The smart contract should stay focused.

### It should:

* receive deposits,
* hold funds in escrow,
* emit events on deposit and release,
* allow release only when the backend approves settlement,
* allow refund when the order expires or fails.

The smart contract should not contain unnecessary business logic. Its role is to be the trust anchor for the crypto side.

---

## 17. Internal INR Wallet Responsibilities

The internal INR wallet acts like a balance sheet for the app.

### It should:

* store INR balances per user,
* update balances on completed orders,
* deduct balances on reverse transfers,
* show history and current total,
* and behave like a simple fintech wallet.

This is the cleanest way to show fiat-style UX in a hackathon without legal complexity.

---

## 18. Future Production Direction

The hackathon version is intentionally simplified. But the architecture is designed to grow.

A future production version could replace the internal INR ledger with real fiat rails and regulated payout integrations.

That would mean:

* escrow remains the safety layer,
* the backend becomes the orchestration layer,
* the wallet layer remains user-owned,
* and the internal INR balance could become an actual fiat settlement account.

So the hackathon build is not a dead-end. It is a prototype architecture with a clear growth path.

---

## 19. Why This Idea Is Strong

This project is strong because it combines:

* a familiar payment UX,
* blockchain-based transfer logic,
* rate-locked conversion,
* a simple QR scan flow,
* and a practical hackathon scope.

It avoids the common failure of Web3 projects, where the idea is flashy but the user experience is unclear.

Instead, this idea makes the blockchain part invisible to the user while still using blockchain in a meaningful way.

---

## 20. Final Summary

This project is a **QR-based blockchain payment app** with an internal INR wallet and a MetaMask-connected crypto wallet.

The user can:

* scan a QR code,
* choose the payment currency,
* lock the exchange rate,
* transfer AMOY through escrow,
* and credit INR in the app wallet.

The system is protected by:

* escrow,
* transaction verification,
* locked rates,
* and backend-controlled settlement.

For the hackathon, the whole product is free to build, testnet-based, and fully demoable, while still feeling like a serious payments product.

---

## 21. One-Line Pitch

**A QR-based, escrow-protected, rate-locked payment app that lets users pay with crypto and receive value in an INR-style wallet through a seamless UPI-like experience.**

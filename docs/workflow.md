## 1. Purpose of This Document

This document provides a **deep, step-by-step breakdown of all workflows** in the system. It explains how data, value, and control move through the application across different use cases.

The goal is to:

* make the system behavior crystal clear
* define exact step-by-step flows for implementation
* help during debugging and demo
* ensure no ambiguity in transaction lifecycle

This document is the **operational layer** of the project.

---

## 2. Core Workflow Philosophy

All workflows in this system follow a unified pattern:

> **Intent → Order Creation → Rate Lock → Execution → Verification → Settlement → Final State**

This pattern ensures:

* consistency
* safety
* traceability
* easy debugging

---

## 3. Global Entities Involved in Every Workflow

Every transaction involves the following entities:

### 3.1 Sender (User A)

* initiates payment
* signs crypto transactions (if applicable)

### 3.2 Receiver (User B)

* receives value (INR or AMOY)

### 3.3 Frontend

* collects input
* displays state

### 3.4 Backend

* orchestrates everything
* stores order
* verifies events

### 3.5 Smart Contract (Escrow)

* holds crypto temporarily
* ensures safe settlement

### 3.6 Database

* stores all state

---

## 4. Order Lifecycle (Universal)

Every payment follows this lifecycle:

1. INIT
2. RATE_LOCKED
3. PENDING_EXECUTION
4. ESCROW_DEPOSITED (if crypto involved)
5. VERIFICATION_PENDING
6. SETTLED or REFUNDED or FAILED

---

## 5. WORKFLOW 1: AMOY → INR (Primary Flow)

This is the **most important workflow**.

---

### Step 1: QR Scan

User A scans User B’s QR.

Frontend extracts:

* receiverId
* preferredCurrency = INR
* walletAddress

---

### Step 2: User Input

User A enters amount in AMOY.

---

### Step 3: Order Creation

Frontend → Backend:

* senderId
* receiverId
* amount
* from = AMOY
* to = INR

Backend creates:

* orderId
* status = INIT

---

### Step 4: Rate Lock

Backend:

* fetches rate
* calculates INR equivalent
* stores lockedRate

Order becomes:

* RATE_LOCKED

---

### Step 5: Payment Confirmation

Frontend shows:

* AMOY amount
* INR equivalent
* locked rate

User confirms.

---

### Step 6: Escrow Deposit

User signs transaction via MetaMask.

Transaction:

* sent to escrow contract
* includes orderId

Order → PENDING_EXECUTION

---

### Step 7: Blockchain Event

Smart contract emits:

* Deposit(orderId)

---

### Step 8: Backend Verification

Backend listener:

* detects event
* verifies:

  * orderId
  * amount
  * sender

Order → ESCROW_DEPOSITED

---

### Step 9: INR Credit

Backend:

* updates receiver.inrBalance

---

### Step 10: Final Settlement

Order → SETTLED

Frontend updates UI.

---

### Failure Path

If any step fails:

* backend triggers refund
* smart contract returns AMOY
* order → REFUNDED

---

## 6. WORKFLOW 2: INR → AMOY

Reverse direction.

---

### Step 1: QR Scan

Receiver prefers AMOY.

---

### Step 2: Input INR Amount

User A enters INR amount.

---

### Step 3: Order Creation

Backend creates order.

---

### Step 4: Rate Lock

INR → AMOY conversion locked.

---

### Step 5: INR Debit

Backend:

* deducts sender INR

---

### Step 6: Crypto Transfer

Backend or system wallet sends AMOY.

---

### Step 7: Completion

Receiver gets crypto.
Order → SETTLED

---

### Failure Path

If crypto fails:

* INR refunded

---

## 7. WORKFLOW 3: AMOY → AMOY

Pure blockchain transfer.

---

### Steps

1. QR scan
2. amount input
3. MetaMask signature
4. direct transfer
5. confirmation

No INR ledger involved.

---

## 8. WORKFLOW 4: INR → INR

Internal transfer.

---

### Steps

1. QR scan
2. debit sender INR
3. credit receiver INR
4. update history

---

## 9. QR FLOW DETAILS

### QR Generation

Contains:

* userId
* walletAddress
* preferredCurrency

---

### QR Scan

Process:

1. open camera
2. scan
3. decode payload
4. validate
5. send to backend

---

## 10. RATE LOCK FLOW

### Steps:

1. fetch rate
2. store rate
3. calculate output
4. attach to order

---

## 11. ESCROW FLOW

### Steps:

1. create order
2. deposit crypto
3. contract locks funds
4. backend verifies
5. release or refund

---

## 12. VERIFICATION FLOW

### Crypto Verification

* check txHash
* check event
* check amount

### INR Verification

* internal ledger update

---

## 13. FAILURE WORKFLOW

### Possible Failures

* user cancels
* tx fails
* timeout

### Handling

* cancel order
* refund
* log error

---

## 14. TIMEOUT WORKFLOW

### Logic:

* set expiry time
* if exceeded:

  * auto refund

---

## 15. DUPLICATE HANDLING

### Rule:

* same orderId cannot execute twice

---

## 16. EVENT FLOW

### Key Events

* order created
* rate locked
* deposit
* verified
* settled
* refunded

---

## 17. STATE TRANSITIONS

Valid transitions only.

Invalid transitions must be rejected.

---

## 18. UI WORKFLOW

User journey:

1. login
2. connect wallet
3. dashboard
4. scan QR
5. confirm
6. track status

---

## 19. DEMO WORKFLOW

Ideal demo:

1. connect wallet
2. scan QR
3. send AMOY
4. show INR credit
5. show history

---

## 20. FINAL WORKFLOW SUMMARY

Every transaction:

Intent → Order → Rate Lock → Execution → Verification → Settlement

---

## 21. One-Line Workflow Summary

A deterministic payment workflow where every QR scan creates a rate-locked order that executes through escrow, verifies via blockchain events, and settles through an internal INR ledger.

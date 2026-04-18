## 1. Purpose of This Document

This document defines the complete technology stack for building the QR-based crypto ↔ INR payment system. It explains not just *what* technologies are used, but *why* each one is chosen, what role it plays, and how all components interact together.

The goal is to ensure:

* clarity in development responsibilities
* consistency across frontend, backend, and blockchain layers
* scalability for future production upgrades
* simplicity for hackathon execution

---

## 2. Tech Stack Philosophy

The stack is chosen based on the following principles:

### 2.1 Simplicity First

Avoid unnecessary complexity. Use tools that are easy to set up, widely documented, and fast to develop with.

### 2.2 Modularity

Each layer (frontend, backend, blockchain) should be independent but well-integrated.

### 2.3 Realistic but Hackathon-Friendly

The stack should simulate real-world systems without requiring paid APIs or complex infrastructure.

### 2.4 Developer Productivity

Choose tools that allow rapid iteration, debugging, and testing.

---

## 3. High-Level Stack Overview

The system is divided into 5 major layers:

1. Frontend (UI + UX)
2. Wallet Integration Layer
3. Backend (API + Orchestration)
4. Blockchain Layer (Smart Contracts)
5. Database & Storage

---

## 4. Frontend Tech Stack

### 4.1 Framework: Next.js (React)

#### Why:

* Fast development
* Built-in routing
* SSR/CSR flexibility
* Huge ecosystem

#### Role:

* UI rendering
* Page navigation
* Client-side state management
* API communication

---

### 4.2 Styling: Tailwind CSS

#### Why:

* Rapid UI development
* Utility-first approach
* No need for custom CSS architecture

#### Role:

* Build modern, clean UI similar to UPI apps

---

### 4.3 State Management

Recommended:

* React Context (basic)
* React Query / TanStack Query (advanced)

#### Why:

* Manage async API calls
* Handle caching
* Maintain UI consistency

---

### 4.4 QR Code Libraries

#### Generation:

* `qrcode`

#### Scanning:

* `react-qr-reader`

#### Role:

* Generate user QR
* Scan receiver QR
* Decode payment payload

---

### 4.5 Web3 Integration Library

Options:

* ethers.js (recommended)
* viem (modern alternative)

#### Why:

* Easy wallet interaction
* Contract communication
* Event handling

#### Role:

* connect MetaMask
* sign transactions
* send transactions

---

## 5. Wallet Layer

### 5.1 MetaMask

#### Why:

* Most popular wallet
* No setup cost
* Easy testnet support

#### Role:

* user authentication (via address)
* transaction signing
* account management

---

### 5.2 WalletConnect (Optional)

#### Why:

* support mobile wallets

---

### 5.3 Account Abstraction (Future)

For production:

* smart wallets
* gasless transactions

---

## 6. Backend Tech Stack

### 6.1 Runtime: Node.js

#### Why:

* fast
* async-friendly
* same language as frontend (JavaScript/TypeScript)

---

### 6.2 Framework: Express / NestJS

#### Express:

* simple
* minimal

#### NestJS:

* scalable
* structured

Recommended for hackathon: **Express**

---

### 6.3 Language: TypeScript

#### Why:

* type safety
* fewer runtime errors
* better scalability

---

### 6.4 API Layer

#### Role:

* create orders
* manage users
* handle ledger
* verify transactions

---

### 6.5 Validation: Zod

#### Why:

* runtime validation
* schema enforcement

---

### 6.6 Blockchain Interaction

Library:

* ethers.js

#### Role:

* listen to events
* verify transactions
* interact with smart contract

---

## 7. Database Tech Stack

### 7.1 Database Choice

Options:

#### MongoDB

* flexible schema
* fast prototyping

#### PostgreSQL

* structured
* relational integrity

Recommended: **MongoDB (hackathon)**

---

### 7.2 ORM / ODM

* Mongoose (MongoDB)
* Prisma (PostgreSQL)

---

### 7.3 Data Stored

* Users
* Orders
* Transactions
* Ledger entries
* Audit logs

---

## 8. Blockchain Tech Stack

### 8.1 Network: Polygon Amoy Testnet

#### Why:

* low gas
* fast transactions
* EVM compatible

---

### 8.2 Smart Contract Language: Solidity

#### Why:

* industry standard
* well-documented

---

### 8.3 Development Framework

Options:

* Hardhat (recommended)
* Foundry (advanced)

---

### 8.4 Contract Responsibilities

* escrow funds
* emit events
* release funds
* refund funds

---

### 8.5 Event System

Important events:

* Deposit
* Release
* Refund

---

## 9. Internal INR Wallet Tech

### 9.1 Implementation Type

* database-backed ledger

### 9.2 Why Not Real UPI?

* regulatory issues
* complexity
* hackathon constraints

### 9.3 Responsibilities

* store INR balance
* update on transactions
* maintain history

---

## 10. Rate Engine

### 10.1 Type

* mock or fixed rate

### 10.2 Future

* integrate price oracle

### 10.3 Role

* lock conversion rate
* ensure stable transaction outcome

---

## 11. Blockchain Listener

### 11.1 Implementation

* backend worker using ethers.js

### 11.2 Responsibilities

* listen to contract events
* verify deposits
* trigger settlement

---

## 12. DevOps & Deployment

### 12.1 Hosting

Frontend:

* Vercel

Backend:

* Render / Railway / AWS

---

### 12.2 Environment Variables

* RPC URL
* contract address
* DB connection

---

### 12.3 Version Control

* GitHub

---

## 13. Testing Stack

### 13.1 Frontend Testing

* manual testing
* basic unit testing

### 13.2 Backend Testing

* API testing (Postman)

### 13.3 Smart Contract Testing

* Hardhat tests

---

## 14. Security Stack

### Measures:

* input validation (Zod)
* wallet signature verification
* backend verification of tx
* unique order IDs

---

## 15. SDK Layer (Optional Advanced)

### Purpose:

* allow other apps to use your payment system

### Implementation:

```js
sdk.pay({
  from: "crypto",
  to: "INR",
  amount: 100
})
```

---

## 16. Future Stack Upgrades

* real fiat rails (Razorpay, Cashfree)
* account abstraction wallets
* multi-chain support
* real price oracle

---

## 17. Final Tech Stack Summary

Frontend:

* Next.js
* Tailwind

Backend:

* Node.js
* Express

Database:

* MongoDB

Blockchain:

* Polygon Amoy
* Solidity

Wallet:

* MetaMask

---

## 18. One-Line Stack Summary

A full-stack system using Next.js, Node.js, MongoDB, MetaMask, and Polygon smart contracts to deliver a QR-based crypto-fiat abstraction payment experie

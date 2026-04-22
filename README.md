<div align="center">
 
## 🎥 SwyftPay Demo

[![SwyftPay Demo Video](./web/public/logo.png)](https://youtu.be/dmW97PE1v04)

▶️ **[Watch Demo Video on Youtube](https://youtu.be/dmW97PE1v04)**


Sentinel connects **Off-Chain AI** with **On-Chain Enforcement**, enabling smart contracts to assess wallet risk in real-time using Soroban.


### **Pay Crypto. Receive INR. One QR.**

*A cross-currency, escrow-backed payment infrastructure built on Polygon — where blockchain meets real money.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Polygon](https://img.shields.io/badge/Polygon_Amoy-8247E5?style=for-the-badge&logo=polygon)](https://polygon.technology)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay)](https://razorpay.com)
[![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)

<br/>

> 🏆 Built for Hackathon — Live on **Polygon Amoy Testnet**

</div>

---

## 🎯 The Problem

Crypto is powerful. But **receiving crypto is useless** if you need INR to pay rent.

Traditional payment apps require both parties to be on the same network. Cross-border and cross-currency payments involve multiple intermediaries, delayed settlement, and hidden fees.

**SwyftPay fixes this.**

---

## 💡 What is SwyftPay?

SwyftPay is a **QR-based cross-currency payment system** that lets anyone:

- 📤 **Send** AMOY (Polygon) crypto from a MetaMask wallet
- 📥 **Receive** the equivalent in **INR**, directly to their UPI

No exchange accounts. No middlemen. No waiting. Just scan → pay → done.

---

## ✨ How It Works

```
Sender scans QR  →  Selects AMOY amount  →  Smart contract escrow locks rate
→  Settlement watcher confirms on-chain  →  Receiver's INR wallet credited
→  Receiver withdraws to UPI via Razorpay
```

| Step | What Happens | Technology |
|------|-------------|------------|
| 1️⃣ **Scan QR** | Receiver's wallet address + name auto-fills | Native `BarcodeDetector` API + `jsQR` |
| 2️⃣ **Pay in AMOY** | Sender approves via MetaMask | Polygon Amoy + `ethers.js` |
| 3️⃣ **Escrow Lock** | Rate locked at initiation, funds held in smart contract | Solidity Escrow Contract |
| 4️⃣ **Settlement** | On-chain event detected, INR balance credited instantly | Node.js watcher + `eth_getLogs` |
| 5️⃣ **Withdraw** | Receiver cashes out to any UPI via Razorpay checkout | Razorpay Orders + HMAC Verify |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SwyftPay Platform                       │
│                                                              │
│   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │  Next.js 15  │    │  Solidity    │    │  Settlement  │  │
│   │  Frontend    │───▶│  Escrow      │───▶│  Watcher     │  │
│   │  (App Dir)   │    │  Contract    │    │  (Node.js)   │  │
│   └─────────────┘    └──────────────┘    └──────┬───────┘  │
│          │                                        │          │
│          ▼                                        ▼          │
│   ┌─────────────┐                        ┌──────────────┐  │
│   │  Prisma +   │                        │  INR Balance │  │
│   │  PostgreSQL  │◀───────────────────────│  Credit +    │  │
│   │  (BetterAuth)│                        │  Razorpay    │  │
│   └─────────────┘                        └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| `Next.js 15` (App Router) | Full-stack framework |
| `TypeScript` | Type-safe development |
| `TailwindCSS v4` | Styling |
| `BetterAuth` | Authentication (Email + Google OAuth) |
| `ethers.js` | Wallet + contract interaction |
| `Razorpay Checkout.js` | INR withdrawal popup |
| `jsQR` + `BarcodeDetector` | Native camera QR scanning |
| `react-qr-code` | Unique QR generation per user |

### Backend / Smart Contracts
| Technology | Purpose |
|-----------|---------|
| `Solidity` | Escrow smart contract on Polygon |
| `Prisma` + `PostgreSQL` | Database ORM |
| `Node.js` Settlement Watcher | Listens to `eth_getLogs` for `OrderCreated` events |
| `HMAC-SHA256` | Razorpay payment signature verification |
| `Neon DB` | Serverless PostgreSQL hosting |

---

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| ⚡ **< 2s Settlement** | On-chain event detected and INR credited in under 2 seconds |
| 🔒 **Escrow-Backed** | Funds locked in smart contract — never at risk |
| 📱 **QR Scan-to-Pay** | Real camera, real scanning, real auto-fill |
| 💸 **Razorpay Withdrawal** | Real checkout flow with HMAC signature verification |
| 🎯 **0% Platform Fee** | No hidden charges during hackathon phase |
| 🔐 **Non-Custodial** | We never touch your private keys |
| 🌐 **Unique QR per User** | Each user gets a unique QR encoding their wallet + name |
| 🎵 **Success Audio** | Payment success triggers audio feedback |

---

## 📁 Project Structure

```
SwyftPay/
├── web/                        # Next.js 15 frontend + API routes
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page (cinematic, no-scroll SPA)
│   │   │   ├── auth/           # Sign in / Sign up + MetaMask connect
│   │   │   ├── dashboard/      # Main user dashboard
│   │   │   ├── send/           # Send AMOY payments
│   │   │   ├── receive/        # QR code generation
│   │   │   ├── scan/           # Live camera QR scanner
│   │   │   ├── wallet/         # Wallet management
│   │   │   ├── inventory/      # INR balance + Razorpay withdraw
│   │   │   └── api/
│   │   │       ├── razorpay/   # create-order + verify (HMAC)
│   │   │       ├── transactions/
│   │   │       └── wallet/
│   │   └── components/         # Shared UI components
│   └── prisma/                 # Database schema + migrations
│
├── backend/
│   └── settle.js               # Settlement watcher (polls Polygon every 5s)
│
└── contracts/                  # Solidity escrow contracts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- PostgreSQL database (or Neon DB)
- Razorpay test account

### Environment Setup

```bash
# web/.env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_CONTRACT_ADDRESS="0x..."
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
```

### Run Locally

```bash
# 1. Install & start frontend
cd web
npm install
npm run dev

# 2. Start settlement watcher
cd backend
node settle.js

# 3. Open http://localhost:3000
```

---

## 💳 Payment Flow (Demo)

1. **Sign up** with email or Google
2. **Connect MetaMask** wallet (Polygon Amoy testnet)
3. **Share your QR** from the Receive page
4. **Payer scans** your QR → their Send page auto-fills your address
5. **Transaction confirmed** on-chain → your INR balance updates
6. **Withdraw** from Inventory → Razorpay popup → UPI payout

> **Test Cards (Razorpay Test Mode):**  
> UPI: `success@razorpay` | Card: `4111 1111 1111 1111`

---

## 🔐 Security Highlights

- ✅ HMAC-SHA256 signature verification on every Razorpay payment
- ✅ Smart contract escrow — no partial execution possible
- ✅ Rate locked at transaction initiation — no slippage attacks
- ✅ One wallet per account — enforced at DB level
- ✅ BetterAuth session management with HTTP-only cookies

---

## 🗺️ Roadmap

| Status | Feature |
|--------|---------|
| ✅ Done | QR scan-to-pay, escrow contract, INR wallet |
| ✅ Done | Razorpay checkout + HMAC verification |
| ✅ Done | Settlement watcher on Polygon Amoy |
| 🔄 In Progress | Razorpay Payouts API (automated UPI transfer) |
| 📋 Planned | Live Polygon Mainnet deployment |
| 📋 Planned | Multi-currency support (ETH, USDC) |
| 📋 Planned | Mobile app (React Native) |

---

## 👥 Team

Built with ❤️ for the hackathon.

| Role | Contribution |
|------|-------------|
| Full Stack | Next.js frontend, API routes, UI/UX |
| Blockchain | Solidity escrow contract, settlement watcher |
| Payments | Razorpay integration, HMAC verification |

---

<div align="center">

**⚡ SwyftPay** — *Where crypto meets real money, instantly.*

[![Live on Polygon Amoy](https://img.shields.io/badge/Live-Polygon_Amoy_Testnet-8247E5?style=flat-square&logo=polygon)](https://amoy.polygonscan.com)

</div>

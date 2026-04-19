# SwyftPay — Handoff Document
> Last updated: 2026-04-19 02:00 IST  
> Read this fully before touching any code.

---

## 🗂️ Project Structure

```
SwyftPay/
├── web/              → Next.js 15 app (App Router, Tailwind v4, TypeScript)
├── contracts/        → Hardhat project (Solidity 0.8.20, Hardhat 2, Polygon Amoy)
├── backend/          → Empty — future Express/Node backend (order mgmt, oracle)
├── API.MD            → Supabase API keys and schema reference
└── whereamnow.md     → YOU ARE HERE
```

---

## ✅ What Has Been Built

### Auth (Better Auth)
- Email/password + Google OAuth sign-in via `better-auth`
- Session stored in Supabase PostgreSQL
- `AuthGuard` component protects all `/dashboard`, `/wallet`, `/send`, `/receive`, `/scan`, `/vault`, `/social`, `/settings`, `/inventory` routes
- Logged-in users redirected away from `/auth` automatically
- Navbar is session-aware (hides Sign In / Get Started when logged in)
- Custom user fields: `walletAddress`, `preferredCurrency`, `inrBalance` (default **₹0**)

### Database (Supabase PostgreSQL)
Connection string in `web/.env` as `DATABASE_URL`.

Tables that exist:
| Table | Purpose |
|---|---|
| `user` | Better Auth users + custom fields (`walletAddress`, `inrBalance`) |
| `session` | Better Auth sessions |
| `account` | OAuth accounts (Google) |
| `transaction` | On-chain payment history (see schema below) |

**`transaction` table columns:**
```sql
id, userId, type (SENT/RECEIVED), amount, currency (AMOY/INR),
status (CONFIRMED/PENDING), txHash, orderId, fromAddress, toAddress,
counterpartyName, inrEquivalent, gasCost, createdAt, updatedAt
```

### Smart Contracts (Polygon Amoy Testnet)
Both deployed and verified working:

| Contract | Address | Role |
|---|---|---|
| `SwyftPayEscrow` | `0xE9564505E87AbAe223a889d12780d1c23c371548` | Locks/releases/refunds AMOY |
| `SwyftPayRouter` | `0x96Eb586A63b4a9289acA16031583bd1f625a14f4` | Entry point, fee collection, order IDs |

- Router **owns** the Escrow (can call `release()` / `refund()`)
- Deployer/owner wallet: `0x8cF19F899dd6d5f8a07F4CbD9B3412A6D10d7423`
- Contract ABI + addresses in `web/src/lib/contracts.ts`
- Deployment info saved in `contracts/deployments/amoy.json`

**Payment flow (contract level):**
```
User → Router.createOrder(receiver, 0) + AMOY value
  → Router takes 0.5% fee
  → Router calls Escrow.deposit(escrowOrderId, receiver, netAmount)
  → Escrow locks AMOY

Backend (TODO) → Router.settleOrder(routerOrderId)
  → Escrow.release() → AMOY sent to receiver

OR Backend → Router.cancelOrder(routerOrderId)
  → Escrow.refund() → AMOY returned to sender
```

### Frontend Pages

| Page | Status | Notes |
|---|---|---|
| `/` | ✅ Done | Landing page |
| `/auth` | ✅ Done | Sign in / Sign up + MetaMask wallet step |
| `/dashboard` | ✅ Done | Real data: INR balance, AMOY balance, recent txns, QR code |
| `/send` | ✅ Done | **Real on-chain** MetaMask tx via Router contract |
| `/receive` | ✅ Done | QR code + copy address |
| `/wallet` | ✅ Done | Balances + AMOY→INR live chart (mock data for now) |
| `/inventory` | ✅ Done | INR internal wallet page (shows ₹0, no deposit yet) |
| `/scan` | ✅ Done | QR scanner UI |
| `/vault` | ⚠️ Empty | No backend yet |
| `/social` | ⚠️ Empty | No backend yet |
| `/settings` | ✅ Done | Profile settings |

### API Routes (web/src/app/api/)
| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/[...all]` | * | Better Auth handler |
| `/api/user/profile` | GET | Fetch logged-in user's profile from DB |
| `/api/wallet/status` | GET | Fetch AMOY balance from Polygon RPC |
| `/api/wallet/link` | GET, POST | Link MetaMask address to user account |
| `/api/transactions` | GET, POST | Fetch/save user transactions |

### Send Flow (end-to-end working ✅)
1. User enters receiver address + AMOY amount on `/send`
2. MetaMask pops up → user signs
3. `Router.createOrder()` called with 25 gwei gas floor, auto-estimated gasLimit + 20% buffer
4. After 1 block confirmation, tx saved to `transaction` table in Supabase
5. Dashboard `/dashboard` "Recent Activity" section shows sent txs in real-time

### WalletConnectModal
- Reusable component at `web/src/components/WalletConnectModal.tsx`
- Used on Dashboard, Wallet, Receive pages
- Calls `eth_requestAccounts` → links to `/api/wallet/link` → stored in `user.walletAddress`

---

## 🔧 Environment Variables (`web/.env`)

```env
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DATABASE_URL=postgresql://postgres.kbtuskvfqdpoplbaehll:...@...supabase.com.../postgres
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0xE9564505E87AbAe223a889d12780d1c23c371548
NEXT_PUBLIC_ROUTER_CONTRACT_ADDRESS=0x96Eb586A63b4a9289acA16031583bd1f625a14f4
```

---

## 🚧 What Needs to Be Built Next

### Priority 1 — AMOY → INR Conversion (Core Feature)
This is the backbone business logic.

**Current state:** When someone sends AMOY via the Router contract, the AMOY gets locked in Escrow. Nobody settles it yet — there's no backend calling `Router.settleOrder()`.

**What needs to happen:**
1. **Backend settlement service** (`/backend`):
   - Watch for `OrderCreated` events on the Router contract (ethers.js `contract.on("OrderCreated", ...)`)
   - When event fires, call the CoinGecko/CoinMarketCap API to get current AMOY price in INR
   - Save rate + credit the receiver's `user.inrBalance` in the DB
   - Call `Router.settleOrder(routerOrderId)` to release AMOY to receiver on-chain
   - This backend needs the deployer private key (it's the Router owner)
   - Save a `RECEIVED` transaction record for the receiver in the `transaction` table

2. **INR Balance crediting:**
   - After settlement, do: `UPDATE "user" SET "inrBalance" = "inrBalance" + <inrAmount> WHERE id = <receiverUserId>`
   - The receiver's `/dashboard` will then show the updated INR balance

3. **Receiver lookup:**
   - Query `SELECT id FROM "user" WHERE "walletAddress" = <toAddress>` to find the receiver user
   - If receiver not found in our system, still settle on-chain (they still get AMOY), but skip INR crediting

4. **Rate source (fixed for now):**
   - Contract has `inrRatePerAmoy = 750000` (= ₹7500.00, scaled ×100)
   - Frontend uses `FIXED_RATE_INR = 7500`
   - For MVP: keep fixed rate; later replace with CoinGecko API call

### Priority 2 — Inventory Page (INR Wallet)
Located at `/inventory`. Currently shows ₹0 and no actions.

**Needs:**
- "Add Money" button → simulate depositing INR (for hackathon: just increment `inrBalance` directly)
- "Withdraw" button → later, trigger AMOY payout
- Show transaction history filtered by `currency = 'INR'`
- The inventory is the "internal INR wallet" — AMOY converted via the settlement service lands here

### Priority 3 — Live AMOY Price (replace mock chart)
At `/wallet`, there's a `recharts` area chart with mock data.

**Needs:**
- Replace with CoinGecko free API: `https://api.coingecko.com/api/v3/coins/matic-network/market_chart?vs_currency=inr&days=1`
  - Note: AMOY is Polygon testnet — use MATIC price as proxy since AMOY ≈ MATIC
- Poll every 30s or use a server-sent event
- Update the `inrRatePerAmoy` in the Router contract when rate changes significantly

### Priority 4 — Receive Flow (auto-detect incoming)
Currently the `/receive` page just shows a QR code. 

**Needs:**
- Backend (or Next.js API route) that polls the Polygon Amoy RPC for incoming transactions to the user's wallet
- OR: listen for `OrderCreated` events where `receiver = userWalletAddress`
- Show these as `RECEIVED` transactions in the dashboard

### Priority 5 — Backend Settle API
Create `/backend` as a Node.js Express app or Next.js API routes:

```
POST /api/settle   → body: { routerOrderId }
  - Verify it's a valid pending order
  - Credit INR to receiver in DB
  - Call Router.settleOrder() on-chain with deployer wallet
  - Save RECEIVED tx record

POST /api/cancel   → body: { routerOrderId }
  - Call Router.cancelOrder()
  - Save CANCELLED tx record
```

The deployer private key goes in `backend/.env` (NOT in the frontend .env).

---

## 🏗️ Architecture Diagram

```
User (MetaMask)
    │
    ▼
Next.js Frontend  ──►  Better Auth  ──►  Supabase PostgreSQL
    │                                      (user, transaction tables)
    │
    ▼
SwyftPayRouter.sol (Polygon Amoy)
    │ createOrder()
    ▼
SwyftPayEscrow.sol
    │ deposit() → locks AMOY
    │
    ▼  [ Backend settlement service — TO BUILD ]
    │ settleOrder() ← Backend calls this after crediting INR
    ▼
AMOY released to receiver on-chain
+
INR credited to receiver.inrBalance in DB
```

---

## 🔑 Key Files to Know

```
web/src/
├── app/
│   ├── send/page.tsx           ← Real on-chain send flow
│   ├── wallet/page.tsx         ← Balances + chart
│   ├── inventory/page.tsx      ← INR internal wallet
│   ├── dashboard/page.tsx      ← Main hub
│   └── api/
│       ├── transactions/route.ts   ← GET + POST tx history
│       ├── wallet/link/route.ts    ← Link MetaMask wallet
│       └── user/profile/route.ts  ← User profile
├── lib/
│   ├── auth.ts                 ← Better Auth config (inrBalance default = 0)
│   ├── auth-client.ts          ← Client-side auth hooks
│   └── contracts.ts            ← Contract addresses + Router ABI
└── components/
    ├── AuthGuard.tsx            ← Route protection
    ├── WalletConnectModal.tsx   ← MetaMask connect popup
    └── layout/
        └── Navbar.tsx           ← Session-aware sidebar

contracts/
├── contracts/
│   ├── SwyftPayEscrow.sol      ← Escrow logic
│   └── SwyftPayRouter.sol      ← Entry point, fees, order IDs
├── scripts/
│   ├── deploy.js               ← Deploy Escrow
│   └── deployRouter.js         ← Deploy Router (reads Escrow address from deployments/)
├── deployments/
│   └── amoy.json               ← Both contract addresses + tx hashes
└── hardhat.config.js
```

---

## 🚨 Known Issues / TODOs

1. **No settlement backend** — `Router.settleOrder()` is never called. All sends currently leave AMOY permanently locked in Escrow. This is the #1 thing to fix.
2. **Mock chart data** — Wallet page AMOY→INR chart uses 7 hardcoded data points. Replace with real CoinGecko API.
3. **Vault & Social pages** — Empty state only, no backend logic.
4. **Emergency refund** — Anyone can call `Escrow.emergencyRefund()` after 15 minutes. No UI for this yet.
5. **Transaction fee withdrawal** — Accumulated protocol fees (0.5%) in Router need an admin UI to withdraw.
6. **Polygonscan verification** — Run `npx hardhat verify --network amoy 0x96Eb586A63b4a9289acA16031583bd1f625a14f4 "0xE9564505E87AbAe223a889d12780d1c23c371548"` from `contracts/` to verify the Router contract source code.

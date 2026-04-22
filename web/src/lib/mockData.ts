import { Transaction, User, Vault, SplitRequest, Order } from "./types";

export const MOCK_USER: User = {
  id: "usr_001",
  name: "Aryan Mehta",
  email: "aryan@swyftpay.xyz",
  walletAddress: "0x742d35Cc6634C0532925a3b8D4C9E7b5a32B1234",
  inrBalance: 45820.75,
  amoyBalance: 12.4821,
  preferredCurrency: "INR",
};

export const MOCK_RECEIVER: User = {
  id: "usr_002",
  name: "Priya Sharma",
  email: "priya@swyftpay.xyz",
  walletAddress: "0xA8b9C2d3E4f5G6h7I8j9K0L1M2N3O4P5Q6R7S8T9",
  inrBalance: 12500.00,
  amoyBalance: 5.2341,
  preferredCurrency: "INR",
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_001",
    orderId: "ord_001",
    type: "SENT",
    fromCurrency: "AMOY",
    toCurrency: "INR",
    amount: 2.5,
    counterpartyName: "Priya Sharma",
    status: "SETTLED",
    txHash: "0xabc123def456789abc123def456789abc123def456789",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "txn_002",
    orderId: "ord_002",
    type: "RECEIVED",
    fromCurrency: "INR",
    toCurrency: "AMOY",
    amount: 5000,
    counterpartyName: "Rahul Verma",
    status: "SETTLED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "txn_003",
    orderId: "ord_003",
    type: "SENT",
    fromCurrency: "INR",
    toCurrency: "INR",
    amount: 1200,
    counterpartyName: "Sneha Patel",
    status: "SETTLED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "txn_004",
    orderId: "ord_004",
    type: "REFUNDED",
    fromCurrency: "AMOY",
    toCurrency: "INR",
    amount: 1.0,
    counterpartyName: "Vikram Singh",
    status: "REFUNDED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "txn_005",
    orderId: "ord_005",
    type: "RECEIVED",
    fromCurrency: "AMOY",
    toCurrency: "AMOY",
    amount: 3.14,
    counterpartyName: "Divya Nair",
    status: "SETTLED",
    txHash: "0xdef789abc123def456789abc123def456789abc123def",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export const MOCK_ORDER: Order = {
  orderId: "ord_demo_001",
  senderUserId: "usr_001",
  receiverUserId: "usr_002",
  senderName: "Aryan Mehta",
  receiverName: "Priya Sharma",
  fromCurrency: "AMOY",
  toCurrency: "INR",
  amountFrom: 2.5,
  amountTo: 18750,
  lockedRate: 7500,
  status: "SETTLED",
  txHash: "0xabc123def456789abc123def456789abc123def456789",
  escrowAddress: "0xEscrow1234567890abcdef1234567890abcdef12345",
  createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  expiresAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
};

export const MOCK_VAULT: Vault = {
  id: "vlt_001",
  name: "Family Savings",
  description: "Shared family expense management",
  balance: 150000,
  currency: "INR",
  spendingLimit: 10000,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  members: [
    { id: "m1", name: "Aryan Mehta", role: "ADMIN", walletAddress: "0x742d...", joinedAt: new Date().toISOString() },
    { id: "m2", name: "Meera Mehta", role: "MEMBER", walletAddress: "0xA8b9...", joinedAt: new Date().toISOString() },
    { id: "m3", name: "Raj Mehta", role: "VIEW_ONLY", walletAddress: "0xB7c8...", joinedAt: new Date().toISOString() },
  ],
};

export const MOCK_SPLITS: SplitRequest[] = [
  {
    id: "spl_001",
    groupName: "Goa Trip 2026",
    description: "Hotel booking split",
    totalAmount: 24000,
    yourShare: 6000,
    paid: false,
    members: ["Aryan", "Priya", "Rahul", "Sneha"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "spl_002",
    groupName: "Office Lunch",
    description: "Friday team lunch",
    totalAmount: 3200,
    yourShare: 800,
    paid: true,
    members: ["Aryan", "Vikram", "Divya", "Sneha"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

export const EXCHANGE_RATE = 7500; // 1 AMOY = ₹7,500 (mock)

export type Currency = "AMOY" | "INR";
export type OrderStatus =
  | "INIT"
  | "RATE_LOCKED"
  | "PENDING_EXECUTION"
  | "ESCROW_DEPOSITED"
  | "VERIFICATION_PENDING"
  | "SETTLED"
  | "REFUNDED"
  | "FAILED";

export interface User {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  inrBalance: number;
  amoyBalance: number;
  avatar?: string;
  preferredCurrency: Currency;
}

export interface Order {
  orderId: string;
  senderUserId: string;
  receiverUserId: string;
  senderName: string;
  receiverName: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  amountFrom: number;
  amountTo: number;
  lockedRate: number;
  status: OrderStatus;
  txHash?: string;
  escrowAddress?: string;
  createdAt: string;
  expiresAt: string;
  failureReason?: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  type: "SENT" | "RECEIVED" | "REFUNDED";
  fromCurrency: Currency;
  toCurrency: Currency;
  amount: number;
  counterpartyName: string;
  counterpartyAddress?: string;
  status: OrderStatus;
  txHash?: string;
  createdAt: string;
}

export interface VaultMember {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER" | "VIEW_ONLY";
  walletAddress: string;
  joinedAt: string;
}

export interface Vault {
  id: string;
  name: string;
  description: string;
  balance: number;
  currency: Currency;
  members: VaultMember[];
  spendingLimit: number;
  createdAt: string;
}

export interface SplitRequest {
  id: string;
  groupName: string;
  description: string;
  totalAmount: number;
  yourShare: number;
  paid: boolean;
  members: string[];
  createdAt: string;
}

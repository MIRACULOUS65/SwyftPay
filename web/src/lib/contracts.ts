// SwyftPay deployed contract addresses on Polygon Amoy (chainId: 80002)
export const CONTRACTS = {
  ESCROW: "0xE9564505E87AbAe223a889d12780d1c23c371548",
  ROUTER: "0x96Eb586A63b4a9289acA16031583bd1f625a14f4",
} as const;

export const AMOY_CHAIN_ID = 80002;

// Minimal ABI — only what the frontend needs
export const ROUTER_ABI = [
  // createOrder: payable, takes receiver + currencyType(0=AMOY_TO_INR)
  {
    inputs: [
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "uint8",   name: "currencyType", type: "uint8" },
    ],
    name: "createOrder",
    outputs: [{ internalType: "bytes32", name: "routerOrderId", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  // quoteOrder: view — get fee + net + INR equivalent
  {
    inputs: [{ internalType: "uint256", name: "grossAmount", type: "uint256" }],
    name: "quoteOrder",
    outputs: [
      { internalType: "uint256", name: "fee",           type: "uint256" },
      { internalType: "uint256", name: "netAmount",     type: "uint256" },
      { internalType: "uint256", name: "inrEquivalent", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getOrder: view — check status of an existing order
  {
    inputs: [{ internalType: "bytes32", name: "routerOrderId", type: "bytes32" }],
    name: "getOrder",
    outputs: [
      { internalType: "string",  name: "escrowOrderId", type: "string"  },
      { internalType: "address", name: "sender",        type: "address" },
      { internalType: "address", name: "receiver",      type: "address" },
      { internalType: "uint256", name: "grossAmount",   type: "uint256" },
      { internalType: "uint256", name: "fee",           type: "uint256" },
      { internalType: "uint8",   name: "currencyType",  type: "uint8"   },
      { internalType: "uint256", name: "inrRate",       type: "uint256" },
      { internalType: "bool",    name: "settled",       type: "bool"    },
      { internalType: "bool",    name: "cancelled",     type: "bool"    },
      { internalType: "uint256", name: "createdAt",     type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // OrderCreated event
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "bytes32", name: "routerOrderId", type: "bytes32" },
      { indexed: false, internalType: "string",  name: "escrowOrderId", type: "string"  },
      { indexed: true,  internalType: "address", name: "sender",        type: "address" },
      { indexed: true,  internalType: "address", name: "receiver",      type: "address" },
      { indexed: false, internalType: "uint256", name: "grossAmount",   type: "uint256" },
      { indexed: false, internalType: "uint256", name: "netAmount",     type: "uint256" },
      { indexed: false, internalType: "uint256", name: "fee",           type: "uint256" },
      { indexed: false, internalType: "uint8",   name: "currencyType",  type: "uint8"   },
      { indexed: false, internalType: "uint256", name: "inrRate",       type: "uint256" },
      { indexed: false, internalType: "uint256", name: "createdAt",     type: "uint256" },
    ],
    name: "OrderCreated",
    type: "event",
  },
] as const;

// Polygon Amoy network config for MetaMask wallet_addEthereumChain
export const AMOY_NETWORK = {
  chainId: `0x${AMOY_CHAIN_ID.toString(16)}`, // "0x13882"
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "AMOY", symbol: "AMOY", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com"],
};

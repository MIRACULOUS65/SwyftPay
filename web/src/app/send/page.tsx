"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";
import { formatINR, truncateAddress } from "@/lib/utils";
import { CONTRACTS, ROUTER_ABI, AMOY_NETWORK, AMOY_CHAIN_ID } from "@/lib/contracts";
import { ethers } from "ethers";
import {
  ArrowRight, Shield, Lock, CheckCircle2, Loader2,
  AlertTriangle, ExternalLink, Copy
} from "lucide-react";

// ─── Admin wallet: all AMOY pools here (central treasury) ─────────────────
// Deployer: 0x8cF19F... | Admin pool: 0x1ABF...
const ADMIN_WALLET = "0x1ABF6e9c7fCa066BdF47467817A11868bEF9EC2a";

const FIXED_RATE_INR = 7500; // ₹7500 per 1 AMOY

type Step = "form" | "review" | "signing" | "confirming" | "done" | "error";

export default function SendPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [amoyBalance, setAmoyBalance] = useState("0.0000");

  // Form state
  const searchParams = useSearchParams();
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverName, setReceiverName]       = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("form");

  // ─── Auto-fill from QR scan: /send?to=0x...&name=Alice ──────────────────
  useEffect(() => {
    const toAddr = searchParams.get("to");
    const toName = searchParams.get("name");
    if (toAddr && ethers.isAddress(toAddr)) {
      setReceiverAddress(toAddr);
      if (toName) setReceiverName(decodeURIComponent(toName));
    }
  }, [searchParams]);

  // Tx state
  const [txHash, setTxHash] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fee, setFee] = useState("0");
  const [netAmount, setNetAmount] = useState("0");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(d => {
      if (d.user) {
        setProfile(d.user);
        if (d.user.walletAddress) fetchAmoyBalance(d.user.walletAddress);
      }
    });
  }, []);

  const fetchAmoyBalance = async (address: string) => {
    try {
      const res = await fetch("https://rpc-amoy.polygon.technology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 1 }),
      });
      const data = await res.json();
      if (data.result) setAmoyBalance((Number(BigInt(data.result)) / 1e18).toFixed(4));
    } catch {}
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const numAmount = parseFloat(amount) || 0;
  const estimatedFee = numAmount * 0.005; // 0.5%
  const estimatedNet = numAmount - estimatedFee;
  const amoyBal = parseFloat(amoyBalance);
  const walletAddr = profile?.walletAddress;
  const isValidAddress = ethers.isAddress(receiverAddress);
  const isValidAmount = numAmount >= 0.001 && numAmount <= amoyBal;
  const canReview = isValidAddress && isValidAmount && receiverAddress.toLowerCase() !== walletAddr?.toLowerCase();

  // ─── Switch MetaMask to Amoy ──────────────────────────────────────────────

  const ensureAmoyNetwork = async (provider: any): Promise<boolean> => {
    const network = await provider.getNetwork();
    if (Number(network.chainId) === AMOY_CHAIN_ID) return true;

    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: AMOY_NETWORK.chainId },
      ]);
      return true;
    } catch (switchErr: any) {
      if (switchErr.code === 4902) {
        // Chain not added yet — add it
        await provider.send("wallet_addEthereumChain", [AMOY_NETWORK]);
        return true;
      }
      return false;
    }
  };

  // ─── Core: sign & send tx ─────────────────────────────────────────────────

  const sendPayment = async () => {
    setStep("signing");
    setErrorMsg("");

    try {
      if (!(window as any).ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      // Connect + sign with MetaMask
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await browserProvider.getSigner();

      // Ensure we're on Polygon Amoy
      const onAmoy = await ensureAmoyNetwork(browserProvider);
      if (!onAmoy) throw new Error("Please switch MetaMask to Polygon Amoy Testnet.");

      // Parse amount to wei
      const amountWei = ethers.parseEther(amount);

      // Get the Router contract
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);

      // ─── Gas: hardcoded to Amoy minimum (25 gwei) ─────────────────────────
      // getFeeData() can return 300-500 gwei (network congestion suggestion).
      // Amoy's enforced floor is 25 gwei — hardcode it to keep fees minimal.
      const GAS_PRICE = ethers.parseUnits("25", "gwei");

      // Estimate gas — receiver is ADMIN_WALLET (all AMOY pools centrally)
      const gasEstimate = await router.createOrder.estimateGas(
        ADMIN_WALLET,
        0, // CurrencyType.AMOY_TO_INR
        { value: amountWei }
      );
      // Add 20% buffer so it doesn't fail
      const gasLimit = (gasEstimate * 120n) / 100n;

      setStep("confirming");

      // Send the transaction — receiver = ADMIN_WALLET so all AMOY goes to treasury.
      // The actual intended receiver (receiverAddress typed by user) is tracked in
      // our DB toAddress field; the settle service uses it to credit INR.
      const tx = await router.createOrder(
        ADMIN_WALLET,
        0, // AMOY_TO_INR
        {
          value:            amountWei,
          maxFeePerGas:     GAS_PRICE, // 25 gwei hard cap
          maxPriorityFeePerGas: GAS_PRICE,
          gasLimit:         gasLimit,
        }
      );

      setTxHash(tx.hash);

      // Wait for 1 block confirmation
      const receipt = await tx.wait(1);

      // Parse the OrderCreated event to get the routerOrderId
      const iface = new ethers.Interface(ROUTER_ABI as any);
      let parsedOrderId = "";
      let parsedFee = "0";
      let parsedNet = "0";
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "OrderCreated") {
            parsedOrderId = parsed.args.routerOrderId;
            parsedFee     = ethers.formatEther(parsed.args.fee);
            parsedNet     = ethers.formatEther(parsed.args.netAmount);
            setOrderId(parsedOrderId);
            setFee(parsedFee);
            setNetAmount(parsedNet);
            break;
          }
        } catch {}
      }

      // ─── Save to DB so dashboard can show it ─────────────────────────────
      const gasCostAmoy = receipt.gasUsed
        ? ethers.formatEther(receipt.gasUsed * GAS_PRICE)
        : "unknown";

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:             "SENT",
          amount:           parseFloat(amount),
          currency:         "AMOY",
          txHash:           tx.hash,
          orderId:          parsedOrderId,
          fromAddress:      walletAddr,
          toAddress:        receiverAddress,
          counterpartyName: truncateAddress(receiverAddress, 6),
          inrEquivalent:    parseFloat(amount) * FIXED_RATE_INR,
          gasCost:          gasCostAmoy,
          status:           "CONFIRMED",
        }),
      });

      // ─── Trigger settlement: releases AMOY on-chain + credits INR ────────
      // This runs in background — UI shows "done" immediately.
      // The settle API: verifies order → credits INR to receiver → calls
      // Router.settleOrder() → saves RECEIVED tx for receiver.
      fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routerOrderId: parsedOrderId,
          toAddress:     receiverAddress,
          amountAMOY:    parseFloat(amount),
          txHash:        tx.hash,
        }),
      }).then(r => r.json()).then(d => {
        if (d.success) {
          console.log(`[settle] ✅ Settled. INR credited: ₹${d.inrCredited} to ${d.receiverName || receiverAddress}`);
        } else {
          console.warn("[settle] ⚠️", d.error || "Settlement returned non-success");
        }
      }).catch(e => console.error("[settle] fetch error:", e));

      setStep("done");
    } catch (err: any) {
      const msg =
        err?.code === 4001   ? "You rejected the transaction in MetaMask." :
        err?.code === "INSUFFICIENT_FUNDS" ? "Insufficient AMOY balance for this transaction." :
        err?.message || "Transaction failed.";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  // ─── UI ──────────────────────────────────────────────────────────────────

  if (!walletAddr) {
    return (
      <div className="flex"><AppSidebar />
        <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-white mb-8">Send Payment</h1>
          <Card className="p-8 text-center">
            <AlertTriangle size={24} className="mx-auto text-white/25 mb-4" />
            <p className="text-sm text-white/50 mb-2">No wallet linked</p>
            <p className="text-xs text-white/25 mb-4">Link your MetaMask wallet first to send payments.</p>
            <a href="/dashboard"><Button>Go to Dashboard</Button></a>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Send Payment</h1>
        <p className="text-sm text-white/35 mb-8">Pay with AMOY. Receiver gets their preferred currency.</p>

        {/* ─── STEP 1: FORM ─── */}
        {step === "form" && (
          <div className="space-y-6">
            <Card className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                  <span className="text-white/40 text-xs">◆</span>
                </div>
                <div>
                  <p className="text-xs text-white/30">Sending from</p>
                  <p className="text-sm text-white/70 font-mono">{truncateAddress(walletAddr, 6)}</p>
                </div>
              </div>
              <span className="text-xs text-white/40">{amoyBalance} AMOY</span>
            </Card>

            <div>
              <label className="text-xs text-white/30 mb-2 block">Receiver Wallet Address</label>
              <input
                type="text"
                value={receiverAddress}
                onChange={e => { setReceiverAddress(e.target.value); setReceiverName(""); }}
                placeholder="0x..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:border-white/20 focus:outline-none transition-colors font-mono"
              />
              {/* QR scan indicator */}
              {receiverName && isValidAddress && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 animate-pulse" />
                  <p className="text-xs text-green-400/70">Scanned from QR — paying <strong>{receiverName}</strong></p>
                </div>
              )}
              {receiverAddress && !isValidAddress && (
                <p className="text-xs text-white/40 mt-1">Not a valid Ethereum address</p>
              )}
              {walletAddr && receiverAddress.toLowerCase() === walletAddr.toLowerCase() && (
                <p className="text-xs text-white/40 mt-1">Cannot send to yourself</p>
              )}
            </div>

            <div>
              <label className="text-xs text-white/30 mb-2 block">Amount (AMOY)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.001"
                  min="0.001"
                  step="0.001"
                  className="w-full px-4 py-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-3xl font-bold text-white placeholder:text-white/15 focus:border-white/20 focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/30">AMOY</span>
              </div>
              {numAmount > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-white/30">≈ {formatINR(numAmount * FIXED_RATE_INR)} at ₹{FIXED_RATE_INR}/AMOY</p>
                  <p className="text-xs text-white/20">
                    Protocol fee: {estimatedFee.toFixed(5)} AMOY · Net to receiver: {estimatedNet.toFixed(5)} AMOY
                  </p>
                </div>
              )}
              {numAmount > amoyBal && amoyBal > 0 && (
                <p className="text-xs text-white/40 mt-1">Insufficient balance (have {amoyBalance} AMOY)</p>
              )}
            </div>

            {/* Rate + gas info */}
            <Card variant="flat" className="p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Exchange Rate</span>
                <span className="text-white/60">1 AMOY = {formatINR(FIXED_RATE_INR)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Protocol Fee</span>
                <span className="text-white/60">0.5%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Gas Price</span>
                <span className="text-white/60">25 gwei (Amoy minimum)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Network</span>
                <span className="text-white/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                  Polygon Amoy
                </span>
              </div>
            </Card>

            <Button className="w-full" size="lg" disabled={!canReview} onClick={() => setStep("review")}>
              Review Payment <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {/* ─── STEP 2: REVIEW ─── */}
        {step === "review" && (
          <div className="space-y-6">
            <Card className="p-8 text-center">
              <p className="text-xs text-white/30 mb-2">You are sending</p>
              <p className="text-4xl font-bold text-white mb-1">{numAmount} <span className="text-xl text-white/40">AMOY</span></p>
              <p className="text-sm text-white/40 mb-6">≈ {formatINR(numAmount * FIXED_RATE_INR)}</p>
              <div className="text-left space-y-3 pt-4 border-t border-white/[0.06]">
                <Row label="To" value={<span className="font-mono text-xs">{truncateAddress(receiverAddress, 8)}</span>} />
                <Row label="Protocol fee (0.5%)" value={`${estimatedFee.toFixed(5)} AMOY`} />
                <Row label="Net to receiver" value={`${estimatedNet.toFixed(5)} AMOY`} />
                <Row label="Gas" value="≥30 gwei (Amoy min)" />
                <Row label="Contract" value={<span className="font-mono text-xs">{truncateAddress(CONTRACTS.ROUTER, 6)}</span>} />
              </div>
            </Card>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep("form")}>Back</Button>
              <Button className="flex-1" size="lg" onClick={sendPayment}>
                <Shield size={14} /> Sign & Send
              </Button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: SIGNING (MetaMask popup open) ─── */}
        {step === "signing" && (
          <Card className="p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center mx-auto mb-5">
              <Loader2 size={28} className="text-white/50 animate-spin" />
            </div>
            <p className="text-base font-semibold text-white mb-2">Waiting for MetaMask</p>
            <p className="text-xs text-white/35">Approve the transaction in your MetaMask popup...</p>
          </Card>
        )}

        {/* ─── STEP 4: CONFIRMING (on-chain) ─── */}
        {step === "confirming" && (
          <Card className="p-10 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-white/15 border-t-white/50 rounded-full animate-spin mx-auto mb-5" />
            <p className="text-base font-semibold text-white mb-2">Confirming on Polygon Amoy</p>
            <p className="text-xs text-white/35 mb-4">Waiting for 1 block confirmation...</p>
            {txHash && (
              <a
                href={`https://amoy.polygonscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60"
              >
                <ExternalLink size={12} /> View on Polygonscan
              </a>
            )}
          </Card>
        )}

        {/* ─── STEP 5: SUCCESS ─── */}
        {step === "done" && (
          <Card className="p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-white/[0.08] flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-white/80" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Payment Sent!</h2>
              <p className="text-sm text-white/40">{numAmount} AMOY escrowed · receiver gets {parseFloat(netAmount).toFixed(5)} AMOY</p>
            </div>
            {txHash && (
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-left">
                <p className="text-[10px] text-white/25 mb-1 uppercase tracking-widest">Tx Hash</p>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-white/50 font-mono truncate">{txHash}</p>
                  <button onClick={() => navigator.clipboard.writeText(txHash)} className="shrink-0 text-white/25 hover:text-white/50">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            )}
            <a
              href={`https://amoy.polygonscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60"
            >
              <ExternalLink size={12} /> View on Polygonscan
            </a>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setStep("form"); setAmount(""); setReceiverAddress(""); }}>
                New Payment
              </Button>
              <a href="/dashboard" className="flex-1"><Button className="w-full">Dashboard</Button></a>
            </div>
          </Card>
        )}

        {/* ─── ERROR ─── */}
        {step === "error" && (
          <Card className="p-10 text-center space-y-5">
            <AlertTriangle size={32} className="mx-auto text-white/40" />
            <div>
              <h2 className="text-base font-semibold text-white mb-1">Transaction Failed</h2>
              <p className="text-sm text-white/40">{errorMsg}</p>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => setStep("review")}>Try Again</Button>
          </Card>
        )}
      </div>
    </div>
  );
}

// Small helper component for review table rows
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/30">{label}</span>
      <span className="text-xs text-white/60">{value}</span>
    </div>
  );
}

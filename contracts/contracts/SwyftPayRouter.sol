// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SwyftPayEscrow.sol";

/**
 * @title SwyftPayRouter
 * @author SWYFTPAY
 * @notice Entry point for all SWYFTPAY payment flows.
 *         Generates unique on-chain order IDs, enforces minimum amounts,
 *         optionally collects a tiny protocol fee, and delegates
 *         locking / release / refund to the Escrow contract.
 *
 * Architecture:
 *   User → Router.createOrder() → Escrow.deposit()
 *   Backend → Router.settleOrder() → Escrow.release()
 *   Backend → Router.cancelOrder() → Escrow.refund()
 */
contract SwyftPayRouter {

    // ─── Structs ─────────────────────────────────────────────────────────────────

    enum CurrencyType { AMOY_TO_INR, INR_TO_AMOY }

    struct RouteOrder {
        string      escrowOrderId;   // The ID passed into Escrow
        address     sender;
        address     receiver;
        uint256     amount;          // gross amount (wei)
        uint256     fee;             // protocol fee (wei)
        CurrencyType currencyType;
        uint256     inrRate;         // locked INR-per-AMOY at order creation (fixed for MVP)
        bool        settled;
        bool        cancelled;
        uint256     createdAt;
    }

    // ─── State ───────────────────────────────────────────────────────────────────

    address public owner;
    SwyftPayEscrow public immutable escrow;

    /// @dev Fee in basis points (1 bp = 0.01%). 50 bp = 0.5%
    uint256 public feeBps = 50;

    /// @dev Fixed INR rate per 1 AMOY (will be replaced by oracle later)
    uint256 public inrRatePerAmoy = 7500 * 1e2; // 7500.00 INR (scaled ×100)

    /// @dev Minimum send amount (prevents dust attacks)
    uint256 public constant MIN_AMOUNT = 0.001 ether;

    /// @dev Global order counter for unique IDs
    uint256 private _orderNonce;

    /// @dev routerOrderId → RouteOrder
    mapping(bytes32 => RouteOrder) private _orders;

    /// @dev Accumulated fees claimable by owner
    uint256 public accumulatedFees;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event OrderCreated(
        bytes32 indexed routerOrderId,
        string          escrowOrderId,
        address indexed sender,
        address indexed receiver,
        uint256         grossAmount,
        uint256         netAmount,
        uint256         fee,
        CurrencyType    currencyType,
        uint256         inrRate,
        uint256         createdAt
    );

    event OrderSettled(
        bytes32 indexed routerOrderId,
        string          escrowOrderId,
        address indexed receiver,
        uint256         amount
    );

    event OrderCancelled(
        bytes32 indexed routerOrderId,
        string          escrowOrderId,
        address indexed sender,
        uint256         amount
    );

    event RateUpdated(uint256 oldRate, uint256 newRate);
    event FeeUpdated(uint256 oldBps, uint256 newBps);
    event FeeWithdrawn(address to, uint256 amount);

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Router: not owner");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    /**
     * @param escrowAddress Address of the already-deployed SwyftPayEscrow contract
     */
    constructor(address escrowAddress) {
        require(escrowAddress != address(0), "Router: invalid escrow address");
        owner  = msg.sender;
        escrow = SwyftPayEscrow(payable(escrowAddress));
    }

    // ─── Core: createOrder ────────────────────────────────────────────────────────

    /**
     * @notice Payer creates a payment order. AMOY is sent with this call.
     *         Net amount (after fee) is locked in the Escrow contract.
     * @param receiver     Wallet address of the payment receiver
     * @param currencyType AMOY_TO_INR (0) or INR_TO_AMOY (1)
     */
    function createOrder(
        address      receiver,
        CurrencyType currencyType
    ) external payable returns (bytes32 routerOrderId) {
        require(msg.value >= MIN_AMOUNT,    "Router: amount below minimum");
        require(receiver != address(0),     "Router: invalid receiver");
        require(receiver != msg.sender,     "Router: cannot pay yourself");

        // ── Compute fee and net amount ──────────────────────────────────────────
        uint256 fee       = (msg.value * feeBps) / 10_000;
        uint256 netAmount = msg.value - fee;

        accumulatedFees += fee;

        // ── Generate unique IDs ─────────────────────────────────────────────────
        _orderNonce++;
        routerOrderId = keccak256(abi.encodePacked(
            msg.sender, receiver, msg.value, block.timestamp, _orderNonce
        ));
        string memory escrowOrderId = _bytes32ToString(routerOrderId);

        // ── Store locally ───────────────────────────────────────────────────────
        _orders[routerOrderId] = RouteOrder({
            escrowOrderId: escrowOrderId,
            sender:        msg.sender,
            receiver:      receiver,
            amount:        msg.value,
            fee:           fee,
            currencyType:  currencyType,
            inrRate:       inrRatePerAmoy,
            settled:       false,
            cancelled:     false,
            createdAt:     block.timestamp
        });

        // ── Lock net amount in escrow ───────────────────────────────────────────
        escrow.deposit{value: netAmount}(escrowOrderId, receiver);

        emit OrderCreated(
            routerOrderId,
            escrowOrderId,
            msg.sender,
            receiver,
            msg.value,
            netAmount,
            fee,
            currencyType,
            inrRatePerAmoy,
            block.timestamp
        );
    }

    // ─── Core: settleOrder ────────────────────────────────────────────────────────

    /**
     * @notice Backend calls this after confirming INR credit off-chain.
     *         Releases escrowed AMOY to the receiver.
     * @param routerOrderId The on-chain router order ID
     */
    function settleOrder(bytes32 routerOrderId) external onlyOwner {
        RouteOrder storage order = _orders[routerOrderId];
        require(order.sender != address(0), "Router: order not found");
        require(!order.settled,             "Router: already settled");
        require(!order.cancelled,           "Router: already cancelled");

        order.settled = true;

        escrow.release(order.escrowOrderId);

        emit OrderSettled(
            routerOrderId,
            order.escrowOrderId,
            order.receiver,
            order.amount - order.fee
        );
    }

    // ─── Core: cancelOrder ────────────────────────────────────────────────────────

    /**
     * @notice Backend cancels and refunds the sender (e.g. INR credit failed).
     * @param routerOrderId The on-chain router order ID
     */
    function cancelOrder(bytes32 routerOrderId) external onlyOwner {
        RouteOrder storage order = _orders[routerOrderId];
        require(order.sender != address(0), "Router: order not found");
        require(!order.settled,             "Router: already settled");
        require(!order.cancelled,           "Router: already cancelled");

        order.cancelled = true;

        // The fee collected was from gross amount, return it too since we're cancelling
        uint256 refundFee = order.fee;
        accumulatedFees -= refundFee;

        // Escrow will refund net amount back to Router (since Router called deposit)
        escrow.refund(order.escrowOrderId);

        // Now Router forwards net + fee back to the original sender
        uint256 totalRefund = (order.amount - order.fee) + refundFee; // = order.amount
        (bool ok, ) = order.sender.call{value: totalRefund}("");
        require(ok, "Router: refund to sender failed");

        emit OrderCancelled(
            routerOrderId,
            order.escrowOrderId,
            order.sender,
            order.amount
        );
    }

    // ─── Views ────────────────────────────────────────────────────────────────────

    /**
     * @notice Get full order details by router order ID
     */
    function getOrder(bytes32 routerOrderId)
        external
        view
        returns (
            string   memory escrowOrderId,
            address         sender,
            address         receiver,
            uint256         grossAmount,
            uint256         fee,
            uint8           currencyType,
            uint256         inrRate,
            bool            settled,
            bool            cancelled,
            uint256         createdAt
        )
    {
        RouteOrder storage o = _orders[routerOrderId];
        require(o.sender != address(0), "Router: order not found");
        return (
            o.escrowOrderId,
            o.sender,
            o.receiver,
            o.amount,
            o.fee,
            uint8(o.currencyType),
            o.inrRate,
            o.settled,
            o.cancelled,
            o.createdAt
        );
    }

    /**
     * @notice Calculate what the receiver gets for a given send amount
     */
    function quoteOrder(uint256 grossAmount)
        external
        view
        returns (uint256 fee, uint256 netAmount, uint256 inrEquivalent)
    {
        fee           = (grossAmount * feeBps) / 10_000;
        netAmount     = grossAmount - fee;
        // inrEquivalent is scaled ×100 (e.g. 750000 = ₹7500.00)
        inrEquivalent = (netAmount * inrRatePerAmoy) / 1 ether;
    }

    // ─── Admin ───────────────────────────────────────────────────────────────────

    /**
     * @notice Update the fixed INR rate (backend calls this periodically until oracle is live)
     * @param newRate New rate scaled ×100 (e.g. 750000 = ₹7500.00 per AMOY)
     */
    function updateInrRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Router: rate must be > 0");
        emit RateUpdated(inrRatePerAmoy, newRate);
        inrRatePerAmoy = newRate;
    }

    /**
     * @notice Update protocol fee in basis points (max 200 bp = 2%)
     */
    function updateFee(uint256 newBps) external onlyOwner {
        require(newBps <= 200, "Router: fee too high");
        emit FeeUpdated(feeBps, newBps);
        feeBps = newBps;
    }

    /**
     * @notice Withdraw accumulated protocol fees to owner
     */
    function withdrawFees(address to) external onlyOwner {
        require(to != address(0), "Router: invalid address");
        uint256 amount = accumulatedFees;
        require(amount > 0, "Router: no fees to withdraw");
        accumulatedFees = 0;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Router: fee withdrawal failed");
        emit FeeWithdrawn(to, amount);
    }

    /**
     * @notice Transfer router ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Router: zero address");
        owner = newOwner;
    }

    // ─── Internal ────────────────────────────────────────────────────────────────

    function _bytes32ToString(bytes32 b) internal pure returns (string memory) {
        bytes memory hex_chars = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            str[i * 2]     = hex_chars[uint8(b[i] >> 4)];
            str[i * 2 + 1] = hex_chars[uint8(b[i] & 0x0f)];
        }
        return string(abi.encodePacked("swyft_", str));
    }

    // ─── Fallback ────────────────────────────────────────────────────────────────

    /// @notice Accept ETH refunds from the Escrow contract only
    receive() external payable {
        require(
            msg.sender == address(escrow),
            "Router: only escrow can send ETH directly"
        );
    }
}

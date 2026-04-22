// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SwyftPayEscrow
 * @author SWYFTPAY
 * @notice Backbone escrow contract for AMOY→INR payment flows.
 *         Locks AMOY from sender, releases to receiver on settlement confirmation,
 *         or refunds sender on failure/timeout.
 *
 * Flow:
 *   1. Payer calls deposit(orderId, receiver) with AMOY value
 *   2. Backend/oracle confirms INR credit and calls release(orderId)
 *   3. If anything fails, backend calls refund(orderId)
 */
contract SwyftPayEscrow {
    // ─── Structs ────────────────────────────────────────────────────────────────

    enum OrderStatus { PENDING, RELEASED, REFUNDED }

    struct Order {
        address sender;
        address receiver;
        uint256 amount;        // in wei (AMOY)
        OrderStatus status;
        uint256 createdAt;
        string  orderId;       // app-layer order ID for traceability
    }

    // ─── State ───────────────────────────────────────────────────────────────────

    address public owner;
    uint256 public constant TIMEOUT = 15 minutes; // auto-refundable after this

    // orderId (bytes32) → Order
    mapping(bytes32 => Order) private orders;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event Deposited(
        bytes32 indexed key,
        string  orderId,
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        uint256 createdAt
    );

    event Released(
        bytes32 indexed key,
        string  orderId,
        address indexed receiver,
        uint256 amount
    );

    event Refunded(
        bytes32 indexed key,
        string  orderId,
        address indexed sender,
        uint256 amount
    );

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "SwyftPay: not owner");
        _;
    }

    modifier orderExists(bytes32 key) {
        require(orders[key].sender != address(0), "SwyftPay: order not found");
        _;
    }

    modifier orderPending(bytes32 key) {
        require(orders[key].status == OrderStatus.PENDING, "SwyftPay: order not pending");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /**
     * @notice Payer deposits AMOY into escrow for a given orderId.
     * @param orderId  The off-chain app-layer order ID (e.g. "ord_abc123")
     * @param receiver The receiver's wallet address on Polygon
     */
    function deposit(
        string calldata orderId,
        address receiver
    ) external payable {
        require(msg.value > 0,          "SwyftPay: amount must be > 0");
        require(receiver != address(0), "SwyftPay: invalid receiver");

        bytes32 key = _key(orderId);
        require(orders[key].sender == address(0), "SwyftPay: order already exists");

        orders[key] = Order({
            sender:    msg.sender,
            receiver:  receiver,
            amount:    msg.value,
            status:    OrderStatus.PENDING,
            createdAt: block.timestamp,
            orderId:   orderId
        });

        emit Deposited(key, orderId, msg.sender, receiver, msg.value, block.timestamp);
    }

    /**
     * @notice Owner (backend) releases escrowed AMOY to the receiver after
     *         confirming INR has been credited off-chain.
     * @param orderId The order to settle
     */
    function release(string calldata orderId)
        external
        onlyOwner
        orderExists(_key(orderId))
        orderPending(_key(orderId))
    {
        bytes32 key = _key(orderId);
        Order storage order = orders[key];

        order.status = OrderStatus.RELEASED;

        (bool ok, ) = order.receiver.call{value: order.amount}("");
        require(ok, "SwyftPay: transfer to receiver failed");

        emit Released(key, orderId, order.receiver, order.amount);
    }

    /**
     * @notice Owner (backend) refunds escrowed AMOY to the sender on failure.
     * @param orderId The order to refund
     */
    function refund(string calldata orderId)
        external
        onlyOwner
        orderExists(_key(orderId))
        orderPending(_key(orderId))
    {
        bytes32 key = _key(orderId);
        Order storage order = orders[key];

        order.status = OrderStatus.REFUNDED;

        (bool ok, ) = order.sender.call{value: order.amount}("");
        require(ok, "SwyftPay: refund to sender failed");

        emit Refunded(key, orderId, order.sender, order.amount);
    }

    /**
     * @notice Anyone can trigger a refund after TIMEOUT if still pending.
     *         Protects payer from backend going offline.
     * @param orderId The order to emergency-refund
     */
    function emergencyRefund(string calldata orderId)
        external
        orderExists(_key(orderId))
        orderPending(_key(orderId))
    {
        bytes32 key = _key(orderId);
        Order storage order = orders[key];

        require(
            block.timestamp >= order.createdAt + TIMEOUT,
            "SwyftPay: timeout not reached yet"
        );
        require(
            msg.sender == order.sender,
            "SwyftPay: only sender can emergency-refund"
        );

        order.status = OrderStatus.REFUNDED;

        (bool ok, ) = order.sender.call{value: order.amount}("");
        require(ok, "SwyftPay: emergency refund failed");

        emit Refunded(key, orderId, order.sender, order.amount);
    }

    /**
     * @notice Read full order details.
     * @param orderId The order ID to query
     */
    function getOrder(string calldata orderId)
        external
        view
        returns (
            address sender,
            address receiver,
            uint256 amount,
            uint8   status,
            uint256 createdAt
        )
    {
        bytes32 key = _key(orderId);
        require(orders[key].sender != address(0), "SwyftPay: order not found");

        Order storage o = orders[key];
        return (o.sender, o.receiver, o.amount, uint8(o.status), o.createdAt);
    }

    /**
     * @notice Transfer contract ownership (for key rotation).
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "SwyftPay: zero address");
        owner = newOwner;
    }

    // ─── Internal ────────────────────────────────────────────────────────────────

    function _key(string calldata orderId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(orderId));
    }

    // ─── Fallback ────────────────────────────────────────────────────────────────

    receive() external payable {
        revert("SwyftPay: use deposit()");
    }
}

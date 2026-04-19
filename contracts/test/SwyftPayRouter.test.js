const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwyftPayRouter", function () {
  let escrow, router;
  let owner, sender, receiver, thirdParty;
  const AMOUNT   = ethers.parseEther("1.0");   // 1 AMOY
  const MIN      = ethers.parseEther("0.001"); // minimum
  const FEE_BPS  = 50n; // 0.5%

  beforeEach(async function () {
    [owner, sender, receiver, thirdParty] = await ethers.getSigners();

    // Deploy Escrow first
    const Escrow = await ethers.getContractFactory("SwyftPayEscrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    // Deploy Router pointing at Escrow
    const Router = await ethers.getContractFactory("SwyftPayRouter");
    router = await Router.deploy(await escrow.getAddress());
    await router.waitForDeployment();

    // Router must be the escrow's owner so it can call release/refund
    await escrow.connect(owner).transferOwnership(await router.getAddress());
  });

  describe("Deployment", function () {
    it("sets correct owner and escrow", async function () {
      expect(await router.owner()).to.equal(owner.address);
      expect(await router.escrow()).to.equal(await escrow.getAddress());
    });

    it("starts with 50bps fee", async function () {
      expect(await router.feeBps()).to.equal(50n);
    });
  });

  describe("quoteOrder()", function () {
    it("calculates fee and net amount correctly", async function () {
      const [fee, net] = await router.quoteOrder(ethers.parseEther("1.0"));
      const expectedFee = (AMOUNT * FEE_BPS) / 10_000n;
      expect(fee).to.equal(expectedFee);
      expect(net).to.equal(AMOUNT - expectedFee);
    });
  });

  describe("createOrder()", function () {
    it("emits OrderCreated and deposits to escrow", async function () {
      await expect(
        router.connect(sender).createOrder(receiver.address, 0, { value: AMOUNT })
      ).to.emit(router, "OrderCreated");
    });

    it("reverts if amount below minimum", async function () {
      await expect(
        router.connect(sender).createOrder(receiver.address, 0, { value: ethers.parseEther("0.0001") })
      ).to.be.revertedWith("Router: amount below minimum");
    });

    it("reverts if receiver is zero address", async function () {
      await expect(
        router.connect(sender).createOrder(ethers.ZeroAddress, 0, { value: AMOUNT })
      ).to.be.revertedWith("Router: invalid receiver");
    });

    it("reverts if sender == receiver", async function () {
      await expect(
        router.connect(sender).createOrder(sender.address, 0, { value: AMOUNT })
      ).to.be.revertedWith("Router: cannot pay yourself");
    });

    it("splits fee correctly", async function () {
      const tx = await router.connect(sender).createOrder(receiver.address, 0, { value: AMOUNT });
      const receipt = await tx.wait();
      const accFees = await router.accumulatedFees();
      const expectedFee = (AMOUNT * FEE_BPS) / 10_000n;
      expect(accFees).to.equal(expectedFee);
    });
  });

  describe("settleOrder()", function () {
    let routerOrderId;

    beforeEach(async function () {
      const tx = await router.connect(sender).createOrder(receiver.address, 0, { value: AMOUNT });
      const receipt = await tx.wait();
      // Parse routerOrderId from the OrderCreated event
      const event = receipt.logs
        .map(log => { try { return router.interface.parseLog(log); } catch { return null; } })
        .find(e => e?.name === "OrderCreated");
      routerOrderId = event.args.routerOrderId;
    });

    it("releases AMOY to receiver and emits OrderSettled", async function () {
      const before = await ethers.provider.getBalance(receiver.address);
      await expect(
        router.connect(owner).settleOrder(routerOrderId)
      ).to.emit(router, "OrderSettled");
      const after = await ethers.provider.getBalance(receiver.address);
      expect(after).to.be.gt(before);
    });

    it("reverts if non-owner calls settle", async function () {
      await expect(
        router.connect(thirdParty).settleOrder(routerOrderId)
      ).to.be.revertedWith("Router: not owner");
    });

    it("reverts double settle", async function () {
      await router.connect(owner).settleOrder(routerOrderId);
      await expect(
        router.connect(owner).settleOrder(routerOrderId)
      ).to.be.revertedWith("Router: already settled");
    });
  });

  describe("cancelOrder()", function () {
    let routerOrderId;

    beforeEach(async function () {
      const tx = await router.connect(sender).createOrder(receiver.address, 0, { value: AMOUNT });
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => { try { return router.interface.parseLog(log); } catch { return null; } })
        .find(e => e?.name === "OrderCreated");
      routerOrderId = event.args.routerOrderId;
    });

    it("refunds sender and emits OrderCancelled", async function () {
      const before = await ethers.provider.getBalance(sender.address);
      await expect(
        router.connect(owner).cancelOrder(routerOrderId)
      ).to.emit(router, "OrderCancelled");
      const after = await ethers.provider.getBalance(sender.address);
      expect(after).to.be.gt(before);
    });

    it("reverts cancel after settle", async function () {
      await router.connect(owner).settleOrder(routerOrderId);
      await expect(
        router.connect(owner).cancelOrder(routerOrderId)
      ).to.be.revertedWith("Router: already settled");
    });
  });

  describe("Admin functions", function () {
    it("owner can update INR rate", async function () {
      await expect(
        router.connect(owner).updateInrRate(800000)
      ).to.emit(router, "RateUpdated");
      expect(await router.inrRatePerAmoy()).to.equal(800000n);
    });

    it("owner can update fee (within cap)", async function () {
      await router.connect(owner).updateFee(100);
      expect(await router.feeBps()).to.equal(100n);
    });

    it("reverts fee update above 200bps", async function () {
      await expect(
        router.connect(owner).updateFee(201)
      ).to.be.revertedWith("Router: fee too high");
    });

    it("non-owner cannot update rate", async function () {
      await expect(
        router.connect(thirdParty).updateInrRate(800000)
      ).to.be.revertedWith("Router: not owner");
    });
  });

  describe("Direct ETH rejection", function () {
    it("reverts direct ETH transfer from non-escrow address", async function () {
      await expect(
        sender.sendTransaction({ to: await router.getAddress(), value: AMOUNT })
      ).to.be.revertedWith("Router: only escrow can send ETH directly");
    });
  });
});

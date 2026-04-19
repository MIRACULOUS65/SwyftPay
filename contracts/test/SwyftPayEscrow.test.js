const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwyftPayEscrow", function () {
  let escrow;
  let owner, sender, receiver, thirdParty;
  const ORDER_ID = "ord_test_001";
  const AMOUNT   = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, sender, receiver, thirdParty] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("SwyftPayEscrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();
  });

  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });
  });

  describe("deposit()", function () {
    it("accepts AMOY and emits Deposited event", async function () {
      await expect(
        escrow.connect(sender).deposit(ORDER_ID, receiver.address, { value: AMOUNT })
      ).to.emit(escrow, "Deposited");
    });

    it("reverts if amount is 0", async function () {
      await expect(
        escrow.connect(sender).deposit(ORDER_ID, receiver.address, { value: 0 })
      ).to.be.revertedWith("SwyftPay: amount must be > 0");
    });

    it("reverts duplicate order ID", async function () {
      await escrow.connect(sender).deposit(ORDER_ID, receiver.address, { value: AMOUNT });
      await expect(
        escrow.connect(sender).deposit(ORDER_ID, receiver.address, { value: AMOUNT })
      ).to.be.revertedWith("SwyftPay: order already exists");
    });

    it("reverts for zero address receiver", async function () {
      await expect(
        escrow.connect(sender).deposit(ORDER_ID, ethers.ZeroAddress, { value: AMOUNT })
      ).to.be.revertedWith("SwyftPay: invalid receiver");
    });
  });

  describe("release()", function () {
    beforeEach(async function () {
      await escrow.connect(sender).deposit(ORDER_ID, receiver.address, { value: AMOUNT });
    });

    it("transfers AMOY to receiver and emits Released", async function () {
      const before = await ethers.provider.getBalance(receiver.address);
      await expect(
        escrow.connect(owner).release(ORDER_ID)
      ).to.emit(escrow, "Released");
      const after = await ethers.provider.getBalance(receiver.address);
      expect(after - before).to.equal(AMOUNT);
    });

    it("reverts if called by non-owner", async function () {
      await expect(
        escrow.connect(thirdParty).release(ORDER_ID)
      ).to.be.revertedWith("SwyftPay: not owner");
    });

    it("reverts double release", async function () {
      await escrow.connect(owner).release(ORDER_ID);
      await expect(
        escrow.connect(owner).release(ORDER_ID)
      ).to.be.revertedWith("SwyftPay: order not pending");
    });
  });

  describe("refund()", function () {
    beforeEach(async function () {
      await escrow.connect(sender).deposit(ORDER_ID, receiver.address, { value: AMOUNT });
    });

    it("returns AMOY to sender and emits Refunded", async function () {
      const before = await ethers.provider.getBalance(sender.address);
      await expect(
        escrow.connect(owner).refund(ORDER_ID)
      ).to.emit(escrow, "Refunded");
      const after = await ethers.provider.getBalance(sender.address);
      expect(after).to.be.gt(before);
    });

    it("reverts if called by non-owner", async function () {
      await expect(
        escrow.connect(thirdParty).refund(ORDER_ID)
      ).to.be.revertedWith("SwyftPay: not owner");
    });

    it("reverts refund after release", async function () {
      await escrow.connect(owner).release(ORDER_ID);
      await expect(
        escrow.connect(owner).refund(ORDER_ID)
      ).to.be.revertedWith("SwyftPay: order not pending");
    });
  });

  describe("getOrder()", function () {
    it("returns correct order data after deposit", async function () {
      await escrow.connect(sender).deposit(ORDER_ID, receiver.address, { value: AMOUNT });
      const [s, r, amt, status] = await escrow.getOrder(ORDER_ID);
      expect(s).to.equal(sender.address);
      expect(r).to.equal(receiver.address);
      expect(amt).to.equal(AMOUNT);
      expect(status).to.equal(0); // PENDING
    });

    it("reverts for non-existent order", async function () {
      await expect(
        escrow.getOrder("nonexistent")
      ).to.be.revertedWith("SwyftPay: order not found");
    });
  });

  describe("transferOwnership()", function () {
    it("transfers owner to new address", async function () {
      await escrow.connect(owner).transferOwnership(thirdParty.address);
      expect(await escrow.owner()).to.equal(thirdParty.address);
    });

    it("reverts if called by non-owner", async function () {
      await expect(
        escrow.connect(thirdParty).transferOwnership(thirdParty.address)
      ).to.be.revertedWith("SwyftPay: not owner");
    });
  });

  describe("direct ETH transfer prevention", function () {
    it("reverts direct ETH transfer", async function () {
      await expect(
        sender.sendTransaction({ to: await escrow.getAddress(), value: AMOUNT })
      ).to.be.revertedWith("SwyftPay: use deposit()");
    });
  });
});

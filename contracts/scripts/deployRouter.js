const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  console.log("──────────────────────────────────────────────");
  console.log("  SWYFTPAY Router — Deploying to Polygon Amoy");
  console.log("──────────────────────────────────────────────");

  // Read previously deployed Escrow address
  const deploymentsDir = path.join(__dirname, "../deployments");
  const amoyDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, "amoy.json"), "utf8")
  );
  const escrowAddress = amoyDeployment.contractAddress;
  console.log("Using Escrow address :", escrowAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address     :", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance     :", ethers.formatEther(balance), "AMOY\n");

  if (balance === 0n) {
    console.error("❌ Deployer has 0 AMOY. Get tokens from https://faucet.polygon.technology/");
    process.exit(1);
  }

  // Deploy Router
  console.log("📦 Deploying SwyftPayRouter...");
  const Router = await ethers.getContractFactory("SwyftPayRouter");
  const router = await Router.deploy(escrowAddress);
  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  const txHash        = router.deploymentTransaction()?.hash;

  console.log("\n✅ SwyftPayRouter deployed!");
  console.log("   Contract address :", routerAddress);
  console.log("   Tx hash          :", txHash);
  console.log("   Explorer         :", `https://amoy.polygonscan.com/address/${routerAddress}`);

  // Transfer Escrow ownership to Router so Router can call release/refund
  console.log("\n🔗 Transferring Escrow ownership to Router...");
  const Escrow = await ethers.getContractAt("SwyftPayEscrow", escrowAddress);
  const transferTx = await Escrow.transferOwnership(routerAddress);
  await transferTx.wait();
  console.log("   ✅ Escrow owner is now Router");

  // Save deployment info — merge into amoy.json
  const updatedDeployment = {
    ...amoyDeployment,
    router: {
      contractName:    "SwyftPayRouter",
      contractAddress: routerAddress,
      deployerAddress: deployer.address,
      txHash,
      deployedAt:      new Date().toISOString(),
      explorerUrl:     `https://amoy.polygonscan.com/address/${routerAddress}`,
    },
  };

  fs.writeFileSync(
    path.join(deploymentsDir, "amoy.json"),
    JSON.stringify(updatedDeployment, null, 2)
  );

  // Append Router address to web/.env
  const webEnvPath = path.join(__dirname, "../../../web/.env");
  if (fs.existsSync(webEnvPath)) {
    const existing = fs.readFileSync(webEnvPath, "utf8");
    const line = `\nNEXT_PUBLIC_ROUTER_CONTRACT_ADDRESS=${routerAddress}\n`;
    if (!existing.includes("NEXT_PUBLIC_ROUTER_CONTRACT_ADDRESS")) {
      fs.appendFileSync(webEnvPath, line);
      console.log("\n📝 Router address appended to web/.env");
    }
  }

  console.log("📁 Updated contracts/deployments/amoy.json");
  console.log("\n💡 Verify on Polygonscan:");
  console.log(`   npx hardhat verify --network amoy ${routerAddress} "${escrowAddress}"\n`);
  console.log("──────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err.message);
  process.exit(1);
});

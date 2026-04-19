const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  console.log("──────────────────────────────────────────────");
  console.log("  SWYFTPAY Escrow — Deploying to Polygon Amoy");
  console.log("──────────────────────────────────────────────");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address :", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance :", ethers.formatEther(balance), "AMOY");

  if (balance === 0n) {
    console.error("\n❌ Deployer has 0 AMOY. Get testnet tokens from:");
    console.error("   https://faucet.polygon.technology/");
    process.exit(1);
  }

  console.log("\n📦 Deploying SwyftPayEscrow...");
  const Escrow = await ethers.getContractFactory("SwyftPayEscrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  const txHash  = escrow.deploymentTransaction()?.hash;

  console.log("\n✅ SwyftPayEscrow deployed!");
  console.log("   Contract address :", address);
  console.log("   Tx hash          :", txHash);
  console.log("   Explorer         :", `https://amoy.polygonscan.com/address/${address}`);
  console.log("   Owner (backend)  :", deployer.address);

  // Save to deployments/amoy.json
  const deploymentInfo = {
    network:         "polygon-amoy",
    chainId:         80002,
    contractName:    "SwyftPayEscrow",
    contractAddress: address,
    deployerAddress: deployer.address,
    txHash,
    deployedAt:      new Date().toISOString(),
    explorerUrl:     `https://amoy.polygonscan.com/address/${address}`,
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, "amoy.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Auto-append to web/.env
  const envLine = `\nNEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${address}\n`;
  const webEnvPath = path.join(__dirname, "../../../web/.env");
  if (fs.existsSync(webEnvPath)) {
    const existing = fs.readFileSync(webEnvPath, "utf8");
    if (!existing.includes("NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS")) {
      fs.appendFileSync(webEnvPath, envLine);
      console.log("\n📝 Contract address appended to web/.env");
    }
  }

  console.log("📁 Deployment saved to contracts/deployments/amoy.json");
  console.log("\n💡 Verify on Polygonscan:");
  console.log(`   npx hardhat verify --network amoy ${address}\n`);
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err.message);
  process.exit(1);
});

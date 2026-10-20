const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting CertificateRegistry deployment...");

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const certificateRegistry = await CertificateRegistry.deploy();

  await certificateRegistry.waitForDeployment();
  const contractAddress = await certificateRegistry.getAddress();

  console.log(`CertificateRegistry deployed to: ${contractAddress}`);

  const deploymentInfo = {
    contractName: "CertificateRegistry",
    address: contractAddress,
    network: hre.network.name,
    deployer: (await hre.ethers.getSigners())[0].address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentPath = path.join(__dirname, "..", "deployments.json");
  let deployments = {};

  if (fs.existsSync(deploymentPath)) {
    const existing = fs.readFileSync(deploymentPath, "utf8");
    deployments = JSON.parse(existing);
  }

  deployments[hre.network.name] = deploymentInfo;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));

  console.log("Deployment information saved to deployments.json");
  console.log(`Admin address: ${deploymentInfo.deployer}`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
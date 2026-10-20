const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function getContractAddress() {
  const deploymentsPath = path.join(__dirname, "deployments.json");

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      `Deployments file not found at ${deploymentsPath}. Run 'npm run deploy' first.`
    );
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const network = hre.network.name;

  if (!deployments[network]) {
    throw new Error(
      `No deployment found for network '${network}'. Available networks: ${Object.keys(deployments).join(", ")}`
    );
  }

  return deployments[network].address;
}

async function main() {
  // Deploy contract (creates a fresh instance for testing on hardhat network)
  let contractAddress;

  if (hre.network.name === "hardhat") {
    console.log("Deploying contract...");
    const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
    const contract = await CertificateRegistry.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
    console.log(`✓ Deployed to: ${contractAddress}\n`);
  } else {
    contractAddress = getContractAddress();
    console.log(`Using existing contract at: ${contractAddress}\n`);
  }

  const CertificateRegistry = await hre.ethers.getContractAt("CertificateRegistry", contractAddress);

  // ========================================
  // CERTIFICATE 1: Normal workflow (remains valid)
  // Demonstrates: Issue → Verify → Update → Verify
  // ========================================
  console.log("--- Certificate 1: Student 1 (Normal Flow) ---\n");

  // Issue certificate for Student 1
  const rollNumber1 = "21BCE0001";
  const issueTx1 = await CertificateRegistry.issueCertificate(
    rollNumber1,
    "Student 1",
    "bafkreiflzzcvlgemgsupsjfr3da6p3pi4cyy5blf46vpl7fcg5hd3c3ha4"
  );
  await issueTx1.wait();
  console.log("✓ Issued certificate for: 21BCE0001");

  // Verify certificate (public function - anyone can call)
  const cert1 = await CertificateRegistry.verifyCertificate(rollNumber1);
  console.log(`  Name: ${cert1[0]}, Valid: ${cert1[2]}`);
  console.log(`  View certificate: https://ipfs.io/ipfs/${cert1[1]}`);

  // Update certificate (simulates name correction)
  const updateTx = await CertificateRegistry.updateCertificate(
    rollNumber1,
    "Student 1 Updated",
    "bafkreiflzzcvlgemgsupsjfr3da6p3pi4cyy5blf46vpl7fcg5hd3c3hb5"
  );
  await updateTx.wait();
  console.log("✓ Updated certificate");

  // Verify updated certificate
  const cert1Updated = await CertificateRegistry.verifyCertificate(rollNumber1);
  console.log(`  Updated Name: ${cert1Updated[0]}, Valid: ${cert1Updated[2]}\n`);

  // ========================================
  // CERTIFICATE 2: Revocation workflow
  // Demonstrates: Issue → Verify (works) → Revoke → Verify (blocked)
  // ========================================
  console.log("--- Certificate 2: Student 2 (Revocation Flow) ---\n");

  // Issue certificate for Student 2
  const rollNumber2 = "21BCE0002";
  const issueTx2 = await CertificateRegistry.issueCertificate(
    rollNumber2,
    "Student 2",
    "bafkreib566otjk54vgjqrz44xfcgdqmjgwbgatligkned7kl5qmilzvnwq"
  );
  await issueTx2.wait();
  console.log("✓ Issued certificate for: 21BCE0002");

  // Verify before revocation (should work)
  const cert2 = await CertificateRegistry.verifyCertificate(rollNumber2);
  console.log(`  Name: ${cert2[0]}, Valid: ${cert2[2]}`);
  console.log(`  View certificate: https://ipfs.io/ipfs/${cert2[1]}`);

  // Revoke certificate (admin only - simulates academic misconduct)
  const revokeTx = await CertificateRegistry.revokeCertificate(rollNumber2, "Academic misconduct");
  await revokeTx.wait();
  console.log("✓ Certificate revoked");

  // Try to verify after revocation (should fail - security test)
  try {
    await CertificateRegistry.verifyCertificate(rollNumber2);
    console.log("✗ ERROR: Revoked certificate was accessible!");
  } catch (error) {
    console.log("✓ Verification blocked (security working)\n");
  }

  // ========================================
  // FINAL COMPARISON: Side-by-side verification
  // Shows that revocation is selective (doesn't affect other certificates)
  // ========================================
  console.log("--- Final Verification Test ---\n");

  // Test Certificate 1 (should still work)
  try {
    const test1 = await CertificateRegistry.verifyCertificate(rollNumber1);
    console.log(`✓ Certificate 1: ${test1[0]} - ACCESSIBLE`);
  } catch {
    console.log("✗ Certificate 1: BLOCKED (unexpected)");
  }

  // Test Certificate 2 (should be blocked)
  try {
    await CertificateRegistry.verifyCertificate(rollNumber2);
    console.log("✗ Certificate 2: ACCESSIBLE (security breach!)");
  } catch {
    console.log("✓ Certificate 2: BLOCKED (revoked)\n");
  }

  // Summary
  console.log("=".repeat(50));
  console.log("Demo complete: All functions working correctly");
  console.log("=".repeat(50));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

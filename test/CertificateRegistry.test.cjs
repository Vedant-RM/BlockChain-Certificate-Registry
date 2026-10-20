const { expect } = require("chai");
const hre = require("hardhat");

describe("CertificateRegistry", function () {
  let certificateRegistry;
  let admin;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [admin, addr1, addr2] = await hre.ethers.getSigners();
    const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
    certificateRegistry = await CertificateRegistry.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await certificateRegistry.admin()).to.equal(admin.address);
    });
  });

  describe("Issue Certificate", function () {
    const rollNumber = "21BCE0001";
    const studentName = "John Doe";
    const ipfsHash = "bafkreiflzzcvlgemgsupsjfr3da6p3pi4cyy5blf46vpl7fcg5hd3c3ha4";

    it("Should issue a certificate successfully", async function () {
      await expect(
        certificateRegistry.issueCertificate(rollNumber, studentName, ipfsHash)
      ).to.emit(certificateRegistry, "CertificateIssued")
       .withArgs(rollNumber, studentName, ipfsHash);
    });

    it("Should revert if roll number is empty", async function () {
      await expect(
        certificateRegistry.issueCertificate("", studentName, ipfsHash)
      ).to.be.revertedWith("CertificateRegistry: Roll number cannot be empty");
    });

    it("Should revert if non-admin tries to issue", async function () {
      await expect(
        certificateRegistry.connect(addr1).issueCertificate(rollNumber, studentName, ipfsHash)
      ).to.be.revertedWith("CertificateRegistry: Only admin can perform this action");
    });

    it("Should revert if certificate already issued for roll number", async function () {
      await certificateRegistry.issueCertificate(rollNumber, studentName, ipfsHash);

      await expect(
        certificateRegistry.issueCertificate(rollNumber, "Jane Doe", "differentHash")
      ).to.be.revertedWith("CertificateRegistry: Certificate already issued for this roll number");
    });

    it("Should allow issuing multiple certificates for different roll numbers", async function () {
      const rollNumber2 = "21BCE0002";
      const studentName2 = "Jane Doe";

      await certificateRegistry.issueCertificate(rollNumber, studentName, ipfsHash);
      await expect(
        certificateRegistry.issueCertificate(rollNumber2, studentName2, ipfsHash)
      ).to.emit(certificateRegistry, "CertificateIssued");
    });
  });

  describe("Verify Certificate", function () {
    const rollNumber = "21BCE0001";
    const studentName = "John Doe";
    const ipfsHash = "bafkreiflzzcvlgemgsupsjfr3da6p3pi4cyy5blf46vpl7fcg5hd3c3ha4";

    beforeEach(async function () {
      await certificateRegistry.issueCertificate(rollNumber, studentName, ipfsHash);
    });

    it("Should retrieve certificate details successfully", async function () {
      const [name, hash, isIssued] = await certificateRegistry.verifyCertificate(rollNumber);

      expect(name).to.equal(studentName);
      expect(hash).to.equal(ipfsHash);
      expect(isIssued).to.be.true;
    });

    it("Should revert when verifying non-existent certificate", async function () {
      await expect(
        certificateRegistry.verifyCertificate("21BCE9999")
      ).to.be.revertedWith("CertificateRegistry: Certificate does not exist");
    });

    it("Should allow any address to verify a certificate", async function () {
      const [name, hash, isIssued] = await certificateRegistry.connect(addr1).verifyCertificate(rollNumber);

      expect(name).to.equal(studentName);
      expect(hash).to.equal(ipfsHash);
      expect(isIssued).to.be.true;
    });
  });

  describe("Admin Authorization", function () {
    const rollNumber = "21BCE0001";
    const studentName = "John Doe";
    const ipfsHash = "bafkreiflzzcvlgemgsupsjfr3da6p3pi4cyy5blf46vpl7fcg5hd3c3ha4";

    it("Only admin should be able to issue certificates", async function () {
      await expect(
        certificateRegistry.connect(addr2).issueCertificate(rollNumber, studentName, ipfsHash)
      ).to.be.revertedWith("CertificateRegistry: Only admin can perform this action");
    });
  });

  describe("Revoke Certificate", function () {
    const rollNumber = "21BCE0001";
    const studentName = "John Doe";
    const ipfsHash = "bafkreiflzzcvlgemgsupsjfr3da6p3pi4cyy5blf46vpl7fcg5hd3c3ha4";
    const reason = "Academic misconduct";

    beforeEach(async function () {
      await certificateRegistry.issueCertificate(rollNumber, studentName, ipfsHash);
    });

    it("Should revoke a certificate successfully", async function () {
      await expect(
        certificateRegistry.revokeCertificate(rollNumber, reason)
      ).to.emit(certificateRegistry, "CertificateRevoked")
       .withArgs(rollNumber, reason);
    });

    it("Should revert if non-admin tries to revoke", async function () {
      await expect(
        certificateRegistry.connect(addr1).revokeCertificate(rollNumber, reason)
      ).to.be.revertedWith("CertificateRegistry: Only admin can perform this action");
    });

    it("Should revert if roll number is empty", async function () {
      await expect(
        certificateRegistry.revokeCertificate("", reason)
      ).to.be.revertedWith("CertificateRegistry: Roll number cannot be empty");
    });

    it("Should revert if certificate does not exist", async function () {
      await expect(
        certificateRegistry.revokeCertificate("21BCE9999", reason)
      ).to.be.revertedWith("CertificateRegistry: Certificate does not exist");
    });

    it("Should revert if certificate is already revoked", async function () {
      await certificateRegistry.revokeCertificate(rollNumber, reason);

      await expect(
        certificateRegistry.revokeCertificate(rollNumber, "Another reason")
      ).to.be.revertedWith("CertificateRegistry: Certificate is already revoked");
    });

    it("Should prevent verification of revoked certificates", async function () {
      await certificateRegistry.revokeCertificate(rollNumber, reason);

      await expect(
        certificateRegistry.verifyCertificate(rollNumber)
      ).to.be.revertedWith("CertificateRegistry: Certificate has been revoked");
    });

    it("Should allow revoking multiple different certificates", async function () {
      const rollNumber2 = "21BCE0002";
      const reason2 = "Dropout";

      await certificateRegistry.issueCertificate(rollNumber2, "Jane Doe", ipfsHash);

      await certificateRegistry.revokeCertificate(rollNumber, reason);
      await expect(
        certificateRegistry.revokeCertificate(rollNumber2, reason2)
      ).to.emit(certificateRegistry, "CertificateRevoked");
    });
  });

  describe("Update Certificate", function () {
    const rollNumber = "21BCE0001";
    const studentName = "John Doe";
    const ipfsHash = "bafkreiflzzcvlgemgsupsjfr3da6p3pi4cyy5blf46vpl7fcg5hd3c3ha4";
    const updatedName = "John Michael Doe";
    const updatedHash = "bafkreiflzzcvlgemgsupsjfr3da6p3pi4cyy5blf46vpl7fcg5hd3c3hb5";

    beforeEach(async function () {
      await certificateRegistry.issueCertificate(rollNumber, studentName, ipfsHash);
    });

    it("Should update certificate metadata successfully", async function () {
      const tx = await certificateRegistry.updateCertificate(rollNumber, updatedName, updatedHash);
      const receipt = await tx.wait();

      expect(receipt.logs.length).to.be.greaterThan(0);
      await expect(tx).to.emit(certificateRegistry, "CertificateUpdated");
    });

    it("Should verify that certificate was updated", async function () {
      await certificateRegistry.updateCertificate(rollNumber, updatedName, updatedHash);

      const [name, hash] = await certificateRegistry.verifyCertificate(rollNumber);
      expect(name).to.equal(updatedName);
      expect(hash).to.equal(updatedHash);
    });

    it("Should revert if non-admin tries to update", async function () {
      await expect(
        certificateRegistry.connect(addr1).updateCertificate(rollNumber, updatedName, updatedHash)
      ).to.be.revertedWith("CertificateRegistry: Only admin can perform this action");
    });

    it("Should revert if roll number is empty", async function () {
      await expect(
        certificateRegistry.updateCertificate("", updatedName, updatedHash)
      ).to.be.revertedWith("CertificateRegistry: Roll number cannot be empty");
    });

    it("Should revert if certificate does not exist", async function () {
      await expect(
        certificateRegistry.updateCertificate("21BCE9999", updatedName, updatedHash)
      ).to.be.revertedWith("CertificateRegistry: Certificate does not exist");
    });

    it("Should revert if trying to update a revoked certificate", async function () {
      await certificateRegistry.revokeCertificate(rollNumber, "Academic misconduct");

      await expect(
        certificateRegistry.updateCertificate(rollNumber, updatedName, updatedHash)
      ).to.be.revertedWith("CertificateRegistry: Cannot update a revoked certificate");
    });

    it("Should allow updating the same certificate multiple times", async function () {
      const thirdName = "John M. Doe";
      const thirdHash = "bafkreiflzzcvlgemgsupsjfr3da6p3pi4cyy5blf46vpl7fcg5hd3c3hc6";

      await certificateRegistry.updateCertificate(rollNumber, updatedName, updatedHash);
      await expect(
        certificateRegistry.updateCertificate(rollNumber, thirdName, thirdHash)
      ).to.emit(certificateRegistry, "CertificateUpdated");

      const [name, hash] = await certificateRegistry.verifyCertificate(rollNumber);
      expect(name).to.equal(thirdName);
      expect(hash).to.equal(thirdHash);
    });
  });
});

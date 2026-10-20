const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const CertificateRegistryModule = buildModule("CertificateRegistryModule", (m) => {
  const certificateRegistry = m.contract("CertificateRegistry");

  m.call(certificateRegistry, "admin", []);

  return { certificateRegistry };
});

module.exports = CertificateRegistryModule;

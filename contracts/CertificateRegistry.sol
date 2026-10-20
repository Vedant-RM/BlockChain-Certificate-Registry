// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateRegistry {
    address public admin;

    struct Certificate {
        string studentName;
        string ipfsHash;
        bool isRevoked;
        uint256 lastUpdated;
    }

    // Mapping from roll number to Certificate
    mapping(string => Certificate) private certificates;

    // Events
    event CertificateIssued(string indexed rollNumber, string studentName, string ipfsHash);
    event CertificateRevoked(string indexed rollNumber, string reason);
    event CertificateUpdated(string indexed rollNumber, string studentName, string ipfsHash, uint256 timestamp);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "CertificateRegistry: Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @notice Issues a new certificate for a given roll number.
     * @param _rollNumber The unique identifier of the student.
     * @param _studentName The name of the student.
     * @param _ipfsHash The IPFS hash of the certificate file.
     */
    function issueCertificate(
        string calldata _rollNumber,
        string calldata _studentName,
        string calldata _ipfsHash
    ) external onlyAdmin {
        require(bytes(_rollNumber).length > 0, "CertificateRegistry: Roll number cannot be empty");
        require(bytes(certificates[_rollNumber].studentName).length == 0, "CertificateRegistry: Certificate already issued for this roll number");

        certificates[_rollNumber] = Certificate({
            studentName: _studentName,
            ipfsHash: _ipfsHash,
            isRevoked: false,
            lastUpdated: block.timestamp
        });

        emit CertificateIssued(_rollNumber, _studentName, _ipfsHash);
    }

    /**
     * @notice Verifies and retrieves certificate details for a given roll number.
     * @param _rollNumber The unique identifier to look up.
     * @return studentName The name of the student.
     * @return ipfsHash The IPFS hash of the certificate.
     * @return isIssued True if the certificate is valid and issued.
     */
    function verifyCertificate(string calldata _rollNumber)
        external
        view
        returns (
            string memory studentName,
            string memory ipfsHash,
            bool isIssued
        )
    {
        Certificate memory cert = certificates[_rollNumber];
        require(bytes(cert.studentName).length > 0, "CertificateRegistry: Certificate does not exist");
        require(!cert.isRevoked, "CertificateRegistry: Certificate has been revoked");
        return (cert.studentName, cert.ipfsHash, true);
    }

    /**
     * @notice Revokes a certificate for a given roll number.
     * @param _rollNumber The unique identifier of the certificate to revoke.
     * @param _reason The reason for revocation (stored for record-keeping).
     */
    function revokeCertificate(string calldata _rollNumber, string calldata _reason)
        external
        onlyAdmin
    {
        require(bytes(_rollNumber).length > 0, "CertificateRegistry: Roll number cannot be empty");
        require(bytes(certificates[_rollNumber].studentName).length > 0, "CertificateRegistry: Certificate does not exist");
        require(!certificates[_rollNumber].isRevoked, "CertificateRegistry: Certificate is already revoked");

        certificates[_rollNumber].isRevoked = true;
        emit CertificateRevoked(_rollNumber, _reason);
    }

    /**
     * @notice Updates certificate metadata for a given roll number.
     * @param _rollNumber The unique identifier of the certificate to update.
     * @param _studentName The updated name of the student.
     * @param _ipfsHash The updated IPFS hash of the certificate file.
     */
    function updateCertificate(
        string calldata _rollNumber,
        string calldata _studentName,
        string calldata _ipfsHash
    ) external onlyAdmin {
        require(bytes(_rollNumber).length > 0, "CertificateRegistry: Roll number cannot be empty");
        require(bytes(certificates[_rollNumber].studentName).length > 0, "CertificateRegistry: Certificate does not exist");
        require(!certificates[_rollNumber].isRevoked, "CertificateRegistry: Cannot update a revoked certificate");

        certificates[_rollNumber].studentName = _studentName;
        certificates[_rollNumber].ipfsHash = _ipfsHash;
        certificates[_rollNumber].lastUpdated = block.timestamp;

        emit CertificateUpdated(_rollNumber, _studentName, _ipfsHash, block.timestamp);
    }
}

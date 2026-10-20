# Blockchain Certificate Registry

[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.0-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.17-FFF100?logo=ethereum)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-646C99?logo=vite)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-24%20Passing-brightgreen)](test/CertificateRegistry.test.cjs)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A decentralized academic and professional certificate management system built on Ethereum and IPFS. This system allows authorized institutions to issue, update, and revoke tamper-proof certificates, while enabling students and verifiers worldwide to validate credentials instantly with zero transaction fees.

For an in-depth non-technical guide explaining how the entire system works, see [HOW_IT_WORKS.md](HOW_IT_WORKS.md).

---

## Table of Contents

- [Overview and Motivation](#overview-and-motivation)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Smart Contract Specification](#smart-contract-specification)
  - [Data Structures and State](#data-structures-and-state)
  - [Contract Functions](#contract-functions)
  - [Audit Trail and Events](#audit-trail-and-events)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites](#prerequisites)
- [Quick Start and Installation](#quick-start-and-installation)
  - [1. Backend and Smart Contracts](#1-backend-and-smart-contracts)
  - [2. Frontend Web Application](#2-frontend-web-application)
- [Interacting via CLI](#interacting-via-cli)
- [Interacting via Frontend Application](#interacting-via-frontend-application)
  - [Dual Connection Modes](#dual-connection-modes)
  - [MetaMask Localhost Network Setup](#metamask-localhost-network-setup)
- [Testing Suite](#testing-suite)
- [Security and Architecture Highlights](#security-and-architecture-highlights)
- [Future Roadmap](#future-roadmap)
- [License](#license)

---

## Overview and Motivation

Traditional paper and digital credentials face major vulnerabilities:
* Fraud and Counterfeiting: Physical and PDF certificates can be forged or altered with basic software.
* Slow and Costly Verification: Employers and institutions rely on manual phone calls, emails, or paid background checks.
* Single Points of Failure: Centralized databases are vulnerable to server outages, ransomware, data loss, and unauthorized modifications.

### The Decentralized Solution
* Tamper-Proof Ledger: Certificate records are stored cryptographically on an Ethereum-compatible blockchain.
* Decentralized Storage (IPFS): Certificate documents (PDFs and images) are stored off-chain on IPFS, keeping gas costs minimal while ensuring document immutability through cryptographic content hashes (CIDs).
* Free Public Verification: Verification queries are read-only (view) functions that execute without gas fees.
* Immutable Audit Trail: Every state transition (issuance, updates, revocations) emits indexed blockchain event logs.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Users ["Users and Roles"]
        Admin["Admin / Institution<br/>(Private Key / MetaMask)"]
        PublicUser["Public Verifier / Student<br/>(Browser / Direct RPC)"]
    end

    subgraph FrontendApp ["Frontend Application (React + Vite + Ethers.js)"]
        UIAdmin["Admin Panel<br/>(Issue / Update / Revoke)"]
        UIVerify["Verification Panel<br/>(Public Lookup)"]
        ConnMgr["Connection Manager<br/>Auto-Connect on Load<br/>MetaMask Switcher<br/>Direct Local RPC"]
    end

    subgraph Blockchain ["Ethereum Blockchain (Hardhat / Localhost / Testnet)"]
        Contract["CertificateRegistry.sol<br/>admin: address<br/>certificates: mapping(string => Certificate)"]
        Events["Indexed Events Log<br/>CertificateIssued<br/>CertificateUpdated<br/>CertificateRevoked"]
    end

    subgraph Storage ["Off-Chain Storage"]
        IPFS["IPFS Network / Gateway<br/>(Certificate PDF / Media)"]
    end

    Admin -->|Sign Transactions| UIAdmin
    PublicUser -->|Read Queries| UIVerify

    UIAdmin -->|issueCertificate / update / revoke| Contract
    UIVerify -->|verifyCertificate (view call)| Contract
    Contract -->|Emit audit logs| Events

    UIVerify -.->|Fetch document via CID (ipfs.io)| IPFS
    Admin -.->|Pin certificate document| IPFS
```

---

## Key Features

- Certificate Issuance: Authorized administrators register certificates with unique roll numbers, student names, and IPFS hashes.
- Public Verification: Instant zero-gas verification for any third party using the student roll number.
- Metadata Updates: Administrators can update student names or document hashes while tracking update timestamps.
- Permanent Revocation: Credentials can be permanently revoked with an on-chain reason string, blocking future verification.
- Dual Connection Modes:
  - MetaMask Web3 Mode: Connect through browser extension with automatic network switching (Chain ID 31337) and account change listeners.
  - Direct Hardhat RPC Mode: Connect directly to http://127.0.0.1:8545 using pre-funded admin accounts, bypassing browser extension permission blocks.
- Auto-Connect on Load: Automatically connects to the local Hardhat node on startup if reachable.
- Public IPFS Resolution: Verified credentials link directly to standard public IPFS gateways (https://ipfs.io/ipfs/<hash>).
- Comprehensive Test Suite: 24 unit and integration tests covering positive flows, authorization boundaries, and edge cases.

---

## Smart Contract Specification

The smart contract is located at `contracts/CertificateRegistry.sol`.

### Data Structures and State

```solidity
struct Certificate {
    string studentName;      // Full legal name of the student
    string ipfsHash;         // Content identifier (CID) of the certificate on IPFS
    bool isRevoked;          // Flag indicating whether the certificate is revoked
    uint256 lastUpdated;     // Timestamp of creation or latest update
}

address public admin;                                    // Deployer address with exclusive administrative rights
mapping(string => Certificate) private certificates;     // Mapping of rollNumber => Certificate
```

### Contract Functions

| Function | Type | Access | Description |
|:---|:---|:---|:---|
| `issueCertificate(string _rollNumber, string _studentName, string _ipfsHash)` | Mutating | Admin Only | Registers a new certificate. Reverts if roll number is empty or already registered. |
| `verifyCertificate(string _rollNumber)` | view (Zero Gas) | Public | Returns `(studentName, ipfsHash, isIssued)`. Reverts if certificate does not exist or has been revoked. |
| `revokeCertificate(string _rollNumber, string _reason)` | Mutating | Admin Only | Marks certificate as revoked. Irreversible. Records revocation reason in emitted event. |
| `updateCertificate(string _rollNumber, string _studentName, string _ipfsHash)` | Mutating | Admin Only | Updates name, IPFS hash, and updates `lastUpdated` timestamp. Blocked if revoked. |

### Audit Trail and Events

```solidity
event CertificateIssued(string indexed rollNumber, string studentName, string ipfsHash);
event CertificateRevoked(string indexed rollNumber, string reason);
event CertificateUpdated(string indexed rollNumber, string studentName, string ipfsHash, uint256 timestamp);
```

---

## Project Directory Structure

```text
blockchain_part2/
├── contracts/
│   └── CertificateRegistry.sol         # Solidity smart contract (116 lines)
├── test/
│   └── CertificateRegistry.test.cjs     # 24 automated Mocha/Chai test cases
├── scripts/
│   └── deploy.cjs                      # Deployment script writing to deployments.json
├── ignition/modules/
│   └── Deploy.cjs                      # Hardhat Ignition deployment module
├── frontend/                           # React + Vite frontend application
│   ├── public/                         # Public assets (icons, favicon)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminPanel.jsx          # Admin forms (Issue, Update, Revoke)
│   │   │   └── VerifyCertificate.jsx   # Public certificate verification component
│   │   ├── utils/
│   │   │   └── constants.js            # Deployed contract address and ABI
│   │   ├── App.jsx                     # Wallet connection, auto-connect, and main view
│   │   ├── index.css                   # Responsive layout and styling
│   │   └── main.jsx                    # React root entry point
│   ├── index.html                      # HTML entry template
│   ├── vite.config.js                  # Vite build configuration
│   ├── package.json                    # Frontend dependencies and scripts
│   └── README.md                       # Frontend dedicated documentation
├── deployments.json                    # Auto-generated deployment records per network
├── hardhat.config.cjs                  # Hardhat configuration (Solidity 0.8.20, paths)
├── interact.cjs                        # End-to-end command-line interaction demonstration
├── package.json                        # Root package dependencies and script runner
├── HOW_IT_WORKS.md                     # Non-technical in-depth system explanation
├── ULTIMATE_FINAL_GUIDE.md             # Technical reference and operational guide
└── README.md                           # Main repository documentation (this file)
```

---

## Prerequisites

Before getting started, make sure you have the following installed:
- Node.js (version 18.0.0 or higher; version 20+ recommended)
- npm (version 8 or higher)
- MetaMask browser extension (optional if using Direct RPC mode)

---

## Quick Start and Installation

### 1. Backend and Smart Contracts

Clone the repository and install root dependencies:

```bash
# Clone the repository
git clone <repository-url>
cd blockchain_part2

# Install backend dependencies
npm install
```

Compile the smart contracts:
```bash
npm run compile
```

Run the automated test suite:
```bash
npm test
```

### 2. Frontend Web Application

Open a separate terminal window and install frontend dependencies:

```bash
cd frontend
npm install
```

---

## Interacting via CLI

Execute a complete end-to-end lifecycle demonstration (Issue -> Verify -> Update -> Revoke -> Verification Blocked) from the terminal:

```bash
npm run interact
```

This script executes against an in-memory Hardhat network (or an active localhost node if configured) and logs output in real time.

---

## Interacting via Frontend Application

To run the full-stack system with the web UI:

### Step 1: Start the Local Hardhat Blockchain Node
In your root terminal:
```bash
npm run node
```
This initializes a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded test accounts (10,000 ETH each). Keep this terminal open.

### Step 2: Deploy Contract to Localhost
In a second terminal, deploy the smart contract to the local node:
```bash
npm run deploy:localhost
```
The deployed address will be logged and saved into `deployments.json`. Confirm that `frontend/src/utils/constants.js` matches the deployed address.

Alternatively, deploy using Hardhat Ignition:
```bash
npx hardhat ignition deploy ./ignition/modules/Deploy.cjs --network localhost
```

### Step 3: Start the Frontend Development Server
In your third terminal:
```bash
cd frontend
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

### Dual Connection Modes

1. Auto-Connect / Direct RPC Mode:
   - If the local node is running at `http://127.0.0.1:8545`, the application automatically connects on page load.
   - You can also click "Connect Direct to Hardhat (Admin)" at any time.
   - Bypasses browser extension permission issues and connects directly using Hardhat Account #0 (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`).

2. MetaMask Wallet Mode:
   - Click "Connect Wallet" to connect your personal MetaMask extension.
   - The application verifies that MetaMask is connected to Hardhat Localhost (Chain ID 31337).
   - If MetaMask is connected to another network, the application falls back to Direct RPC mode.
   - Account changes in MetaMask update the application state dynamically.

#### MetaMask Localhost Network Setup

To configure MetaMask for local testing:
1. Network Configuration:
   - Network Name: Hardhat Localhost
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337` (Hex: `0x7a69`)
   - Currency Symbol: `ETH`
2. Import Admin Account:
   - In the terminal running `npm run node`, copy Account #0 private key:
     `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - In MetaMask, select "Import Account" and paste the private key. This account is the contract admin.

---

## Testing Suite

The project includes 24 comprehensive test cases implemented with Mocha, Chai, and Ethers.js in `test/CertificateRegistry.test.cjs`.

Execute the test suite at any time:
```bash
npm test
```

### Test Coverage Summary

```text
CertificateRegistry
  Deployment
    - Should set the right admin
  Issue Certificate
    - Should issue a certificate successfully
    - Should revert if roll number is empty
    - Should revert if non-admin tries to issue
    - Should revert if certificate already issued for roll number
    - Should allow issuing multiple certificates for different roll numbers
  Verify Certificate
    - Should retrieve certificate details successfully
    - Should revert when verifying non-existent certificate
    - Should allow any address to verify a certificate
  Admin Authorization
    - Only admin should be able to issue certificates
  Revoke Certificate
    - Should revoke a certificate successfully
    - Should revert if non-admin tries to revoke
    - Should revert if roll number is empty
    - Should revert if certificate does not exist
    - Should revert if certificate is already revoked
    - Should prevent verification of revoked certificates
    - Should allow revoking multiple different certificates
  Update Certificate
    - Should update certificate metadata successfully
    - Should verify that certificate was updated
    - Should revert if non-admin tries to update
    - Should revert if roll number is empty
    - Should revert if certificate does not exist
    - Should revert if trying to update a revoked certificate
    - Should allow updating the same certificate multiple times

24 passing (4s)
```

---

## Security and Architecture Highlights

1. Access Control:
   Administrative operations (`issueCertificate`, `updateCertificate`, `revokeCertificate`) require `msg.sender == admin`. Non-admin attempts revert immediately.
2. Input Validation:
   Roll numbers are validated against empty strings (`bytes(_rollNumber).length > 0`). Non-existent records and duplicate registrations are blocked.
3. Irreversible Revocation:
   Once a certificate is revoked, it cannot be updated or restored. Verifiers querying revoked certificates receive clear revert messages.
4. Gas-Efficient Storage:
   Raw files are stored off-chain on IPFS. The smart contract stores only the student metadata and the cryptographic CID hash.
5. Contrast and Accessibility Protection:
   Form inputs explicitly define background and text color to prevent unreadable text under browser dark-mode settings.

---

## Future Roadmap

- Role-Based Access Control (RBAC): Multi-admin and departmental permissions using OpenZeppelin AccessControl.
- Batch Issuance: Support bulk issuance in a single transaction for student cohorts.
- Soulbound Tokens (SBTs): Mint non-transferable ERC-721 or EIP-5114 tokens for digital identity integration.
- Direct In-Browser IPFS Upload: Direct upload and pinning integration via Pinata or Web3.Storage APIs.
- Certificate Expiration: Optional expiry dates for renewable professional certifications.

---

## License

This project is licensed under the [ISC License](package.json).

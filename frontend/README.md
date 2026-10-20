# 🌐 Blockchain Certificate Registry - Frontend

This is the React + Vite frontend application for the **Blockchain Certificate Registry**. It connects to the Ethereum smart contract deployed locally or on a testnet, providing an interactive user interface for public certificate verification and administrative certificate management.

---

## 🚀 Features

- **Public Certificate Verification:** Anyone can look up a certificate by student Roll Number to verify authenticity, active status, and view the original credential document on IPFS.
- **Admin Management Panel:** Authorized contract owners can:
  - 📜 **Issue** new certificates with Roll Number, Student Name, and IPFS CID.
  - ✏️ **Update** metadata (Student Name, IPFS CID) for existing unrevoked certificates.
  - ⚠️ **Revoke** certificates permanently with an on-chain audit reason.
- **Dual Connection Modes:**
  - **MetaMask Web3:** Connects via browser wallet with automatic network switching to Hardhat Localhost (Chain ID `31337`).
  - **Direct Hardhat RPC (Admin):** Direct connection to `http://127.0.0.1:8545` using the pre-funded Hardhat Account #0, bypassing browser wallet extension restrictions (e.g. Brave/MetaMask localhost blocking).
  - **Auto-Connect:** Automatically connects to the local Hardhat node on page load if the node is running.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Bundler:** [Vite 8](https://vitejs.dev/)
- **Web3 Library:** [Ethers.js v5](https://docs.ethers.org/v5/)
- **Linter:** [Oxlint](https://oxc.rs/)

---

## 📂 Project Structure

```text
frontend/
├── public/
│   ├── favicon.svg          # Application icon
│   └── icons.svg            # UI icons
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx        # Admin forms: Issue, Update, Revoke
│   │   └── VerifyCertificate.jsx # Public verification search
│   ├── utils/
│   │   └── constants.js          # Contract address & ABI definition
│   ├── App.jsx                   # Wallet connection & main container
│   ├── index.css                 # Base styles
│   └── main.jsx                  # React application entry point
├── index.html                    # HTML root template
├── package.json                  # Dependencies & scripts
└── vite.config.js                # Vite build configuration
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
```
Generates production-ready static assets in the `dist/` directory.

### 4. Linting
```bash
npm run lint
```
Runs Oxlint for high-speed static code analysis.

---

## 🔗 Smart Contract Configuration

The contract address and ABI are configured in [`src/utils/constants.js`](file:///home/vedant/blockchain_part2%20(Copy%202)/frontend/src/utils/constants.js). When deploying a fresh contract instance:
```bash
# In the root repository
npm run deploy:localhost
```
Confirm that `contractAddress` in `src/utils/constants.js` matches the deployed address in `deployments.json`.

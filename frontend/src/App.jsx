import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from './utils/constants.js';
import VerifyCertificate from './components/VerifyCertificate.jsx';
import AdminPanel from './components/AdminPanel.jsx';

const HARDHAT_CHAIN_ID = 31337;
const HARDHAT_CHAIN_ID_HEX = '0x7a69';
const HARDHAT_RPC_URL = 'http://10.107.249.22:8545';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [connectionMode, setConnectionMode] = useState(''); // 'metamask' | 'direct'
  const [chainInfo, setChainInfo] = useState('');

  // Auto-connect to Hardhat localhost on page load if the node is reachable
  useEffect(() => {
    let handleChainChanged;
    let handleAccountsChanged;

    const autoConnectHardhat = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(HARDHAT_RPC_URL);
        // Quick reachability check – getNetwork will throw if node is down
        const network = await provider.getNetwork();
        if (network.chainId === HARDHAT_CHAIN_ID) {
          const signer = provider.getSigner(0);
          const address = await signer.getAddress();
          const certificateContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
          );
          setCurrentAccount(address);
          setContract(certificateContract);
          setConnectionMode('direct');
          setChainInfo(`Connected (Hardhat Localhost - Chain ${network.chainId}): ${address.slice(0, 8)}...${address.slice(-5)}`);
        }
      } catch {
        // Hardhat node not running – silent, user can connect manually
      }
    };

    if (window.ethereum) {
      handleChainChanged = () => window.location.reload();
      handleAccountsChanged = (accounts) => {
        if (!accounts || accounts.length === 0) {
          autoConnectHardhat();
        } else {
          const newAccount = accounts[0];
          setCurrentAccount(newAccount);
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const certificateContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
          );
          setContract(certificateContract);
          setConnectionMode('metamask');
          setChainInfo(`Connected via MetaMask (Chain ${HARDHAT_CHAIN_ID}): ${newAccount.slice(0, 8)}...${newAccount.slice(-5)}`);
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    autoConnectHardhat();

    return () => {
      if (window.ethereum) {
        if (handleChainChanged) window.ethereum.removeListener('chainChanged', handleChainChanged);
        if (handleAccountsChanged) window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  /**
   * Connect via MetaMask (window.ethereum).
   * Attempts wallet_switchEthereumChain to Hardhat's chain ID 0x7a69.
   * After connecting, verifies the actual chain ID. If it's stuck on
   * the wrong chain (Brave/MetaMask permission bug), falls back to
   * direct JsonRpcProvider automatically.
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert('MetaMask not detected – use the "Connect Direct to Hardhat" button instead.');
        return;
      }

      // Request accounts first
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Try switching to Hardhat chain
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
        });
      } catch (switchError) {
        // 4902 = chain not added to MetaMask yet
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HARDHAT_CHAIN_ID_HEX,
                chainName: 'Hardhat Localhost',
                rpcUrls: [HARDHAT_RPC_URL],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              },
            ],
          });
        } else {
          console.warn('wallet_switchEthereumChain failed:', switchError);
          // Don't throw – we'll check chain ID below and fall back if needed
        }
      }

      // Build provider and verify the chain MetaMask actually settled on
      const provider = new ethers.providers.Web3Provider(ethereum);
      const network = await provider.getNetwork();

      if (network.chainId === HARDHAT_CHAIN_ID) {
        // MetaMask is on the correct chain
        if (accounts && accounts.length > 0) {
          const signer = provider.getSigner();
          const certificateContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
          );
          setCurrentAccount(accounts[0]);
          setContract(certificateContract);
          setConnectionMode('metamask');
          setChainInfo(`Connected via MetaMask (Chain ${network.chainId}): ${accounts[0].slice(0, 8)}...${accounts[0].slice(-5)}`);
        }
      } else {
        // MetaMask is stuck on the wrong chain – fall back to direct connection
        console.warn(
          `MetaMask stuck on chain ${network.chainId} instead of ${HARDHAT_CHAIN_ID}. Falling back to direct Hardhat connection.`
        );
        await connectDirect();
      }
    } catch (error) {
      console.error('Error connecting via MetaMask:', error);
      // Last-resort fallback: try direct connection
      try {
        await connectDirect();
      } catch (directError) {
        console.error('Direct fallback also failed:', directError);
        alert('Could not connect via MetaMask or directly to Hardhat. Make sure the Hardhat node is running (npm run node).');
      }
    }
  };

  /**
   * Connect directly to Hardhat's JSON-RPC endpoint, bypassing MetaMask entirely.
   * Uses provider.getSigner(0) to get the default admin account (Account #0).
   */
  const connectDirect = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(HARDHAT_RPC_URL);
      const network = await provider.getNetwork();

      if (network.chainId !== HARDHAT_CHAIN_ID) {
        alert(`Unexpected chain ID: ${network.chainId}. Expected Hardhat (${HARDHAT_CHAIN_ID}).`);
        return;
      }

      const signer = provider.getSigner(0);
      const address = await signer.getAddress();
      const certificateContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setCurrentAccount(address);
      setContract(certificateContract);
      setConnectionMode('direct');
      setChainInfo(`Connected (Hardhat Localhost - Chain ${network.chainId}): ${address.slice(0, 8)}...${address.slice(-5)}`);
    } catch (error) {
      console.error('Error connecting directly to Hardhat:', error);
      throw error; // Re-throw so callers can handle
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Blockchain Certificate Registry</h1>
      <header style={{ marginBottom: '2rem' }}>
        {!currentAccount ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={connectWallet}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderRadius: '6px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
              }}
            >
              Connect Wallet
            </button>
            <button
              onClick={connectDirect}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                fontWeight: '600',
              }}
            >
              Connect Direct to Hardhat (Admin)
            </button>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Use &quot;Connect Direct&quot; if Brave/MetaMask blocks localhost network switching
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-block',
              backgroundColor: connectionMode === 'direct' ? '#eff6ff' : '#f3f4f6',
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${connectionMode === 'direct' ? '#93c5fd' : '#d1d5db'}`,
            }}
          >
            <div style={{ color: '#4b5563', fontSize: '14px', marginBottom: '2px' }}>
              {chainInfo}
            </div>
            <code style={{ color: '#111827', fontWeight: '600', fontSize: '13px' }}>
              {currentAccount}
            </code>
            {connectionMode === 'direct' && (
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: '8px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: '9999px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                }}
              >
                DIRECT RPC
              </span>
            )}
          </div>
        )}
      </header>

      <main>
        <VerifyCertificate contract={contract} />
        <AdminPanel contract={contract} />
      </main>
    </div>
  );
}

export default App;

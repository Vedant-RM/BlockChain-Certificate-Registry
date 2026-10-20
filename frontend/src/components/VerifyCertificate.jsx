import { useState } from 'react';

function VerifyCertificate({ contract }) {
  const [rollNumber, setRollNumber] = useState('');
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();

    if (!rollNumber.trim()) {
      setErrorMessage('Please enter a valid Roll Number.');
      return;
    }

    if (!contract) {
      setErrorMessage('Contract connection unavailable. Please ensure your wallet is connected or the blockchain node is running.');
      return;
    }

    setErrorMessage('');
    setCertificateData(null);
    setLoading(true);

    try {
      const result = await contract.verifyCertificate(rollNumber.trim());
      const studentName = result.studentName ?? result[0];
      const ipfsHash = result.ipfsHash ?? result[1];
      const isIssued = result.isIssued ?? result[2];

      setCertificateData({
        studentName,
        ipfsHash,
        isIssued,
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      let message =
        error.reason ||
        error?.data?.message ||
        error?.error?.data?.message ||
        error?.error?.message ||
        error?.message ||
        'Failed to verify certificate.';

      const match = message.match(/reverted with reason string ['"]([^'"]+)['"]/);
      if (match) {
        message = match[1];
      } else {
        message = message.replace(/^execution reverted:\s*/i, '');
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '2rem auto',
        padding: '1.5rem',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e0e0e0',
        backgroundColor: '#fff',
        textAlign: 'left',
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>
        🔍 Public Certificate Verification
      </h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '1.25rem' }}>
        Enter a student roll number to check authenticity on the Ethereum blockchain.
      </p>

      <form onSubmit={handleVerify} style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="e.g. 21BCE0001"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '15px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            backgroundColor: '#ffffff',
            color: '#111827',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 18px',
            fontSize: '15px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: loading ? '#aaa' : '#2563eb',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
          }}
        >
          {loading ? 'Verifying...' : 'Verify Certificate'}
        </button>
      </form>

      {loading && (
        <div style={{ color: '#2563eb', fontWeight: '500', margin: '1rem 0' }}>
          ⏳ Checking blockchain ledger...
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            color: '#dc2626',
            backgroundColor: '#fee2e2',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #f87171',
            margin: '1rem 0',
            fontSize: '14px',
          }}
        >
          ❌ {errorMessage}
        </div>
      )}

      {certificateData && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
          }}
        >
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#166534' }}>
            ✅ Certificate Verified
          </h3>
          <p style={{ margin: '0.4rem 0', color: '#333' }}>
            <strong>Student Name:</strong> {certificateData.studentName}
          </p>
          <p style={{ margin: '0.4rem 0', color: '#333' }}>
            <strong>Status:</strong>{' '}
            <span
              style={{
                color: certificateData.isIssued ? '#16a34a' : '#dc2626',
                fontWeight: 'bold',
              }}
            >
              {certificateData.isIssued ? 'Valid / Active' : 'Not Valid'}
            </span>
          </p>
          <p style={{ margin: '0.4rem 0', color: '#333' }}>
            <strong>Document Link:</strong>{' '}
            <a
              href={`https://ipfs.io/ipfs/${certificateData.ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2563eb',
                textDecoration: 'underline',
                wordBreak: 'break-all',
              }}
            >
              View on IPFS ({certificateData.ipfsHash})
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export default VerifyCertificate;

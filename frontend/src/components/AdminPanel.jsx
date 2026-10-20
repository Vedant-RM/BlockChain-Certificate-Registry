import { useState } from 'react';

function AdminPanel({ contract }) {
  // Issuance form
  const [issueRoll, setIssueRoll] = useState('');
  const [issueName, setIssueName] = useState('');
  const [issueIpfs, setIssueIpfs] = useState('');

  // Update form
  const [updateRoll, setUpdateRoll] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updateIpfs, setUpdateIpfs] = useState('');

  // Revocation form
  const [revokeRoll, setRevokeRoll] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  // Status feedback
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const parseError = (error) => {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      return 'Transaction was rejected by user in wallet.';
    }
    let msg =
      error.reason ||
      error?.data?.message ||
      error?.error?.message ||
      error?.message ||
      'Transaction failed.';
    return msg.replace(/^execution reverted:\s*/i, '');
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!contract) {
      setIsError(true);
      setStatusMessage('Please connect your admin wallet first.');
      return;
    }
    if (!issueRoll.trim() || !issueName.trim() || !issueIpfs.trim()) {
      setIsError(true);
      setStatusMessage('Please provide Roll Number, Student Name, and IPFS Hash.');
      return;
    }

    try {
      setIsError(false);
      setLoading(true);
      setStatusMessage('⏳ Waiting for transaction confirmation...');

      const tx = await contract.issueCertificate(
        issueRoll.trim(),
        issueName.trim(),
        issueIpfs.trim()
      );
      setStatusMessage(`⏳ Transaction submitted (${tx.hash.slice(0, 10)}...). Waiting for block confirmation...`);
      await tx.wait();

      setIsError(false);
      setStatusMessage(`✅ Certificate for "${issueRoll.trim()}" issued successfully!`);
      setIssueRoll('');
      setIssueName('');
      setIssueIpfs('');
    } catch (err) {
      console.error('Issue error:', err);
      setIsError(true);
      setStatusMessage(`❌ ${parseError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!contract) {
      setIsError(true);
      setStatusMessage('Please connect your admin wallet first.');
      return;
    }
    if (!updateRoll.trim() || !updateName.trim() || !updateIpfs.trim()) {
      setIsError(true);
      setStatusMessage('Please provide Roll Number, New Name, and New IPFS Hash.');
      return;
    }

    try {
      setIsError(false);
      setLoading(true);
      setStatusMessage('⏳ Waiting for transaction confirmation...');

      const tx = await contract.updateCertificate(
        updateRoll.trim(),
        updateName.trim(),
        updateIpfs.trim()
      );
      setStatusMessage(`⏳ Transaction submitted (${tx.hash.slice(0, 10)}...). Waiting for block confirmation...`);
      await tx.wait();

      setIsError(false);
      setStatusMessage(`✅ Certificate for "${updateRoll.trim()}" updated successfully!`);
      setUpdateRoll('');
      setUpdateName('');
      setUpdateIpfs('');
    } catch (err) {
      console.error('Update error:', err);
      setIsError(true);
      setStatusMessage(`❌ ${parseError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!contract) {
      setIsError(true);
      setStatusMessage('Please connect your admin wallet first.');
      return;
    }
    if (!revokeRoll.trim() || !revokeReason.trim()) {
      setIsError(true);
      setStatusMessage('Please provide Roll Number and Revocation Reason.');
      return;
    }

    try {
      setIsError(false);
      setLoading(true);
      setStatusMessage('⏳ Waiting for transaction confirmation...');

      const tx = await contract.revokeCertificate(
        revokeRoll.trim(),
        revokeReason.trim()
      );
      setStatusMessage(`⏳ Transaction submitted (${tx.hash.slice(0, 10)}...). Waiting for block confirmation...`);
      await tx.wait();

      setIsError(false);
      setStatusMessage(`✅ Certificate for "${revokeRoll.trim()}" revoked successfully!`);
      setRevokeRoll('');
      setRevokeReason('');
    } catch (err) {
      console.error('Revoke error:', err);
      setIsError(true);
      setStatusMessage(`❌ ${parseError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    flex: '1 1 300px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left',
  };

  const inputStyle = {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#111827',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '2.5rem auto', padding: '0 1rem' }}>
      <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>
        ⚙️ Admin Management Panel
      </h2>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>
        Perform administrator operations. Only the contract owner address has permission to execute these actions.
      </p>

      {/* Global Status / Error Message Banner */}
      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontWeight: '500',
            fontSize: '14px',
            textAlign: 'left',
            backgroundColor: isError
              ? '#fee2e2'
              : loading
              ? '#eff6ff'
              : '#f0fdf4',
            color: isError
              ? '#991b1b'
              : loading
              ? '#1e40af'
              : '#166534',
            border: `1px solid ${
              isError ? '#f87171' : loading ? '#93c5fd' : '#86efac'
            }`,
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* 3 Forms Grid */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
        }}
      >
        {/* Card 1: Issue Certificate */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 4px 0', color: '#15803d' }}>
            📜 Issue Certificate
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            Register a new tamper-proof credential on-chain.
          </p>

          <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={labelStyle}>
              Roll Number
              <input
                type="text"
                placeholder="e.g. 21BCE0001"
                value={issueRoll}
                onChange={(e) => setIssueRoll(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Student Name
              <input
                type="text"
                placeholder="e.g. Alice Doe"
                value={issueName}
                onChange={(e) => setIssueName(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              IPFS Hash (CID)
              <input
                type="text"
                placeholder="e.g. Qm... or bafy..."
                value={issueIpfs}
                onChange={(e) => setIssueIpfs(e.target.value)}
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                backgroundColor: loading ? '#9ca3af' : '#16a34a',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Processing...' : 'Issue Certificate'}
            </button>
          </form>
        </div>

        {/* Card 2: Update Certificate */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 4px 0', color: '#2563eb' }}>
            ✏️ Update Certificate
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            Modify metadata for an unrevoked certificate.
          </p>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={labelStyle}>
              Roll Number
              <input
                type="text"
                placeholder="e.g. 21BCE0001"
                value={updateRoll}
                onChange={(e) => setUpdateRoll(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              New Student Name
              <input
                type="text"
                placeholder="e.g. Alice Smith"
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              New IPFS Hash (CID)
              <input
                type="text"
                placeholder="e.g. Qm... or bafy..."
                value={updateIpfs}
                onChange={(e) => setUpdateIpfs(e.target.value)}
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Processing...' : 'Update Certificate'}
            </button>
          </form>
        </div>

        {/* Card 3: Revoke Certificate */}
        <div
          style={{
            ...cardStyle,
            border: '1px solid #fecaca',
            backgroundColor: '#fffafb',
          }}
        >
          <h3 style={{ margin: '0 0 4px 0', color: '#dc2626' }}>
            ⚠️ Revoke Certificate
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            Permanently invalidate certificate with audit reason.
          </p>

          <form onSubmit={handleRevoke} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={labelStyle}>
              Roll Number
              <input
                type="text"
                placeholder="e.g. 21BCE0001"
                value={revokeRoll}
                onChange={(e) => setRevokeRoll(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Revocation Reason
              <input
                type="text"
                placeholder="e.g. Academic misconduct"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                style={inputStyle}
              />
            </label>

            <div style={{ flex: 1 }} />

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                backgroundColor: loading ? '#9ca3af' : '#dc2626',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Processing...' : 'Revoke Certificate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

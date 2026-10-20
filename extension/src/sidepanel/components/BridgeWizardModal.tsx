import { useState, type FC } from 'react';
import { PendingApproval } from '../hooks/useBridgeClient';

interface BridgeWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  port: number;
  token: string;
  connectionError: string | null;
  onPortChange: (port: number) => void;
  onTokenChange: (token: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  pendingApproval: PendingApproval | null;
  onApprove: () => void;
  onReject: () => void;
}

export const BridgeWizardModal: FC<BridgeWizardModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  port,
  token,
  connectionError,
  onPortChange,
  onTokenChange,
  onConnect,
  onDisconnect,
  pendingApproval,
  onApprove,
  onReject,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'antigravity' | 'claude' | 'cursor' | 'codex'>('antigravity');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen && !pendingApproval) return null;

  const getAgentSnippet = () => {
    const bridgePath = 'C:/Users/SHABBIR TRADERS/Desktop/New Ext MCP/bridge/dist/index.js';
    const effectiveToken = token || '<YOUR_TOKEN_HERE>';

    switch (activeGuideTab) {
      case 'antigravity':
        return JSON.stringify(
          {
            mcpServers: {
              'vibe-inspector': {
                command: 'node',
                args: [bridgePath, '--port', String(port), '--token', effectiveToken],
              },
            },
          },
          null,
          2
        );

      case 'claude':
        return `claude mcp add vibe-inspector node "${bridgePath}" -- --port ${port} --token ${effectiveToken}`;

      case 'cursor':
        return JSON.stringify(
          {
            mcpServers: {
              'vibe-inspector': {
                command: 'node',
                args: [bridgePath, '--port', String(port), '--token', effectiveToken],
              },
            },
          },
          null,
          2
        );

      case 'codex':
        return `codex mcp add vibe-inspector -- node "${bridgePath}" --port ${port} --token ${effectiveToken}`;
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(getAgentSnippet());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 1500);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {/* If there is a pending write approval, show high priority approval card */}
        {pendingApproval ? (
          <div className="approval-card">
            <div className="approval-header">
              <span className="approval-warning-icon">⚠️</span>
              <div>
                <div className="approval-title">Security Approval Required</div>
                <div className="approval-sub">An AI coding agent wants to modify styles on the page</div>
              </div>
            </div>

            <div className="approval-details">
              <div className="approval-detail-row">
                <span className="approval-key">Action</span>
                <span className="approval-val">{pendingApproval.action}</span>
              </div>
              <div className="approval-detail-row">
                <span className="approval-key">Target Selector</span>
                <span className="approval-val font-mono">{pendingApproval.selector}</span>
              </div>
              <div className="approval-detail-row">
                <span className="approval-key">Property</span>
                <span className="approval-val font-mono">{pendingApproval.property}</span>
              </div>
              <div className="approval-detail-row">
                <span className="approval-key">New Value</span>
                <span className="approval-val font-mono" style={{ color: '#000000' }}>
                  {pendingApproval.value}
                </span>
              </div>
            </div>

            <div className="approval-buttons">
              <button className="btn-approve" onClick={onApprove}>
                ✓ Approve Mutation
              </button>
              <button className="btn-reject" onClick={onReject}>
                ✕ Reject
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Bridge Setup Wizard */}
            <div className="modal-header">
              <div className="brand-section">
                <span style={{ fontSize: '18px' }}>🔌</span>
                <span className="brand-title">Local Bridge Connection</span>
              </div>
              <button className="btn-close-modal" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="connection-form-section">
                <div className="form-row">
                  <label className="form-label">Host Binding</label>
                  <input
                    type="text"
                    value="127.0.0.1 (Localhost Only)"
                    disabled
                    className="form-input disabled"
                  />
                </div>

                <div className="form-row">
                  <label className="form-label">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => onPortChange(parseInt(e.target.value, 10) || 7890)}
                    disabled={isConnected}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <label className="form-label">Auth Token</label>
                  <input
                    type="password"
                    placeholder="Enter token printed by bridge CLI"
                    value={token}
                    onChange={(e) => onTokenChange(e.target.value)}
                    disabled={isConnected}
                    className="form-input"
                  />
                </div>

                {connectionError && (
                  <div className="form-error-banner">{connectionError}</div>
                )}

                <div className="form-actions">
                  {isConnected ? (
                    <button className="btn-disconnect" onClick={onDisconnect}>
                      Disconnect Bridge
                    </button>
                  ) : (
                    <button className="btn-connect" onClick={onConnect}>
                      Connect to Bridge
                    </button>
                  )}
                </div>
              </div>

              {/* Agent Configuration Guides */}
              <div className="wizard-guides-section">
                <div className="group-title" style={{ marginBottom: '8px' }}>
                  AI Agent Configuration Snippets
                </div>
                <div className="guide-tabs">
                  <button
                    className={`guide-tab-btn ${activeGuideTab === 'antigravity' ? 'active' : ''}`}
                    onClick={() => setActiveGuideTab('antigravity')}
                  >
                    Antigravity / Gemini
                  </button>
                  <button
                    className={`guide-tab-btn ${activeGuideTab === 'claude' ? 'active' : ''}`}
                    onClick={() => setActiveGuideTab('claude')}
                  >
                    Claude Code
                  </button>
                  <button
                    className={`guide-tab-btn ${activeGuideTab === 'cursor' ? 'active' : ''}`}
                    onClick={() => setActiveGuideTab('cursor')}
                  >
                    Cursor
                  </button>
                  <button
                    className={`guide-tab-btn ${activeGuideTab === 'codex' ? 'active' : ''}`}
                    onClick={() => setActiveGuideTab('codex')}
                  >
                    Codex
                  </button>
                </div>

                <div className="code-box-wrap">
                  <pre className="guide-code-pre">
                    <code>{getAgentSnippet()}</code>
                  </pre>
                  <button
                    className={`btn-copy-code ${copiedSnippet ? 'copied' : ''}`}
                    onClick={copySnippet}
                  >
                    {copiedSnippet ? 'Copied!' : 'Copy Config'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

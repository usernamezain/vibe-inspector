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
              <span className="approval-warning-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
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
              <button className="btn-approve" onClick={onApprove} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Approve Mutation</span>
              </button>
              <button className="btn-reject" onClick={onReject} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span>Reject</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Bridge Setup Wizard */}
            <div className="modal-header">
              <div className="brand-section">
                <span style={{ display: 'inline-flex', alignItems: 'center', color: '#000000' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v6"/>
                    <path d="m4.93 10.93 4.24 4.24"/>
                    <path d="M2 12h6"/>
                    <path d="m10.93 4.93 4.24 4.24"/>
                    <circle cx="12" cy="12" r="3"/>
                    <path d="m19 19 3 3"/>
                  </svg>
                </span>
                <span className="brand-title">Local Bridge Connection</span>
              </div>
              <button className="btn-close-modal" onClick={onClose} title="Close modal">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
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

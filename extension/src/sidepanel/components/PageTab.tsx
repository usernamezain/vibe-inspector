import { useState, useEffect, type FC } from 'react';
import { PageInfo, A11yAuditResult, WebVitalsSummary } from '@vibe-inspector/shared';

interface PageTabProps {
  modifiedStyles: Record<string, Record<string, string>>;
  onResetAll: () => void;
  onResetElement: (selector: string) => void;
  onSelectSelector?: (selector: string) => void;
}

export const PageTab: FC<PageTabProps> = ({
  modifiedStyles,
  onResetAll,
  onResetElement,
}) => {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Phase 6: Web Vitals State
  const [webVitals, setWebVitals] = useState<WebVitalsSummary | null>(null);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);

  // Phase 6: Accessibility Audit State
  const [a11yResult, setA11yResult] = useState<A11yAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [copiedA11y, setCopiedA11y] = useState(false);

  // Phase 6: BYOK API Key State (stored strictly in chrome.storage.local)
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [showKeySettings, setShowKeySettings] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PAGE_INFO' }, (info) => {
      if (info) setPageInfo(info);
    });

    fetchWebVitals();

    try {
      chrome.storage.local.get(['vibe_user_api_key'], (res) => {
        if (res?.vibe_user_api_key) {
          setApiKey(res.vibe_user_api_key);
          setIsApiKeySaved(true);
        }
      });
    } catch {}
  }, []);

  const fetchWebVitals = () => {
    setIsLoadingVitals(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'GET_WEB_VITALS' }, (res) => {
          setIsLoadingVitals(false);
          if (res?.vitals) setWebVitals(res.vitals);
        });
      } else {
        setIsLoadingVitals(false);
      }
    });
  };

  const handleRunA11yAudit = () => {
    setIsAuditing(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'RUN_A11Y_AUDIT' }, (res) => {
          setIsAuditing(false);
          if (res && res.violations) {
            setA11yResult(res);
          }
        });
      } else {
        setIsAuditing(false);
      }
    });
  };

  const handleCopyA11yReport = () => {
    if (!a11yResult) return;
    const lines = [
      `# Accessibility Audit Report (WCAG 2.1 AA)`,
      `Total Violations: ${a11yResult.violationsCount} | Passes: ${a11yResult.passesCount}`,
      `Timestamp: ${a11yResult.timestamp}`,
      '',
    ];

    a11yResult.violations.forEach((v, idx) => {
      lines.push(`### ${idx + 1}. [${v.impact.toUpperCase()}] ${v.help}`);
      lines.push(`- Rule: ${v.id}`);
      lines.push(`- Description: ${v.description}`);
      lines.push(`- Help URL: ${v.helpUrl}`);
      lines.push(`- Affected Elements (${v.nodes.length}):`);
      v.nodes.forEach((n) => {
        lines.push(`  • Selector: \`${n.target.join(' ')}\``);
        if (n.failureSummary) lines.push(`    Summary: ${n.failureSummary.split('\n')[0]}`);
      });
      lines.push('');
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedA11y(true);
      setTimeout(() => setCopiedA11y(false), 2000);
    });
  };

  const handleSaveApiKey = () => {
    try {
      chrome.storage.local.set({ vibe_user_api_key: apiKey }, () => {
        setIsApiKeySaved(Boolean(apiKey.trim()));
        setShowKeySettings(false);
      });
    } catch {}
  };

  const handleCaptureScreenshot = () => {
    setIsCapturing(true);
    chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, (res) => {
      setIsCapturing(false);
      if (res?.success && res.dataUrl) {
        setScreenshotUrl(res.dataUrl);
      }
    });
  };

  const handleDownloadScreenshot = () => {
    if (!screenshotUrl) return;
    const a = document.createElement('a');
    a.href = screenshotUrl;
    a.download = `vibe-inspector-screenshot-${Date.now()}.png`;
    a.click();
  };

  // Web Vitals Rating Helpers
  const getLcpBadge = (lcp?: number) => {
    if (!lcp) return { text: 'N/A', color: '#a1a1aa' };
    if (lcp <= 2500) return { text: `${(lcp / 1000).toFixed(2)}s (Good)`, color: '#10b981' };
    if (lcp <= 4000) return { text: `${(lcp / 1000).toFixed(2)}s (Needs Imp.)`, color: '#f59e0b' };
    return { text: `${(lcp / 1000).toFixed(2)}s (Poor)`, color: '#f43f5e' };
  };

  const getClsBadge = (cls?: number) => {
    if (cls === undefined) return { text: 'N/A', color: '#a1a1aa' };
    if (cls <= 0.1) return { text: `${cls.toFixed(3)} (Good)`, color: '#10b981' };
    if (cls <= 0.25) return { text: `${cls.toFixed(3)} (Needs Imp.)`, color: '#f59e0b' };
    return { text: `${cls.toFixed(3)} (Poor)`, color: '#f43f5e' };
  };

  const getFcpBadge = (fcp?: number) => {
    if (!fcp) return { text: 'N/A', color: '#a1a1aa' };
    if (fcp <= 1800) return { text: `${(fcp / 1000).toFixed(2)}s (Good)`, color: '#10b981' };
    if (fcp <= 3000) return { text: `${(fcp / 1000).toFixed(2)}s (Needs Imp.)`, color: '#f59e0b' };
    return { text: `${(fcp / 1000).toFixed(2)}s (Poor)`, color: '#f43f5e' };
  };

  const modifiedSelectors = Object.keys(modifiedStyles);

  return (
    <div className="tab-pane-content">
      {/* 1. Page Info Card */}
      <div className="property-group-card">
        <div className="group-title">Active Page Info</div>
        {pageInfo ? (
          <div className="page-info-list">
            <div className="page-info-item">
              <span className="info-key">Title</span>
              <span className="info-val" title={pageInfo.title}>
                {pageInfo.title || 'Untitled'}
              </span>
            </div>
            <div className="page-info-item">
              <span className="info-key">URL</span>
              <span className="info-val" title={pageInfo.url}>
                {pageInfo.url}
              </span>
            </div>
            <div className="page-info-item">
              <span className="info-key">Viewport</span>
              <span className="info-val font-mono">
                {pageInfo.viewport.width} × {pageInfo.viewport.height} px
              </span>
            </div>
          </div>
        ) : (
          <div className="empty-subtext">Loading page details...</div>
        )}
      </div>

      {/* 2. Core Web Vitals Card */}
      <div className="property-group-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div className="group-title" style={{ marginBottom: 0 }}>⚡ Web Vitals & Performance</div>
          <button
            onClick={fetchWebVitals}
            className="btn-action-small"
            style={{ padding: '2px 6px', fontSize: '10px' }}
            disabled={isLoadingVitals}
          >
            {isLoadingVitals ? '...' : '↻ Refresh'}
          </button>
        </div>

        {webVitals ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div style={{ background: '#09090b', padding: '8px', borderRadius: '6px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '10px', color: '#a1a1aa' }}>LCP (Largest Paint)</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: getLcpBadge(webVitals.lcp).color, marginTop: '2px' }}>
                {getLcpBadge(webVitals.lcp).text}
              </div>
            </div>

            <div style={{ background: '#09090b', padding: '8px', borderRadius: '6px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '10px', color: '#a1a1aa' }}>CLS (Layout Shift)</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: getClsBadge(webVitals.cls).color, marginTop: '2px' }}>
                {getClsBadge(webVitals.cls).text}
              </div>
            </div>

            <div style={{ background: '#09090b', padding: '8px', borderRadius: '6px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '10px', color: '#a1a1aa' }}>FCP (First Paint)</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: getFcpBadge(webVitals.fcp).color, marginTop: '2px' }}>
                {getFcpBadge(webVitals.fcp).text}
              </div>
            </div>

            <div style={{ background: '#09090b', padding: '8px', borderRadius: '6px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '10px', color: '#a1a1aa' }}>TTFB (Server Response)</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginTop: '2px' }}>
                {webVitals.ttfb ? `${webVitals.ttfb} ms` : 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-subtext">Observing real-time Web Vitals metrics...</div>
        )}
      </div>

      {/* 3. Accessibility & Contrast Audit (axe-core) Card */}
      <div className="property-group-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div className="group-title" style={{ marginBottom: 0 }}>♿ Accessibility Audit (axe-core)</div>
          <button
            onClick={handleRunA11yAudit}
            className="btn-action-small"
            style={{ padding: '3px 8px', fontSize: '11px', background: isAuditing ? '#6366f1' : '#27272a', color: '#ffffff' }}
            disabled={isAuditing}
          >
            {isAuditing ? 'Scanning...' : 'Run WCAG Audit'}
          </button>
        </div>

        {a11yResult ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    background: a11yResult.violationsCount === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                    color: a11yResult.violationsCount === 0 ? '#34d399' : '#f43f5e',
                  }}
                >
                  {a11yResult.violationsCount} Violations
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                  }}
                >
                  {a11yResult.passesCount} Passes
                </span>
              </div>
              <button
                onClick={handleCopyA11yReport}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copiedA11y ? '#10b981' : '#a1a1aa',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                {copiedA11y ? '✓ Copied!' : 'Copy Report'}
              </button>
            </div>

            {a11yResult.violations.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#10b981', textAlign: 'center', padding: '12px 0' }}>
                ✓ No WCAG 2.1 AA violations detected on page!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {a11yResult.violations.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      background: '#09090b',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #27272a',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: '#fafafa' }}>{v.help}</span>
                      <span
                        style={{
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '1px 4px',
                          borderRadius: '3px',
                          color: v.impact === 'critical' ? '#f43f5e' : '#f59e0b',
                        }}
                      >
                        {v.impact}
                      </span>
                    </div>
                    <div style={{ color: '#a1a1aa', marginBottom: '4px' }}>{v.description}</div>
                    <div style={{ fontSize: '10px', color: '#818cf8', fontFamily: 'monospace' }}>
                      Target: {v.nodes[0]?.target.join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-subtext">Click &quot;Run WCAG Audit&quot; to test page contrast, labels, and roles.</div>
        )}
      </div>

      {/* 4. BYOK Quick Assistant Configuration */}
      <div className="property-group-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div className="group-title" style={{ marginBottom: 0 }}>🤖 Bring-Your-Own-Key Assistant</div>
          <button
            onClick={() => setShowKeySettings(!showKeySettings)}
            style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '11px' }}
          >
            {showKeySettings ? 'Hide' : isApiKeySaved ? 'Configured ✓' : 'Configure'}
          </button>
        </div>

        {showKeySettings ? (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '6px' }}>
              API keys are stored strictly in local browser storage (<code>chrome.storage.local</code>). Zero keys exist in the extension bundle.
            </div>
            <input
              type="password"
              placeholder="sk-... or AI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: '100%',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '4px',
                color: '#fafafa',
                padding: '6px 8px',
                fontSize: '11px',
                marginBottom: '6px',
              }}
            />
            <button className="btn-action-small" onClick={handleSaveApiKey} style={{ width: '100%' }}>
              Save Key to Local Storage
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: '#71717a' }}>
            {isApiKeySaved
              ? 'Local AI key configured. Agents with MCP have direct native access.'
              : 'Optional: add an API key for standalone browser chat without the local bridge.'}
          </div>
        )}
      </div>

      {/* 5. Screenshot Section */}
      <div className="property-group-card">
        <div className="group-title">Viewport Snapshot</div>
        <button
          className="btn-action-primary"
          onClick={handleCaptureScreenshot}
          disabled={isCapturing}
        >
          <span>📸</span>
          <span>{isCapturing ? 'Capturing...' : 'Capture Viewport'}</span>
        </button>

        {screenshotUrl && (
          <div className="screenshot-preview-container">
            <img src={screenshotUrl} alt="Viewport Preview" className="screenshot-img" />
            <div className="screenshot-actions">
              <button className="btn-action-small" onClick={handleDownloadScreenshot}>
                <span>💾</span>
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Page-Wide Style Changes */}
      <div className="property-group-card">
        <div className="section-header-flex">
          <div className="group-title">Page Modifications ({modifiedSelectors.length})</div>
          {modifiedSelectors.length > 0 && (
            <button className="btn-reset-element" onClick={onResetAll}>
              Reset All
            </button>
          )}
        </div>

        {modifiedSelectors.length === 0 ? (
          <div className="empty-subtext">No visual style changes on this page yet.</div>
        ) : (
          <div className="modifications-list">
            {modifiedSelectors.map((sel) => {
              const props = modifiedStyles[sel];
              const count = Object.keys(props).length;
              return (
                <div key={sel} className="modification-item">
                  <div className="mod-sel-info">
                    <span className="mod-sel-text" title={sel}>
                      {sel}
                    </span>
                    <span className="mod-count-badge">
                      {count} {count === 1 ? 'property' : 'properties'}
                    </span>
                  </div>
                  <button
                    className="btn-item-reset"
                    onClick={() => onResetElement(sel)}
                    title="Reset element styles"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

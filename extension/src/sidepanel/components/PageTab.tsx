import { useState, useEffect, type FC } from 'react';
import {
  PageInfo,
  A11yAuditResult,
  WebVitalsSummary,
  PageDesignSummary,
} from '@vibe-inspector/shared';

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

  // Quick Toggles State
  const [outlinesActive, setOutlinesActive] = useState(false);
  const [spacingOverlayActive, setSpacingOverlayActive] = useState(false);
  const [disableAnimationsActive, setDisableAnimationsActive] = useState(false);
  const [colorScheme, setColorScheme] = useState<'system' | 'dark' | 'light'>('system');

  // Responsive Width Presets State
  const [activeWidth, setActiveWidth] = useState<number | null>(null);
  const [customWidthInput, setCustomWidthInput] = useState('');

  // Page Design Metrics State
  const [designSummary, setDesignSummary] = useState<PageDesignSummary | null>(null);
  const [isLoadingDesign, setIsLoadingDesign] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [showCssVars, setShowCssVars] = useState(false);

  // Phase 6: Web Vitals State
  const [webVitals, setWebVitals] = useState<WebVitalsSummary | null>(null);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);

  // Phase 6: Accessibility Audit State
  const [a11yResult, setA11yResult] = useState<A11yAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [copiedA11y, setCopiedA11y] = useState(false);

  // BYOK API Key State (stored strictly in chrome.storage.local)
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [showKeySettings, setShowKeySettings] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PAGE_INFO' }, (info) => {
      if (info) setPageInfo(info);
    });

    fetchWebVitals();
    fetchDesignSummary();

    try {
      chrome.storage.local.get(['vibe_user_api_key'], (res) => {
        if (res?.vibe_user_api_key) {
          setApiKey(res.vibe_user_api_key);
          setIsApiKeySaved(true);
        }
      });
    } catch {}
  }, []);

  const sendTabMessage = (msg: any, callback?: (res: any) => void) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        if (callback) {
          chrome.tabs.sendMessage(tabId, msg, callback);
        } else {
          chrome.tabs.sendMessage(tabId, msg);
        }
      }
    });
  };

  const fetchDesignSummary = () => {
    setIsLoadingDesign(true);
    sendTabMessage({ type: 'GET_PAGE_DESIGN_DATA' }, (res) => {
      setIsLoadingDesign(false);
      if (res?.success && res.data) {
        setDesignSummary(res.data);
      }
    });
  };

  const toggleOutline = () => {
    const next = !outlinesActive;
    setOutlinesActive(next);
    sendTabMessage({ type: 'SET_QUICK_TOGGLE', toggle: 'outlines', active: next });
  };

  const toggleSpacingOverlay = () => {
    const next = !spacingOverlayActive;
    setSpacingOverlayActive(next);
    sendTabMessage({ type: 'SET_QUICK_TOGGLE', toggle: 'spacingOverlay', active: next });
  };

  const toggleDisableAnimations = () => {
    const next = !disableAnimationsActive;
    setDisableAnimationsActive(next);
    sendTabMessage({ type: 'SET_QUICK_TOGGLE', toggle: 'disableAnimations', active: next });
  };

  const cycleColorScheme = () => {
    let next: 'system' | 'dark' | 'light' = 'dark';
    if (colorScheme === 'system') next = 'dark';
    else if (colorScheme === 'dark') next = 'light';
    else next = 'system';

    setColorScheme(next);
    sendTabMessage({
      type: 'SET_QUICK_TOGGLE',
      toggle: 'colorScheme',
      active: next !== 'system',
      theme: next !== 'system' ? next : undefined,
    });
  };

  const handleSetWidth = (w: number | null) => {
    setActiveWidth(w);
    sendTabMessage({ type: 'SET_RESPONSIVE_WIDTH', width: w });
  };

  const handleApplyCustomWidth = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customWidthInput, 10);
    if (!isNaN(val) && val > 200 && val < 4000) {
      handleSetWidth(val);
    }
  };

  const fetchWebVitals = () => {
    setIsLoadingVitals(true);
    sendTabMessage({ type: 'GET_WEB_VITALS' }, (res) => {
      setIsLoadingVitals(false);
      if (res?.vitals) setWebVitals(res.vitals);
    });
  };

  const handleRunA11yAudit = () => {
    setIsAuditing(true);
    sendTabMessage({ type: 'RUN_A11Y_AUDIT' }, (res) => {
      setIsAuditing(false);
      if (res?.violations) {
        setA11yResult(res);
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

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  // Web Vitals Rating Helpers
  const getLcpBadge = (lcp?: number) => {
    if (!lcp) return { text: 'N/A', color: 'var(--vi-text-secondary)' };
    if (lcp <= 2500) return { text: `${(lcp / 1000).toFixed(2)}s (Good)`, color: 'var(--vi-status-success)' };
    if (lcp <= 4000) return { text: `${(lcp / 1000).toFixed(2)}s (Needs Imp.)`, color: 'var(--vi-status-warning)' };
    return { text: `${(lcp / 1000).toFixed(2)}s (Poor)`, color: 'var(--vi-status-danger)' };
  };

  const getClsBadge = (cls?: number) => {
    if (cls === undefined) return { text: 'N/A', color: 'var(--vi-text-secondary)' };
    if (cls <= 0.1) return { text: `${cls.toFixed(3)} (Good)`, color: 'var(--vi-status-success)' };
    if (cls <= 0.25) return { text: `${cls.toFixed(3)} (Needs Imp.)`, color: 'var(--vi-status-warning)' };
    return { text: `${cls.toFixed(3)} (Poor)`, color: 'var(--vi-status-danger)' };
  };

  const getFcpBadge = (fcp?: number) => {
    if (!fcp) return { text: 'N/A', color: 'var(--vi-text-secondary)' };
    if (fcp <= 1800) return { text: `${(fcp / 1000).toFixed(2)}s (Good)`, color: 'var(--vi-status-success)' };
    if (fcp <= 3000) return { text: `${(fcp / 1000).toFixed(2)}s (Needs Imp.)`, color: 'var(--vi-status-warning)' };
    return { text: `${(fcp / 1000).toFixed(2)}s (Poor)`, color: 'var(--vi-status-danger)' };
  };

  const modifiedSelectors = Object.keys(modifiedStyles);
  const cssVarEntries = designSummary ? Object.entries(designSummary.cssVariables) : [];

  return (
    <div className="tab-pane-content">
      {/* 1. Quick Toggles Bar */}
      <div className="property-group-card">
        <div className="group-title">Quick Inspection Overlays</div>
        <div className="vi-quick-toggles-grid">
          <button
            className={`vi-toggle-btn ${outlinesActive ? 'active' : ''}`}
            onClick={toggleOutline}
            title="Outline all page elements with dashed lines"
          >
            <span>Outlines</span>
            <div className="vi-toggle-indicator" />
          </button>

          <button
            className={`vi-toggle-btn ${spacingOverlayActive ? 'active' : ''}`}
            onClick={toggleSpacingOverlay}
            title="Highlight layout element padding and margins"
          >
            <span>Spacing Overlay</span>
            <div className="vi-toggle-indicator" />
          </button>

          <button
            className={`vi-toggle-btn ${disableAnimationsActive ? 'active' : ''}`}
            onClick={toggleDisableAnimations}
            title="Pause CSS transitions and keyframe animations"
          >
            <span>No Animations</span>
            <div className="vi-toggle-indicator" />
          </button>

          <button
            className={`vi-toggle-btn ${colorScheme !== 'system' ? 'active' : ''}`}
            onClick={cycleColorScheme}
            title="Cycle between System, Force Dark, and Force Light themes"
          >
            <span>Scheme: {colorScheme.toUpperCase()}</span>
            <div className="vi-toggle-indicator" />
          </button>
        </div>
      </div>

      {/* 2. Responsive Viewport Presets */}
      <div className="property-group-card">
        <div className="section-header-flex">
          <div className="group-title">Responsive Preview Presets</div>
          {activeWidth && (
            <button
              className="vi-btn-ghost-sm"
              onClick={() => handleSetWidth(null)}
              title="Reset viewport constraint to 100%"
            >
              Reset (100%)
            </button>
          )}
        </div>
        <div className="vi-responsive-grid">
          <button
            className={`vi-responsive-btn ${activeWidth === 320 ? 'active' : ''}`}
            onClick={() => handleSetWidth(activeWidth === 320 ? null : 320)}
          >
            <span>Mobile</span>
            <span className="vi-responsive-sub">320px</span>
          </button>

          <button
            className={`vi-responsive-btn ${activeWidth === 375 ? 'active' : ''}`}
            onClick={() => handleSetWidth(activeWidth === 375 ? null : 375)}
          >
            <span>iPhone</span>
            <span className="vi-responsive-sub">375px</span>
          </button>

          <button
            className={`vi-responsive-btn ${activeWidth === 768 ? 'active' : ''}`}
            onClick={() => handleSetWidth(activeWidth === 768 ? null : 768)}
          >
            <span>Tablet</span>
            <span className="vi-responsive-sub">768px</span>
          </button>

          <button
            className={`vi-responsive-btn ${activeWidth === 1024 ? 'active' : ''}`}
            onClick={() => handleSetWidth(activeWidth === 1024 ? null : 1024)}
          >
            <span>Laptop</span>
            <span className="vi-responsive-sub">1024px</span>
          </button>

          <button
            className={`vi-responsive-btn ${activeWidth === 1440 ? 'active' : ''}`}
            onClick={() => handleSetWidth(activeWidth === 1440 ? null : 1440)}
          >
            <span>Desktop</span>
            <span className="vi-responsive-sub">1440px</span>
          </button>
        </div>

        <form onSubmit={handleApplyCustomWidth} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <input
            type="number"
            placeholder="Custom width (px)"
            value={customWidthInput}
            onChange={(e) => setCustomWidthInput(e.target.value)}
            className="vi-preset-input"
            style={{ fontSize: '11px', padding: '4px 8px' }}
          />
          <button type="submit" className="vi-btn-ghost-sm" style={{ padding: '0 12px' }}>
            Set
          </button>
        </form>
      </div>

      {/* 3. Page Design Language System */}
      <div className="property-group-card">
        <div className="section-header-flex">
          <div className="group-title">Page Design System</div>
          <button
            className="vi-btn-ghost-sm"
            onClick={fetchDesignSummary}
            disabled={isLoadingDesign}
          >
            {isLoadingDesign ? 'Scanning...' : '↻ Rescan'}
          </button>
        </div>

        {designSummary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
            {/* Fonts */}
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--vi-text-secondary)', fontWeight: 600 }}>
                Fonts in Use ({designSummary.fonts.length})
              </div>
              <div className="vi-fonts-list">
                {designSummary.fonts.slice(0, 4).map((f) => (
                  <div key={f.family} className="vi-font-row">
                    <span className="vi-font-family">{f.family}</span>
                    <span className="vi-font-weights">
                      weights: {f.weights.join(', ')} ({f.count} nodes)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--vi-text-secondary)', fontWeight: 600 }}>
                  Color Palette ({designSummary.colors.length})
                </span>
                {copiedHex && (
                  <span style={{ fontSize: '10px', color: 'var(--vi-status-success)' }}>
                    Copied {copiedHex}!
                  </span>
                )}
              </div>
              <div className="vi-swatches-grid">
                {designSummary.colors.map((c) => (
                  <div
                    key={c.hex}
                    className="vi-swatch-item"
                    style={{ backgroundColor: c.hex }}
                    onClick={() => copyColor(c.hex)}
                    title={`Click to copy ${c.hex} (${c.count} uses)`}
                  />
                ))}
              </div>
            </div>

            {/* Spacing Compliance */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--vi-text-secondary)', fontWeight: 600 }}>
                  4px Spacing Grid Compliance
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--vi-text-primary)' }}>
                  {designSummary.spacing.compliancePercent}%
                </span>
              </div>
              <div className="vi-compliance-meter">
                <div
                  className="vi-compliance-fill"
                  style={{ width: `${designSummary.spacing.compliancePercent}%` }}
                />
              </div>
              {designSummary.spacing.outliers.length > 0 && (
                <div style={{ fontSize: '10px', color: 'var(--vi-text-muted)' }}>
                  Outliers: {designSummary.spacing.outliers.slice(0, 2).map((o) => `${o.selector} (${o.property}: ${o.value})`).join(', ')}
                </div>
              )}
            </div>

            {/* CSS Variables */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--vi-text-secondary)', fontWeight: 600 }}>
                  CSS Custom Properties ({cssVarEntries.length})
                </span>
                {cssVarEntries.length > 0 && (
                  <button
                    className="vi-btn-ghost-sm"
                    onClick={() => setShowCssVars(!showCssVars)}
                  >
                    {showCssVars ? 'Hide' : 'View All'}
                  </button>
                )}
              </div>

              {showCssVars && (
                <div style={{ maxHeight: '140px', overflowY: 'auto', background: 'var(--vi-surface-base)', borderRadius: 'var(--vi-radius-sm)', padding: '6px 8px', marginTop: '6px' }}>
                  {cssVarEntries.map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--vi-text-mono)', padding: '2px 0' }}>
                      <span style={{ color: 'var(--vi-accent-base)' }}>{k}</span>
                      <span style={{ color: 'var(--vi-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-subtext">Scanning page styles and design tokens...</div>
        )}
      </div>

      {/* 4. Active Page Info Card */}
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

      {/* 5. Core Web Vitals Card */}
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
            <div style={{ background: 'var(--vi-surface-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--vi-border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--vi-text-secondary)' }}>LCP (Largest Paint)</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: getLcpBadge(webVitals.lcp).color, marginTop: '2px' }}>
                {getLcpBadge(webVitals.lcp).text}
              </div>
            </div>

            <div style={{ background: 'var(--vi-surface-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--vi-border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--vi-text-secondary)' }}>CLS (Layout Shift)</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: getClsBadge(webVitals.cls).color, marginTop: '2px' }}>
                {getClsBadge(webVitals.cls).text}
              </div>
            </div>

            <div style={{ background: 'var(--vi-surface-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--vi-border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--vi-text-secondary)' }}>FCP (First Paint)</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: getFcpBadge(webVitals.fcp).color, marginTop: '2px' }}>
                {getFcpBadge(webVitals.fcp).text}
              </div>
            </div>

            <div style={{ background: 'var(--vi-surface-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--vi-border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--vi-text-secondary)' }}>TTFB (Server Response)</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vi-text-primary)', marginTop: '2px' }}>
                {webVitals.ttfb ? `${webVitals.ttfb} ms` : 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-subtext">Observing real-time Web Vitals metrics...</div>
        )}
      </div>

      {/* 6. Accessibility & Contrast Audit (axe-core) Card */}
      <div className="property-group-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div className="group-title" style={{ marginBottom: 0 }}>♿ Accessibility Audit (axe-core)</div>
          <button
            onClick={handleRunA11yAudit}
            className="btn-action-small"
            style={{ padding: '3px 8px', fontSize: '11px', background: isAuditing ? 'var(--vi-accent-base)' : 'var(--vi-surface-input)', color: '#ffffff' }}
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
                    background: a11yResult.violationsCount === 0 ? 'var(--vi-status-success-bg)' : 'var(--vi-status-danger-bg)',
                    color: a11yResult.violationsCount === 0 ? 'var(--vi-status-success)' : 'var(--vi-status-danger)',
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
                    background: 'var(--vi-accent-subtle)',
                    color: 'var(--vi-accent-base)',
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
                  color: copiedA11y ? 'var(--vi-status-success)' : 'var(--vi-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                {copiedA11y ? '✓ Copied!' : 'Copy Report'}
              </button>
            </div>

            {a11yResult.violations.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--vi-status-success)', textAlign: 'center', padding: '12px 0' }}>
                ✓ No WCAG 2.1 AA violations detected on page!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {a11yResult.violations.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      background: 'var(--vi-surface-base)',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--vi-border-subtle)',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--vi-text-primary)' }}>{v.help}</span>
                      <span
                        style={{
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '1px 4px',
                          borderRadius: '3px',
                          color: v.impact === 'critical' ? 'var(--vi-status-danger)' : 'var(--vi-status-warning)',
                        }}
                      >
                        {v.impact}
                      </span>
                    </div>
                    <div style={{ color: 'var(--vi-text-secondary)', marginBottom: '4px' }}>{v.description}</div>
                    <div style={{ fontSize: '10px', color: 'var(--vi-accent-base)', fontFamily: 'monospace' }}>
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

      {/* 7. BYOK Quick Assistant Configuration */}
      <div className="property-group-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div className="group-title" style={{ marginBottom: 0 }}>🤖 Bring-Your-Own-Key Assistant</div>
          <button
            onClick={() => setShowKeySettings(!showKeySettings)}
            style={{ background: 'transparent', border: 'none', color: 'var(--vi-text-secondary)', cursor: 'pointer', fontSize: '11px' }}
          >
            {showKeySettings ? 'Hide' : isApiKeySaved ? 'Configured ✓' : 'Configure'}
          </button>
        </div>

        {showKeySettings ? (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--vi-text-secondary)', marginBottom: '6px' }}>
              API keys are stored strictly in local browser storage (<code>chrome.storage.local</code>). Zero keys exist in the extension bundle.
            </div>
            <input
              type="password"
              placeholder="sk-... or AI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="vi-preset-input"
              style={{ width: '100%', marginBottom: '6px' }}
            />
            <button className="btn-action-small" onClick={handleSaveApiKey} style={{ width: '100%' }}>
              Save Key to Local Storage
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--vi-text-muted)' }}>
            {isApiKeySaved
              ? 'Local AI key configured. Agents with MCP have direct native access.'
              : 'Optional: add an API key for standalone browser chat without the local bridge.'}
          </div>
        )}
      </div>

      {/* 8. Screenshot Section */}
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

      {/* 9. Page-Wide Style Changes */}
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

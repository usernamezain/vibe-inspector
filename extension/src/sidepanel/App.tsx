import React, { useState, useEffect } from 'react';
import { ElementInfo, ExtensionMessage } from '@vibe-inspector/shared';
import './styles.css';

export default function App() {
  const [isPicking, setIsPicking] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [copiedSource, setCopiedSource] = useState(false);
  // ponytail: bridge status toggle will be driven by ws connection in Phase 3
  const [bridgeStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // Check initial picker status on mount and listen for runtime messages
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PICKER_STATUS' }, (res) => {
      if (res && typeof res.active === 'boolean') {
        setIsPicking(res.active);
      }
    });

    const messageHandler = (message: ExtensionMessage) => {
      if (message.type === 'ELEMENT_SELECTED') {
        setSelectedElement(message.element);
        setIsPicking(false);
      } else if (message.type === 'PICKER_STATUS') {
        setIsPicking(message.active);
      }
    };

    chrome.runtime.onMessage.addListener(messageHandler);
    return () => {
      chrome.runtime.onMessage.removeListener(messageHandler);
    };
  }, []);

  const handleTogglePicker = () => {
    if (isPicking) {
      chrome.runtime.sendMessage({ type: 'STOP_PICKING' }, () => {
        setIsPicking(false);
      });
    } else {
      chrome.runtime.sendMessage({ type: 'START_PICKING' }, () => {
        setIsPicking(true);
      });
    }
  };

  const handleClear = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_SELECTION' });
    setSelectedElement(null);
  };

  const handleHighlight = () => {
    if (!selectedElement) return;
    chrome.runtime.sendMessage({
      type: 'HIGHLIGHT_ELEMENT',
      selector: selectedElement.selector,
      dataAt: selectedElement.sourceLocation ? `${selectedElement.sourceLocation.file}:${selectedElement.sourceLocation.line}` : undefined,
      label: selectedElement.elementName.primary,
    });
  };

  const copyToClipboard = (text: string, type: 'selector' | 'source') => {
    navigator.clipboard.writeText(text);
    if (type === 'selector') {
      setCopiedSelector(true);
      setTimeout(() => setCopiedSelector(false), 1500);
    } else {
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 1500);
    }
  };

  const renderColorSwatch = (val: string) => {
    if (/^(#|rgb|rgba|hsl)/i.test(val)) {
      return <span className="color-swatch" style={{ backgroundColor: val }} />;
    }
    return null;
  };

  return (
    <div className="panel-container">
      {/* Top Header */}
      <header className="panel-header">
        <div className="brand-section">
          <div className="brand-icon">V</div>
          <span className="brand-title">Vibe Inspector</span>
        </div>
        <div className="bridge-status-pill">
          <span className={`bridge-dot ${bridgeStatus === 'connected' ? 'connected' : ''}`} />
          <span>{bridgeStatus === 'connected' ? 'Agent Connected' : 'Bridge Standby'}</span>
        </div>
      </header>

      {/* Main Picker Action Bar */}
      <div className="picker-bar">
        <button
          className={`btn-inspect ${isPicking ? 'active' : ''}`}
          onClick={handleTogglePicker}
        >
          {isPicking ? (
            <>
              <span>🔍</span>
              <span>Picking... (Esc to exit)</span>
            </>
          ) : (
            <>
              <span>🎯</span>
              <span>Inspect Element</span>
            </>
          )}
        </button>
        {selectedElement && (
          <button className="btn-clear" onClick={handleClear} title="Clear selected element">
            Clear
          </button>
        )}
      </div>

      {/* Empty State */}
      {!selectedElement && (
        <div className="empty-state">
          <div className="empty-icon-wrap">👆</div>
          <div className="empty-title">Select an Element</div>
          <div className="empty-desc">
            Click <strong>Inspect Element</strong> above and click any element on the page, or let your AI agent pick one via MCP.
          </div>
          <div className="empty-shortcuts">
            <div className="shortcut-row">
              <span>Cancel inspection</span>
              <kbd>ESC</kbd>
            </div>
            <div className="shortcut-row">
              <span>Inspect element</span>
              <kbd>Click</kbd>
            </div>
            <div className="shortcut-row">
              <span>Source detection</span>
              <span style={{ color: 'var(--brand-primary)', fontWeight: 500 }}>Vite / React / Next</span>
            </div>
          </div>
        </div>
      )}

      {/* Inspected Element Details */}
      {selectedElement && (
        <div className="content-scroll">
          {/* Hero Card */}
          <div className="element-hero-card">
            <div className="element-top-meta">
              <span className="term-badge">{selectedElement.uiTerm}</span>
              <span className="dim-badge">
                {Math.round(selectedElement.boundingRect.width)} × {Math.round(selectedElement.boundingRect.height)} px
              </span>
            </div>
            <div className="element-primary-name">{selectedElement.elementName.primary}</div>
            <div className="element-tag-sub">
              &lt;{selectedElement.tag}&gt;
              {selectedElement.id ? ` #${selectedElement.id}` : ''}
              {selectedElement.classList.length > 0 ? ` .${selectedElement.classList.slice(0, 3).join('.')}` : ''}
            </div>
            <div className="element-actions-row">
              <button className="btn-action-small" onClick={handleHighlight}>
                <span>📍</span>
                <span>Highlight in Page</span>
              </button>
              <button
                className="btn-action-small"
                onClick={() => copyToClipboard(selectedElement.selector, 'selector')}
              >
                <span>📋</span>
                <span>{copiedSelector ? 'Copied!' : 'Copy Selector'}</span>
              </button>
            </div>
          </div>

          {/* Source Location */}
          <div className="section-card">
            <div className="section-label">Source Code Location</div>
            {selectedElement.sourceLocation ? (
              <div className="source-location-row">
                <span className="source-path" title={`${selectedElement.sourceLocation.file}:${selectedElement.sourceLocation.line}`}>
                  {selectedElement.sourceLocation.file}:{selectedElement.sourceLocation.line}
                </span>
                <button
                  className={`btn-copy-code ${copiedSource ? 'copied' : ''}`}
                  onClick={() =>
                    copyToClipboard(
                      `${selectedElement.sourceLocation!.file}:${selectedElement.sourceLocation!.line}`,
                      'source'
                    )
                  }
                >
                  {copiedSource ? 'Copied' : 'Copy'}
                </button>
              </div>
            ) : (
              <div className="source-unmapped">
                Unmapped · Production or uninstrumented page (no build-time source markers detected)
              </div>
            )}
          </div>

          {/* CSS Selector Bar */}
          <div className="section-card">
            <div className="section-label">
              <span>CSS Selector</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Unique</span>
            </div>
            <div className="code-box-row">
              <span className="code-text" title={selectedElement.selector}>
                {selectedElement.selector}
              </span>
              <button
                className={`btn-copy-code ${copiedSelector ? 'copied' : ''}`}
                onClick={() => copyToClipboard(selectedElement.selector, 'selector')}
              >
                {copiedSelector ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* DOM Hierarchy Breadcrumbs */}
          {selectedElement.parentChain && selectedElement.parentChain.length > 0 && (
            <div className="section-card">
              <div className="section-label">DOM Hierarchy</div>
              <div className="breadcrumbs-container">
                {selectedElement.parentChain
                  .slice()
                  .reverse()
                  .map((segment, idx) => (
                    <React.Fragment key={idx}>
                      <span className="breadcrumb-item">{segment}</span>
                      <span className="breadcrumb-sep">&gt;</span>
                    </React.Fragment>
                  ))}
                <span className="breadcrumb-item active">{selectedElement.tag}</span>
              </div>
            </div>
          )}

          {/* Text Content Snippet */}
          {selectedElement.textContent && (
            <div className="section-card">
              <div className="section-label">Text Content</div>
              <div className="text-preview">{selectedElement.textContent}</div>
            </div>
          )}

          {/* Computed Styles Summary */}
          <div className="section-card">
            <div className="section-label">Key Computed Styles</div>
            <div className="styles-grid">
              {selectedElement.computedStyles.display && (
                <div className="style-cell">
                  <span className="style-prop">Display</span>
                  <span className="style-val">{selectedElement.computedStyles.display}</span>
                </div>
              )}
              {selectedElement.computedStyles.position && (
                <div className="style-cell">
                  <span className="style-prop">Position</span>
                  <span className="style-val">{selectedElement.computedStyles.position}</span>
                </div>
              )}
              {selectedElement.computedStyles.backgroundColor && (
                <div className="style-cell">
                  <span className="style-prop">Background</span>
                  <span className="style-val">
                    {renderColorSwatch(selectedElement.computedStyles.backgroundColor)}
                    {selectedElement.computedStyles.backgroundColor}
                  </span>
                </div>
              )}
              {selectedElement.computedStyles.color && (
                <div className="style-cell">
                  <span className="style-prop">Color</span>
                  <span className="style-val">
                    {renderColorSwatch(selectedElement.computedStyles.color)}
                    {selectedElement.computedStyles.color}
                  </span>
                </div>
              )}
              {selectedElement.computedStyles.fontSize && (
                <div className="style-cell">
                  <span className="style-prop">Font Size</span>
                  <span className="style-val">{selectedElement.computedStyles.fontSize}</span>
                </div>
              )}
              {selectedElement.computedStyles.fontWeight && (
                <div className="style-cell">
                  <span className="style-prop">Font Weight</span>
                  <span className="style-val">{selectedElement.computedStyles.fontWeight}</span>
                </div>
              )}
              {selectedElement.computedStyles.borderRadius && (
                <div className="style-cell">
                  <span className="style-prop">Border Radius</span>
                  <span className="style-val">{selectedElement.computedStyles.borderRadius}</span>
                </div>
              )}
              {selectedElement.computedStyles.padding && (
                <div className="style-cell">
                  <span className="style-prop">Padding</span>
                  <span className="style-val">{selectedElement.computedStyles.padding}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

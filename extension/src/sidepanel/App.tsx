import { useState, useEffect } from 'react';
import { ElementInfo, ExtensionMessage, AnnotationItem, AnnotationGroup } from '@vibe-inspector/shared';
import { useLiveStyles } from './hooks/useLiveStyles';
import { useBridgeClient } from './hooks/useBridgeClient';
import { EditTab } from './components/EditTab';
import { PageTab } from './components/PageTab';
import { CSSTab } from './components/CSSTab';
import { PinsTab } from './components/PinsTab';
import { BridgeWizardModal } from './components/BridgeWizardModal';
import './styles.css';

type TabType = 'edit' | 'page' | 'pins' | 'css';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const [isPicking, setIsPicking] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Phase 5 Annotations & Marquee State
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<AnnotationGroup | null>(null);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const [pageUrl, setPageUrl] = useState(window.location.href);
  const [panelError, setPanelError] = useState<string | null>(null);

  const {
    modifiedStyles,
    applyStyle,
    undo,
    redo,
    canUndo,
    canRedo,
    resetElement,
    resetAll,
  } = useLiveStyles();

  const {
    isConnected,
    port,
    setPort,
    token,
    setToken,
    connectionError,
    connect,
    disconnect,
    pendingApproval,
    approveMutation,
    rejectMutation,
  } = useBridgeClient({
    selectedElement,
    onApplyStyle: (prop, val) => {
      if (selectedElement) {
        applyStyle(selectedElement.selector, prop, val);
      }
    },
    onClearSelection: () => setSelectedElement(null),
    onHighlight: (selector, label) => {
      chrome.runtime.sendMessage({
        type: 'HIGHLIGHT_ELEMENT',
        selector,
        label,
      });
    },
  });

  // Query active tab helper
  const sendTabMessage = (msg: ExtensionMessage, callback?: (res: any) => void) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, msg, (res) => {
          if (chrome.runtime?.lastError) {
            return;
          }
          callback?.(res);
        });
      }
    });
  };

  // Check initial picker status on mount and listen for runtime messages
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PICKER_STATUS' }, (res) => {
      if (chrome.runtime?.lastError) return;
      if (res && typeof res.active === 'boolean') {
        setIsPicking(res.active);
      }
    });

    // Query active tab annotations & url
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) setPageUrl(tab.url);
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_ANNOTATIONS' }, (res) => {
          if (chrome.runtime?.lastError) return;
          if (res?.annotations) setAnnotations(res.annotations);
        });
      }
    });

    const messageHandler = (message: ExtensionMessage) => {
      if (message.type === 'ELEMENT_SELECTED') {
        setSelectedElement(message.element);
        if (message.element.pageUrl) setPageUrl(message.element.pageUrl);
        setIsPicking(false);
        setPanelError(null);
        setActiveTab('edit');
      } else if (message.type === 'PICKER_STATUS') {
        setIsPicking(message.active);
      } else if (message.type === 'ANNOTATIONS_UPDATED') {
        setAnnotations(message.annotations);
      } else if (message.type === 'GROUP_SELECTED') {
        setSelectedGroup(message.group);
        setIsMarqueeActive(false);
        setActiveTab('pins');
      }
    };

    chrome.runtime.onMessage.addListener(messageHandler);
    return () => {
      chrome.runtime.onMessage.removeListener(messageHandler);
    };
  }, []);

  const handleTogglePicker = () => {
    setPanelError(null);
    if (isPicking) {
      chrome.runtime.sendMessage({ type: 'STOP_PICKING' }, () => {
        setIsPicking(false);
      });
    } else {
      chrome.runtime.sendMessage({ type: 'START_PICKING' }, (res) => {
        if (chrome.runtime?.lastError) {
          setIsPicking(false);
          setPanelError(chrome.runtime.lastError.message || 'Failed to start inspector.');
          return;
        }
        if (res && !res.success) {
          setIsPicking(false);
          setPanelError(res.error || 'Cannot inspect this page.');
        } else {
          setIsPicking(true);
        }
      });
    }
  };

  const handleClear = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_SELECTION' });
    setSelectedElement(null);
  };

  const handleHighlight = (selector?: string, label?: string) => {
    const targetSel = selector || selectedElement?.selector;
    if (!targetSel) return;
    chrome.runtime.sendMessage({
      type: 'HIGHLIGHT_ELEMENT',
      selector: targetSel,
      dataAt: selectedElement?.sourceLocation
        ? `${selectedElement.sourceLocation.file}:${selectedElement.sourceLocation.line}`
        : undefined,
      label: label || selectedElement?.elementName.primary,
    });
  };

  // Phase 5 Annotation Handlers
  const handleToggleMarquee = () => {
    if (isMarqueeActive) {
      sendTabMessage({ type: 'STOP_MARQUEE_SELECT' }, () => setIsMarqueeActive(false));
    } else {
      sendTabMessage({ type: 'START_MARQUEE_SELECT' }, () => setIsMarqueeActive(true));
    }
  };

  const handleAddAnnotation = (comment: string) => {
    if (!selectedElement) return;
    sendTabMessage(
      {
        type: 'ADD_ANNOTATION',
        annotation: {
          selector: selectedElement.selector,
          comment,
          elementName: selectedElement.elementName.primary,
          tagName: selectedElement.tag,
          textContent: selectedElement.textContent,
          sourceLocation: selectedElement.sourceLocation,
        },
      },
      (res) => {
        if (res?.annotation) {
          setAnnotations((prev) => [...prev, res.annotation]);
        }
      }
    );
  };

  const handleResolveAnnotation = (id: string, note?: string) => {
    sendTabMessage({ type: 'RESOLVE_ANNOTATION', id, note }, (res) => {
      if (res?.annotation) {
        setAnnotations((prev) =>
          prev.map((a) => (a.id === id ? res.annotation : a))
        );
      }
    });
  };

  const handleReopenAnnotation = (id: string) => {
    sendTabMessage({ type: 'REOPEN_ANNOTATION', id }, (res) => {
      if (res?.annotation) {
        setAnnotations((prev) =>
          prev.map((a) => (a.id === id ? res.annotation : a))
        );
      }
    });
  };

  const handleDeleteAnnotation = (id: string) => {
    sendTabMessage({ type: 'DELETE_ANNOTATION', id }, () => {
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
    });
  };

  const handleClearAllAnnotations = () => {
    sendTabMessage({ type: 'CLEAR_ALL_ANNOTATIONS' }, () => {
      setAnnotations([]);
    });
  };

  // Modifications for the currently selected element
  const currentElementModifications = selectedElement
    ? modifiedStyles[selectedElement.selector] || {}
    : {};
  const currentElementModCount = Object.keys(currentElementModifications).length;
  const totalPageModCount = Object.keys(modifiedStyles).length;
  const openPinsCount = annotations.filter((a) => a.status === 'open').length;

  return (
    <div className="panel-container">
      {/* Top Header */}
      <header className="panel-header">
        <div className="brand-section">
          <div className="brand-icon">V</div>
          <span className="brand-title">Vibe Inspector</span>
        </div>
        <div
          className="bridge-status-pill clickable"
          onClick={() => setIsWizardOpen(true)}
          title="Click to configure Local Bridge connection"
          style={{ cursor: 'pointer' }}
        >
          <span className={`bridge-dot ${isConnected ? 'connected' : ''}`} />
          <span style={{ fontWeight: 600 }}>{isConnected ? 'Agent Connected' : 'Agent Disconnected'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.7 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </span>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span>Picking... (Esc to exit)</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="22" y1="12" x2="18" y2="12"/>
                <line x1="6" y1="12" x2="2" y2="12"/>
                <line x1="12" y1="6" x2="12" y2="2"/>
                <line x1="12" y1="22" x2="12" y2="18"/>
              </svg>
              <span>Inspect Element</span>
            </>
          )}
        </button>
        {selectedElement && (
          <button className="btn-clear" onClick={handleClear} title="Clear selected element">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Clear</span>
          </button>
        )}
      </div>

      {panelError && (
        <div
          style={{
            margin: '0 var(--panel-padding, 12px) 10px',
            padding: '8px 10px',
            background: '#f4f4f5',
            border: '1px solid #000000',
            borderRadius: '4px',
            color: '#09090b',
            fontSize: '11px',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', color: '#09090b', marginTop: '1px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          <div style={{ flex: 1 }}>{panelError}</div>
          <button
            onClick={() => setPanelError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#09090b',
              cursor: 'pointer',
              padding: '0 2px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            title="Dismiss notice"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Navigation Tabs (Edit / Page / Pins / CSS) */}
      <nav className="tabs-nav">
        <button
          className={`tab-nav-btn ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <span>Edit</span>
          {currentElementModCount > 0 && (
            <span className="tab-badge">{currentElementModCount}</span>
          )}
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'page' ? 'active' : ''}`}
          onClick={() => setActiveTab('page')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span>Page</span>
          {totalPageModCount > 0 && (
            <span className="tab-badge">{totalPageModCount}</span>
          )}
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'pins' ? 'active' : ''}`}
          onClick={() => setActiveTab('pins')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>Pins</span>
          {openPinsCount > 0 && (
            <span className="tab-badge">{openPinsCount}</span>
          )}
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'css' ? 'active' : ''}`}
          onClick={() => setActiveTab('css')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <span>CSS</span>
        </button>
      </nav>

      {/* Tab Panels */}
      <div className="content-scroll">
        {activeTab === 'edit' && (
          <>
            {!selectedElement ? (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l7 18 3-7 7-3L3 3z"/>
                    <path d="M13 13l6 6"/>
                  </svg>
                </div>
                <div className="empty-title">Select an Element to Edit</div>
                <div className="empty-desc">
                  Click <strong>Inspect Element</strong> above and select any UI element to tweak its appearance, typography, spacing, or layout.
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
                    <span>Undo change</span>
                    <kbd>Ctrl + Z</kbd>
                  </div>
                  <div className="shortcut-row">
                    <span>Redo change</span>
                    <kbd>Ctrl + Y</kbd>
                  </div>
                </div>
              </div>
            ) : (
              <EditTab
                element={selectedElement}
                modifiedProps={currentElementModifications}
                onApplyStyle={(prop, val, oldVal) =>
                  applyStyle(selectedElement.selector, prop, val, oldVal)
                }
                onUndo={undo}
                onRedo={redo}
                onResetElement={() => resetElement(selectedElement.selector)}
                canUndo={canUndo}
                canRedo={canRedo}
                onHighlight={handleHighlight}
              />
            )}
          </>
        )}

        {activeTab === 'page' && (
          <PageTab
            modifiedStyles={modifiedStyles}
            onResetAll={resetAll}
            onResetElement={resetElement}
          />
        )}

        {activeTab === 'pins' && (
          <PinsTab
            element={selectedElement}
            annotations={annotations}
            selectedGroup={selectedGroup}
            pageUrl={pageUrl}
            isMarqueeActive={isMarqueeActive}
            onToggleMarquee={handleToggleMarquee}
            onAddAnnotation={handleAddAnnotation}
            onResolveAnnotation={handleResolveAnnotation}
            onReopenAnnotation={handleReopenAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onClearAll={handleClearAllAnnotations}
            onClearGroup={() => setSelectedGroup(null)}
            onHighlight={handleHighlight}
          />
        )}

        {activeTab === 'css' && (
          <CSSTab
            element={selectedElement}
            modifiedStyles={modifiedStyles}
            onApplyStyle={(prop, val, oldVal) => {
              if (selectedElement) {
                applyStyle(selectedElement.selector, prop, val, oldVal);
              }
            }}
          />
        )}
      </div>

      {/* Bridge Connection Wizard & Mutation Approval Modal */}
      <BridgeWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        isConnected={isConnected}
        port={port}
        token={token}
        connectionError={connectionError}
        onPortChange={setPort}
        onTokenChange={setToken}
        onConnect={() => connect(port, token)}
        onDisconnect={disconnect}
        pendingApproval={pendingApproval}
        onApprove={approveMutation}
        onReject={rejectMutation}
      />
    </div>
  );
}

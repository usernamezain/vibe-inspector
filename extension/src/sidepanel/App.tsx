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
          <span>{isConnected ? 'Agent Connected' : 'Bridge Standby'}</span>
          <span style={{ fontSize: '9px', opacity: 0.6 }}>⚙</span>
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

      {panelError && (
        <div
          style={{
            margin: '0 var(--panel-padding, 12px) 10px',
            padding: '8px 10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '6px',
            color: '#f87171',
            fontSize: '11px',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '13px', lineHeight: 1 }}>⚠️</span>
          <div style={{ flex: 1 }}>{panelError}</div>
          <button
            onClick={() => setPanelError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              padding: '0 2px',
              fontSize: '12px',
              lineHeight: 1,
            }}
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs (Edit / Page / Pins / CSS) */}
      <nav className="tabs-nav">
        <button
          className={`tab-nav-btn ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          <span>✏️ Edit</span>
          {currentElementModCount > 0 && (
            <span className="tab-badge">{currentElementModCount}</span>
          )}
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'page' ? 'active' : ''}`}
          onClick={() => setActiveTab('page')}
        >
          <span>🌐 Page</span>
          {totalPageModCount > 0 && (
            <span className="tab-badge">{totalPageModCount}</span>
          )}
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'pins' ? 'active' : ''}`}
          onClick={() => setActiveTab('pins')}
        >
          <span>📌 Pins</span>
          {openPinsCount > 0 && (
            <span className="tab-badge">{openPinsCount}</span>
          )}
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'css' ? 'active' : ''}`}
          onClick={() => setActiveTab('css')}
        >
          <span>💻 CSS</span>
        </button>
      </nav>

      {/* Tab Panels */}
      <div className="content-scroll">
        {activeTab === 'edit' && (
          <>
            {!selectedElement ? (
              <div className="empty-state">
                <div className="empty-icon-wrap">👆</div>
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

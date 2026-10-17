import { useState, useEffect } from 'react';
import { ElementInfo, ExtensionMessage } from '@vibe-inspector/shared';
import { useLiveStyles } from './hooks/useLiveStyles';
import { EditTab } from './components/EditTab';
import { PageTab } from './components/PageTab';
import { CSSTab } from './components/CSSTab';
import './styles.css';

type TabType = 'edit' | 'page' | 'css';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const [isPicking, setIsPicking] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  // ponytail: bridge status toggle will be driven by ws connection in Phase 3
  const [bridgeStatus] = useState<'connected' | 'disconnected'>('disconnected');

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
        setActiveTab('edit');
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
      dataAt: selectedElement.sourceLocation
        ? `${selectedElement.sourceLocation.file}:${selectedElement.sourceLocation.line}`
        : undefined,
      label: selectedElement.elementName.primary,
    });
  };

  // Modifications for the currently selected element
  const currentElementModifications = selectedElement
    ? modifiedStyles[selectedElement.selector] || {}
    : {};
  const currentElementModCount = Object.keys(currentElementModifications).length;
  const totalPageModCount = Object.keys(modifiedStyles).length;

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

      {/* Navigation Tabs (Edit / Page / CSS) */}
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
    </div>
  );
}

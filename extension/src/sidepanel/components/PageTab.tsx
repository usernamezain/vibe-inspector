import { useState, useEffect, type FC } from 'react';
import { PageInfo } from '@vibe-inspector/shared';

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

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PAGE_INFO' }, (info) => {
      if (info) setPageInfo(info);
    });
  }, []);

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

  const modifiedSelectors = Object.keys(modifiedStyles);

  return (
    <div className="tab-pane-content">
      {/* Page Info Card */}
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

      {/* Screenshot Section */}
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

      {/* Page-Wide Changes */}
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

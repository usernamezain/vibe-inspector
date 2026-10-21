import { ExtensionMessage } from '@vibe-inspector/shared';

// Enable side panel on extension icon click
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.warn('[Vibe Inspector Background] Failed to set side panel behavior:', err));
  }
});

// Helper to get the current active tab reliably from side panel or background
async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const lastFocused = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (lastFocused[0]) return lastFocused[0];
  } catch {}
  try {
    const current = await chrome.tabs.query({ active: true, currentWindow: true });
    if (current[0]) return current[0];
  } catch {}
  try {
    const all = await chrome.tabs.query({ active: true });
    return all[0] || null;
  } catch {
    return null;
  }
}

// Check if a URL is an internal or restricted browser page
function isRestrictedUrl(url?: string): boolean {
  if (!url) return false;
  const restrictedProtocols = [
    'chrome:',
    'chrome-extension:',
    'devtools:',
    'edge:',
    'about:',
    'view-source:',
    'chrome-untrusted:',
    'chrome-search:',
  ];
  try {
    const parsed = new URL(url);
    return restrictedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Ensure content script is injected into the active tab before sending a message
async function ensureContentScriptInjected(tabId: number, url?: string): Promise<{ ok: boolean; error?: string }> {
  if (url && isRestrictedUrl(url)) {
    return {
      ok: false,
      error: 'Cannot inspect browser internal pages (e.g. chrome://, edge://, about:blank). Please navigate to any web page (http:// or https://) or localhost.',
    };
  }

  try {
    // Ping content script
    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_PICKER_STATUS' });
    if (response) return { ok: true };
  } catch {
    // Content script not answering; inject dynamically
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['assets/content.js'],
    });
    // Brief settle delay
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { ok: true };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.warn('[Vibe Inspector Background] Failed to inject content script:', errorMsg);
    return {
      ok: false,
      error: errorMsg.includes('Cannot access')
        ? 'Cannot inspect this page. Chrome restricts extension access on browser internal pages and the Web Store.'
        : errorMsg,
    };
  }
}

// Central message router
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'START_PICKING': {
        const tab = await getActiveTab();
        if (tab?.id) {
          const res = await ensureContentScriptInjected(tab.id, tab.url);
          if (res.ok) {
            chrome.tabs.sendMessage(tab.id, { type: 'START_PICKING' }).catch(() => {});
            sendResponse({ success: true });
            return;
          }
          sendResponse({ success: false, error: res.error || 'Cannot inject script on this page.' });
          return;
        }
        sendResponse({ success: false, error: 'No active web page tab found. Please open a web page.' });
        break;
      }

      case 'STOP_PICKING': {
        const tab = await getActiveTab();
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'STOP_PICKING' }).catch(() => {});
          sendResponse({ success: true });
          return;
        }
        sendResponse({ success: false });
        break;
      }

      case 'GET_PICKER_STATUS': {
        const tab = await getActiveTab();
        if (tab?.id) {
          try {
            const status = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PICKER_STATUS' });
            sendResponse(status);
            return;
          } catch {
            sendResponse({ active: false });
            return;
          }
        }
        sendResponse({ active: false });
        break;
      }

      case 'HIGHLIGHT_ELEMENT': {
        const tab = await getActiveTab();
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
          sendResponse({ success: true });
          return;
        }
        sendResponse({ success: false });
        break;
      }

      case 'CLEAR_SELECTION':
      case 'RESET_LIVE_STYLES':
      case 'APPLY_LIVE_STYLE':
      case 'SELECT_BY_SELECTOR':
      case 'FORCE_PSEUDO_STATE':
      case 'TOGGLE_ELEMENT_DIFF':
      case 'EXPORT_ELEMENT_PNG': {
        const tab = await getActiveTab();
        if (tab?.id) {
          try {
            const res = await chrome.tabs.sendMessage(tab.id, message);
            sendResponse(res || { success: true });
            return;
          } catch (err: any) {
            sendResponse({ success: false, error: err?.message || 'Message dispatch failed' });
            return;
          }
        }
        sendResponse({ success: false, error: 'No active tab found' });
        break;
      }

      case 'GET_PAGE_INFO': {
        const tab = await getActiveTab();
        if (tab?.id) {
          sendResponse({
            url: tab.url || '',
            title: tab.title || '',
            viewport: { width: tab.width || 1280, height: tab.height || 800 },
            timestamp: new Date().toISOString(),
          });
          return;
        }
        sendResponse(null);
        break;
      }

      case 'CAPTURE_TAB_PNG':
      case 'CAPTURE_SCREENSHOT': {
        const tab = await getActiveTab();
        const winId = tab?.windowId;
        try {
          const dataUrl = winId
            ? await chrome.tabs.captureVisibleTab(winId, { format: 'png' })
            : await chrome.tabs.captureVisibleTab({ format: 'png' });
          sendResponse({ success: true, dataUrl });
          return;
        } catch (err) {
          try {
            const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
            sendResponse({ success: true, dataUrl });
            return;
          } catch (fallbackErr) {
            sendResponse({ success: false, error: String(fallbackErr || err) });
            return;
          }
        }
      }

      case 'DOWNLOAD_PNG': {
        const { dataUrl, filename } = message as any;
        if (!dataUrl) {
          sendResponse({ success: false, error: 'No dataUrl provided' });
          return;
        }
        const name = filename || `snapshot-${Date.now()}.png`;

        if (chrome.downloads?.download) {
          chrome.downloads.download(
            {
              url: dataUrl,
              filename: name,
              saveAs: false,
            },
            (downloadId) => {
              if (chrome.runtime.lastError) {
                // If native downloads had an error, fallback to page DOM trigger
                getActiveTab().then((tab) => {
                  if (tab?.id) {
                    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_PAGE_DOWNLOAD', dataUrl, filename: name }, sendResponse);
                  } else {
                    sendResponse({ success: false, error: chrome.runtime.lastError?.message });
                  }
                });
              } else {
                sendResponse({ success: true, downloadId });
              }
            }
          );
          return;
        }

        // Fallback: send message to content script
        const tab = await getActiveTab();
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_PAGE_DOWNLOAD', dataUrl, filename: name }, sendResponse);
          return;
        }
        sendResponse({ success: false, error: 'No active tab found for download' });
        break;
      }

      case 'ELEMENT_SELECTED':
      case 'ELEMENT_HOVERED':
      case 'PICKER_STATUS': {
        // Forward content script notifications to the side panel
        // Messages are automatically broadcast to all runtime listeners (such as sidepanel)
        break;
      }
    }
  })();

  return true; // Keep message channel open for async response
});

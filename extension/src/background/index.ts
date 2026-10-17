import { ExtensionMessage } from '@vibe-inspector/shared';

// Enable side panel on extension icon click
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.warn('[Vibe Inspector Background] Failed to set side panel behavior:', err));
  }
});

// Helper to get the current active tab
async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
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
      case 'APPLY_LIVE_STYLE': {
        const tab = await getActiveTab();
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
          sendResponse({ success: true });
          return;
        }
        sendResponse({ success: false });
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
        if (tab?.windowId) {
          try {
            const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
            sendResponse({ success: true, dataUrl });
            return;
          } catch (err) {
            sendResponse({ success: false, error: String(err) });
            return;
          }
        }
        sendResponse({ success: false, error: 'No active window found' });
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

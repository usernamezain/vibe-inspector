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

// Ensure content script is injected into the active tab before sending a message
async function ensureContentScriptInjected(tabId: number): Promise<boolean> {
  try {
    // Ping content script
    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_PICKER_STATUS' });
    if (response) return true;
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
    return true;
  } catch (err) {
    console.error('[Vibe Inspector Background] Failed to inject content script:', err);
    return false;
  }
}

// Central message router
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'START_PICKING': {
        const tab = await getActiveTab();
        if (tab?.id) {
          const injected = await ensureContentScriptInjected(tab.id);
          if (injected) {
            chrome.tabs.sendMessage(tab.id, { type: 'START_PICKING' }).catch(() => {});
            sendResponse({ success: true });
            return;
          }
        }
        sendResponse({ success: false, error: 'No active tab or cannot inject script on this page.' });
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

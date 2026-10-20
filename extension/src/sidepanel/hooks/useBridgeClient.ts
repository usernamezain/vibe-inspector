import { useState, useEffect, useRef, useCallback } from 'react';
import { ElementInfo, BridgeMessage } from '@vibe-inspector/shared';

interface UseBridgeClientProps {
  selectedElement: ElementInfo | null;
  onApplyStyle: (property: string, value: string) => void;
  onClearSelection: () => void;
  onHighlight: (selector?: string, label?: string) => void;
}

export interface PendingApproval {
  id: string;
  action: string;
  selector: string;
  property: string;
  value: string;
}

export function useBridgeClient({
  selectedElement,
  onApplyStyle,
  onClearSelection,
  onHighlight,
}: UseBridgeClientProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [port, setPort] = useState(7890);
  const [token, setToken] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const selectedElementRef = useRef<ElementInfo | null>(selectedElement);
  selectedElementRef.current = selectedElement;
  const shouldReconnectRef = useRef<boolean>(true);
  const reconnectTimerRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<any>(null);

  // Connect to the 127.0.0.1 WebSocket bridge with robust lifecycle management
  const connect = useCallback((targetPort = port, targetToken = token) => {
    shouldReconnectRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    const cleanToken = (targetToken || '').trim();
    if (!cleanToken) {
      setConnectionError('Token is required. Run the bridge CLI to get your token.');
      return;
    }

    setConnectionError(null);
    const url = `ws://127.0.0.1:${targetPort}?token=${encodeURIComponent(cleanToken)}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);

        // Persist verified working credentials
        try {
          chrome.storage.local.set({
            vibe_bridge_port: targetPort,
            vibe_bridge_token: cleanToken,
          });
        } catch {}

        // Start 12s client heartbeat to prevent browser/TCP idle timeout
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({
                id: crypto.randomUUID(),
                type: 'HEARTBEAT',
                timestamp: Date.now(),
              }));
            } catch {}
          }
        }, 12000);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }

        // Silent automatic reconnect every 3s if unexpected disconnection occurs
        if (shouldReconnectRef.current && cleanToken) {
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              connect(targetPort, cleanToken);
            }, 3000);
          }
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        if (!shouldReconnectRef.current) {
          setConnectionError('Could not connect to bridge at ws://127.0.0.1:' + targetPort);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as BridgeMessage;
          handleBridgeRequest(ws, msg);
        } catch (err) {
          console.error('[Vibe Inspector Bridge Client] Parse error:', err);
        }
      };
    } catch (err) {
      setConnectionError(String(err));
    }
  }, [port, token]);

  // Load saved connection settings from storage and auto-connect on mount
  useEffect(() => {
    try {
      chrome.storage.local.get(['vibe_bridge_port', 'vibe_bridge_token'], (res) => {
        const savedPort = res?.vibe_bridge_port || 7890;
        const savedToken = (res?.vibe_bridge_token || '').trim();
        if (savedPort) setPort(savedPort);
        if (savedToken) {
          setToken(savedToken);
          // Auto-connect with saved token
          connect(savedPort, savedToken);
        }
      });
    } catch {}

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Broadcast element selection updates to connected bridge
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const msg: BridgeMessage = {
          id: crypto.randomUUID(),
          type: 'SELECTION_CHANGED',
          payload: selectedElement,
          timestamp: Date.now(),
        };
        wsRef.current.send(JSON.stringify(msg));
      } catch (err) {
        console.warn('[Vibe Inspector Bridge Client] Failed to broadcast selection:', err);
      }
    }
  }, [selectedElement]);

  // Handle incoming RPC requests from the bridge
  const handleBridgeRequest = (ws: WebSocket, msg: BridgeMessage) => {
    const sendReply = (payload: any, error?: string) => {
      const reply: BridgeMessage = {
        id: msg.id,
        type: `${msg.type}_RESPONSE`,
        payload,
        error,
        timestamp: Date.now(),
      };
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(reply));
      }
    };

    switch (msg.type) {
      case 'GET_SELECTION':
        sendReply(selectedElementRef.current);
        break;

      case 'CLEAR_SELECTION':
        onClearSelection();
        sendReply({ success: true });
        break;

      case 'HIGHLIGHT_ELEMENT':
        onHighlight(msg.payload?.selector, msg.payload?.label);
        sendReply({ success: true });
        break;

      case 'GET_PAGE_INFO':
        chrome.runtime.sendMessage({ type: 'GET_PAGE_INFO' }, (info) => {
          sendReply(info);
        });
        break;

      case 'CAPTURE_SCREENSHOT':
        chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, (res) => {
          sendReply(res);
        });
        break;

      case 'APPLY_STYLE': {
        // Enforce Interactive User Approval Gate for write/mutation tools
        const { selector, property, value } = msg.payload || {};
        if (selector && property && value !== undefined) {
          setPendingApproval({
            id: msg.id,
            action: 'Apply CSS Mutation',
            selector,
            property,
            value,
          });
        } else {
          sendReply(null, 'Missing selector, property, or value in style request.');
        }
        break;
      }

      case 'GET_ANNOTATIONS': {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId) {
              chrome.tabs.sendMessage(tabId, { type: 'GET_ANNOTATIONS' }, (res) => {
                sendReply(res?.annotations || []);
              });
            } else {
              sendReply([]);
            }
          });
        } catch {
          sendReply([]);
        }
        break;
      }

      case 'RESOLVE_ANNOTATION': {
        const { id, index, note } = msg.payload || {};
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId) {
              chrome.tabs.sendMessage(
                tabId,
                { type: 'RESOLVE_ANNOTATION', id, index, note },
                (res) => {
                  sendReply(res);
                }
              );
            } else {
              sendReply({ success: false, error: 'No active tab found' });
            }
          });
        } catch (err) {
          sendReply({ success: false, error: String(err) });
        }
        break;
      }

      case 'GET_COMPUTED_STYLES': {
        sendReply(selectedElementRef.current?.computedStyles || {});
        break;
      }

      case 'AUDIT_ACCESSIBILITY': {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId) {
              chrome.tabs.sendMessage(
                tabId,
                { type: 'RUN_A11Y_AUDIT', selector: msg.payload?.selector },
                (res) => {
                  sendReply(res);
                }
              );
            } else {
              sendReply({ violationsCount: 0, passesCount: 0, violations: [] });
            }
          });
        } catch (err) {
          sendReply(null, String(err));
        }
        break;
      }

      case 'GET_WEB_VITALS': {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId) {
              chrome.tabs.sendMessage(tabId, { type: 'GET_WEB_VITALS' }, (res) => {
                sendReply(res?.vitals || {});
              });
            } else {
              sendReply({});
            }
          });
        } catch (err) {
          sendReply(null, String(err));
        }
        break;
      }

      case 'SELECT_BY_SELECTOR':
      case 'SELECT_RELATIVE':
      case 'GET_ELEMENT_TREE':
      case 'GET_BOX_MODEL':
      case 'GET_LAYOUT_INFO':
      case 'GET_STACKING_INFO':
      case 'GET_ACCESSIBILITY_INFO':
      case 'FORCE_PSEUDO_STATE':
      case 'ASSERT_STYLE':
      case 'CHECK_CONTRAST':
      case 'CHECK_TAP_TARGETS':
      case 'GET_PAGE_DESIGN_DATA':
      case 'EXPORT_ELEMENT_PNG':
      case 'SET_RESPONSIVE_WIDTH': {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId) {
              chrome.tabs.sendMessage(tabId, { type: msg.type, ...msg.payload }, (res) => {
                sendReply(res);
              });
            } else {
              sendReply({ success: false, error: 'No active tab found' });
            }
          });
        } catch (err) {
          sendReply({ success: false, error: String(err) });
        }
        break;
      }

      case 'REVERT_CHANGES': {
        setPendingApproval({
          id: msg.id,
          action: 'Revert Changes',
          selector: msg.payload?.selector || 'All elements',
          property: 'all',
          value: 'revert',
        });
        break;
      }

      case 'APPLY_PRESET': {
        setPendingApproval({
          id: msg.id,
          action: `Apply Preset '${msg.payload?.presetName}'`,
          selector: msg.payload?.selector || selectedElementRef.current?.selector || 'Selected element',
          property: 'preset',
          value: msg.payload?.presetName || '',
        });
        break;
      }

      case 'SAVE_PRESET': {
        try {
          chrome.storage.local.get(['vibe_presets'], (res) => {
            const list = res?.vibe_presets || [];
            const newPreset = {
              id: `preset-${Date.now()}`,
              name: msg.payload?.name || 'Preset',
              styles: msg.payload?.styles || {},
              createdAt: new Date().toISOString(),
            };
            chrome.storage.local.set({ vibe_presets: [...list, newPreset] }, () => {
              sendReply({ success: true, preset: newPreset });
            });
          });
        } catch (err) {
          sendReply({ success: false, error: String(err) });
        }
        break;
      }

      case 'LIST_PRESETS': {
        try {
          chrome.storage.local.get(['vibe_presets'], (res) => {
            sendReply({ presets: res?.vibe_presets || [] });
          });
        } catch (err) {
          sendReply({ presets: [] });
        }
        break;
      }

      case 'OPEN_IN_EDITOR': {
        const { file, line, column } = msg.payload || {};
        setPendingApproval({
          id: msg.id,
          action: 'Open in Editor',
          selector: file || '',
          property: 'line:col',
          value: `${line || 1}${column ? `:${column}` : ''}`,
        });
        break;
      }

      default:
        sendReply(null, `Unknown bridge request type: ${msg.type}`);
    }
  };

  // User Approval Decisions
  const approveMutation = useCallback(() => {
    if (!pendingApproval || !wsRef.current) return;
    onApplyStyle(pendingApproval.property, pendingApproval.value);

    const reply: BridgeMessage = {
      id: pendingApproval.id,
      type: 'APPLY_STYLE_RESPONSE',
      payload: { success: true, approved: true },
      timestamp: Date.now(),
    };
    wsRef.current.send(JSON.stringify(reply));
    setPendingApproval(null);
  }, [pendingApproval, onApplyStyle]);

  const rejectMutation = useCallback(() => {
    if (!pendingApproval || !wsRef.current) return;

    const reply: BridgeMessage = {
      id: pendingApproval.id,
      type: 'APPLY_STYLE_RESPONSE',
      payload: { success: false, approved: false },
      error: 'Style modification was rejected by the user in Chrome.',
      timestamp: Date.now(),
    };
    wsRef.current.send(JSON.stringify(reply));
    setPendingApproval(null);
  }, [pendingApproval]);

  return {
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
  };
}

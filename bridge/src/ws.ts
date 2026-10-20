import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';
import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';
import { BridgeMessage } from '@vibe-inspector/shared';
import { validateConnection } from './auth.js';

export interface BridgeServerOptions {
  host?: string;
  port: number;
  token: string;
  allowedExtensionId?: string;
}

export class BridgeWebSocketServer extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private httpServer: http.Server | null = null;
  private activeClient: WebSocket | null = null;
  private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timer: NodeJS.Timeout }>();
  private readonly options: BridgeServerOptions;

  constructor(options: BridgeServerOptions) {
    super();
    // Non-negotiable security: bind strictly to 127.0.0.1
    this.options = {
      ...options,
      host: '127.0.0.1',
    };
  }

  public async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer((_req, res) => {
        // Plain HTTP requests to the bridge port receive 403 Forbidden
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Direct HTTP access forbidden. Connect via WebSocket from authorized Chrome Extension.' }));
      });

      this.wss = new WebSocketServer({
        noServer: true,
      });

      // Handle HTTP upgrade with strict security validation
      this.httpServer.on('upgrade', (request, socket, head) => {
        const origin = request.headers['origin'] as string | undefined;
        const validation = validateConnection(
          request.url,
          origin,
          this.options.token,
          this.options.allowedExtensionId
        );

        if (!validation.authorized) {
          console.warn(`[Vibe Inspector Bridge] Blocked connection: ${validation.reason}`);
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit('connection', ws, request);
        });
      });

      this.wss.on('connection', (ws) => {
        console.log('[Vibe Inspector Bridge] Chrome Extension connected.');
        this.activeClient = ws;
        this.emit('client_connected');

        ws.on('message', (data) => {
          try {
            const raw = typeof data === 'string' ? data : data.toString('utf-8');
            const msg = JSON.parse(raw) as BridgeMessage;
            if (msg.type === 'HEARTBEAT') {
              return;
            }
            this.handleIncomingMessage(msg);
          } catch (err) {
            console.error('[Vibe Inspector Bridge] Failed to parse client message:', err);
          }
        });

        // 15s server ping keepalive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.ping();
            } catch {}
          } else {
            clearInterval(pingInterval);
          }
        }, 15000);

        ws.on('close', () => {
          clearInterval(pingInterval);
          console.log('[Vibe Inspector Bridge] Chrome Extension disconnected.');
          if (this.activeClient === ws) {
            this.activeClient = null;
          }
          this.emit('client_disconnected');
        });

        ws.on('error', (err) => {
          console.error('[Vibe Inspector Bridge] WebSocket error:', err);
        });
      });

      this.httpServer.on('error', (err) => {
        reject(err);
      });

      this.httpServer.listen(this.options.port, '127.0.0.1', () => {
        const addr = this.httpServer!.address();
        const actualPort = typeof addr === 'object' && addr ? addr.port : this.options.port;
        resolve(actualPort);
      });
    });
  }

  public isConnected(): boolean {
    return this.activeClient !== null && this.activeClient.readyState === WebSocket.OPEN;
  }

  /**
   * Dispatches an RPC request to the connected Chrome Extension and awaits response
   */
  public async sendRequest<T = any>(type: string, payload?: any, timeoutMs = 8000): Promise<T> {
    if (!this.activeClient || this.activeClient.readyState !== WebSocket.OPEN) {
      throw new Error('Chrome Extension is not connected to the local bridge. Please open Chrome and ensure Vibe Inspector is active.');
    }

    const id = crypto.randomUUID();
    const msg: BridgeMessage = {
      id,
      type,
      payload,
      timestamp: Date.now(),
    };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Bridge request '${type}' timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      try {
        this.activeClient!.send(JSON.stringify(msg));
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      }
    });
  }

  /**
   * Processes incoming message: checks if it matches a pending RPC or is an unsolicited event
   */
  private handleIncomingMessage(msg: BridgeMessage) {
    if (this.pendingRequests.has(msg.id)) {
      const { resolve, reject, timer } = this.pendingRequests.get(msg.id)!;
      clearTimeout(timer);
      this.pendingRequests.delete(msg.id);

      if (msg.error) {
        reject(new Error(msg.error));
      } else {
        resolve(msg.payload);
      }
      return;
    }

    // Broadcast notifications from extension
    this.emit(msg.type, msg.payload);
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const [id, req] of this.pendingRequests.entries()) {
        clearTimeout(req.timer);
        req.reject(new Error('Bridge server shutting down'));
        this.pendingRequests.delete(id);
      }

      if (this.wss) {
        this.wss.close();
      }
      if (this.httpServer) {
        this.httpServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}

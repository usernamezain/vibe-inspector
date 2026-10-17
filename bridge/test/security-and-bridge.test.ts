import { describe, it, expect, afterAll } from 'vitest';
import { validateConnection, getOrCreateAuthToken } from '../src/auth.js';
import { BridgeWebSocketServer } from '../src/ws.js';
import { WebSocket } from 'ws';

describe('Phase 3: Bridge Authentication & Origin Security', () => {
  const secretToken = '0123456789abcdef0123456789abcdef';

  it('rejects connection if Origin header is missing', () => {
    const res = validateConnection('http://127.0.0.1:7890?token=' + secretToken, undefined, secretToken);
    expect(res.authorized).toBe(false);
    expect(res.reason).toContain('Missing Origin header');
  });

  it('rejects connection from web origins (http, https, null)', () => {
    const origins = ['http://evil.com', 'https://malicious.org', 'null', 'file://'];
    for (const origin of origins) {
      const res = validateConnection('http://127.0.0.1:7890?token=' + secretToken, origin, secretToken);
      expect(res.authorized).toBe(false);
      expect(res.reason).toContain('Forbidden Origin');
    }
  });

  it('rejects connection if token is missing or incorrect', () => {
    const origin = 'chrome-extension://abcdefghijklmnop';

    // Missing token
    const res1 = validateConnection('http://127.0.0.1:7890', origin, secretToken);
    expect(res1.authorized).toBe(false);

    // Wrong token
    const res2 = validateConnection('http://127.0.0.1:7890?token=wrongtoken', origin, secretToken);
    expect(res2.authorized).toBe(false);
    expect(res2.reason).toContain('Invalid authentication token');
  });

  it('authorizes connection with valid chrome-extension Origin and matching token', () => {
    const origin = 'chrome-extension://abcdefghijklmnop';
    const res = validateConnection(`http://127.0.0.1:7890?token=${secretToken}`, origin, secretToken);
    expect(res.authorized).toBe(true);
  });

  it('enforces allowedExtensionId if configured', () => {
    const correctOrigin = 'chrome-extension://trusted-ext-id';
    const wrongOrigin = 'chrome-extension://untrusted-ext-id';

    const resValid = validateConnection(
      `http://127.0.0.1:7890?token=${secretToken}`,
      correctOrigin,
      secretToken,
      'trusted-ext-id'
    );
    expect(resValid.authorized).toBe(true);

    const resInvalid = validateConnection(
      `http://127.0.0.1:7890?token=${secretToken}`,
      wrongOrigin,
      secretToken,
      'trusted-ext-id'
    );
    expect(resInvalid.authorized).toBe(false);
    expect(resInvalid.reason).toContain('Extension ID mismatch');
  });

  it('generates a 48-character hex cryptographic token if none provided', () => {
    const token = getOrCreateAuthToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(32);
  });
});

describe('Phase 3: WebSocket Live Server Integration', () => {
  let server: BridgeWebSocketServer;
  let port: number;
  const testToken = 'test-token-1234567890abcdef123456';

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  it('starts on 127.0.0.1 on dynamic port and rejects unauthorized clients', async () => {
    server = new BridgeWebSocketServer({
      port: 0, // OS assigns available ephemeral port
      token: testToken,
    });
    port = await server.start();
    expect(port).toBeGreaterThan(0);

    // 1. Web origin attempt -> Must fail
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${testToken}`, {
        headers: { Origin: 'http://malicious-website.com' },
      });

      ws.on('error', () => {
        // Expected error due to HTTP 401 rejection
        resolve();
      });

      ws.on('open', () => {
        ws.close();
        throw new Error('Web origin should NOT be allowed to connect!');
      });
    });

    // 2. Authorized Chrome Extension connection -> Must succeed and process RPC
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${testToken}`, {
        headers: { Origin: 'chrome-extension://vibe-inspector-test-id' },
      });

      ws.on('open', async () => {
        expect(server.isConnected()).toBe(true);

        // Listen for server request
        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'GET_SELECTION') {
            // Respond with mock element
            ws.send(
              JSON.stringify({
                id: msg.id,
                type: 'SELECTION_RESPONSE',
                payload: {
                  tag: 'button',
                  selector: '#checkout-btn',
                  elementName: { primary: 'Checkout Button' },
                },
                timestamp: Date.now(),
              })
            );
          }
        });

        // Server initiates request to client
        try {
          const selection = await server.sendRequest<any>('GET_SELECTION');
          expect(selection).toBeDefined();
          expect(selection.selector).toBe('#checkout-btn');
          ws.close();
          resolve();
        } catch (err) {
          ws.close();
          reject(err);
        }
      });

      ws.on('error', (err) => {
        reject(err);
      });
    });

    // 3. Annotation RPC flow -> Handles GET_ANNOTATIONS and RESOLVE_ANNOTATION
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${testToken}`, {
        headers: { Origin: 'chrome-extension://vibe-inspector-test-id' },
      });

      ws.on('open', async () => {
        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'GET_ANNOTATIONS') {
            ws.send(
              JSON.stringify({
                id: msg.id,
                type: 'GET_ANNOTATIONS_RESPONSE',
                payload: [
                  {
                    id: 'pin-1',
                    index: 1,
                    selector: '.hero-btn',
                    status: 'open',
                    comment: 'Make font bold',
                  },
                ],
                timestamp: Date.now(),
              })
            );
          } else if (msg.type === 'RESOLVE_ANNOTATION') {
            ws.send(
              JSON.stringify({
                id: msg.id,
                type: 'RESOLVE_ANNOTATION_RESPONSE',
                payload: { success: true },
                timestamp: Date.now(),
              })
            );
          }
        });

        try {
          const annotations = await server.sendRequest<any[]>('GET_ANNOTATIONS');
          expect(annotations).toHaveLength(1);
          expect(annotations[0].comment).toBe('Make font bold');

          const resolveRes = await server.sendRequest<any>('RESOLVE_ANNOTATION', { index: 1, note: 'Done' });
          expect(resolveRes.success).toBe(true);

          ws.close();
          resolve();
        } catch (err) {
          ws.close();
          reject(err);
        }
      });

      ws.on('error', (err) => reject(err));
    });

    // 4. Advanced Integrations RPC flow -> Handles AUDIT_ACCESSIBILITY and GET_WEB_VITALS
    await new Promise<void>((resolve, reject) => {

      const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${testToken}`, {
        headers: { Origin: 'chrome-extension://vibe-inspector-test-id' },
      });

      ws.on('open', async () => {
        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'AUDIT_ACCESSIBILITY') {
            ws.send(
              JSON.stringify({
                id: msg.id,
                type: 'AUDIT_ACCESSIBILITY_RESPONSE',
                payload: {
                  violationsCount: 1,
                  passesCount: 14,
                  violations: [
                    {
                      id: 'color-contrast',
                      impact: 'serious',
                      description: 'Elements must have sufficient color contrast',
                      help: 'Elements must have sufficient color contrast',
                      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
                      nodes: [{ html: '<button class="low-contrast">', target: ['.low-contrast'] }],
                    },
                  ],
                  timestamp: new Date().toISOString(),
                },
                timestamp: Date.now(),
              })
            );
          } else if (msg.type === 'GET_WEB_VITALS') {
            ws.send(
              JSON.stringify({
                id: msg.id,
                type: 'GET_WEB_VITALS_RESPONSE',
                payload: {
                  lcp: 1420,
                  cls: 0.04,
                  fcp: 850,
                  ttfb: 120,
                },
                timestamp: Date.now(),
              })
            );
          }
        });

        try {
          const a11y = await server.sendRequest<any>('AUDIT_ACCESSIBILITY');
          expect(a11y.violationsCount).toBe(1);
          expect(a11y.violations[0].id).toBe('color-contrast');

          const vitals = await server.sendRequest<any>('GET_WEB_VITALS');
          expect(vitals.lcp).toBe(1420);
          expect(vitals.cls).toBe(0.04);

          ws.close();
          resolve();
        } catch (err) {
          ws.close();
          reject(err);
        }
      });

      ws.on('error', (err) => reject(err));
    });
  });
});



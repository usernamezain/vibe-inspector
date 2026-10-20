import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BridgeWebSocketServer } from '../bridge/src/ws.js';
import { registerBridgeTools } from '../bridge/src/tools.js';
import { ElementInfo, PageInfo, PageDesignSummary } from '@vibe-inspector/shared';

describe('Vibe Inspector MCP Test Bed: testing-website Integration', () => {
  let httpServer: http.Server;
  let httpPort: number;
  let wsServer: BridgeWebSocketServer;
  let wsPort: number;
  let mcpServer: McpServer;
  let clientWs: WebSocket;
  const authToken = 'test-token-vibe-inspector-testing-website-999';
  const extensionOrigin = 'chrome-extension://vibe-inspector-testbed-extension';

  // Read testing-website/index.html content
  const htmlPath = path.resolve(__dirname, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeAll(async () => {
    // 1. Start local HTTP server to host testing-website/index.html with permissive CORS headers
    await new Promise<void>((resolve) => {
      httpServer = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlContent);
      });
      httpServer.listen(0, '127.0.0.1', () => {
        const addr = httpServer.address();
        httpPort = typeof addr === 'object' && addr ? addr.port : 4567;
        resolve();
      });
    });

    // 2. Start authenticated Bridge WebSocket Server on dynamic port
    wsServer = new BridgeWebSocketServer({
      port: 0,
      token: authToken,
    });
    wsPort = await wsServer.start();

    // 3. Register all 36 MCP tools on McpServer
    mcpServer = new McpServer({
      name: 'vibe-inspector-testbed',
      version: '2.0.0',
    });
    registerBridgeTools(mcpServer, wsServer);

    // 4. Connect simulated Chrome Extension client
    await new Promise<void>((resolve, reject) => {
      clientWs = new WebSocket(`ws://127.0.0.1:${wsPort}?token=${authToken}`, {
        headers: { Origin: extensionOrigin },
      });

      clientWs.on('open', () => {
        // Setup mock extension response handler for testing-website DOM elements
        clientWs.on('message', (data) => {
          const msg = JSON.parse(data.toString());

          if (msg.type === 'GET_PAGE_INFO') {
            const pageInfo: PageInfo = {
              url: `http://127.0.0.1:${httpPort}/`,
              title: 'Vibe Inspector — Test Bed Site',
              domain: '127.0.0.1',
              pathname: '/',
              viewport: { width: 1280, height: 800, devicePixelRatio: 1 },
              isSecure: false,
              totalElements: 42,
              hasSelection: true,
              elementCount: 42,
              doctype: 'html',
              metaTags: {
                viewport: 'width=device-width, initial-scale=1.0',
              },
            };
            clientWs.send(JSON.stringify({ id: msg.id, type: 'PAGE_INFO_RESPONSE', payload: pageInfo }));
          } else if (msg.type === 'GET_SELECTION') {
            const selection: ElementInfo = {
              tag: 'button',
              id: 'btn-primary-action',
              classList: ['btn', 'btn-primary'],
              selector: '#btn-primary-action',
              uiTerm: 'Primary Call to Action Button',
              uiDescription: 'Hero action button styled with monochrome background',
              elementName: { primary: 'Pick Element Button', technical: 'button#btn-primary-action' },
              textContent: 'Pick Element',
              boundingRect: { x: 100, y: 220, width: 135, height: 44, top: 220, bottom: 264, left: 100, right: 235 },
              computedStyles: {
                'background-color': 'rgb(24, 24, 27)',
                'color': 'rgb(255, 255, 255)',
                'font-size': '14.4px',
                'font-weight': '600',
                'border-radius': '4px',
                'min-height': '44px',
                'min-width': '44px',
                'padding': '10px 18px',
                'display': 'inline-flex',
                'align-items': 'center',
                'justify-content': 'center',
              },
              sourceLocation: {
                file: 'src/components/Hero.tsx',
                line: 21,
                column: 7,
                componentName: 'Pick Element Button',
              },
              parentChain: ['html', 'body', 'main', 'section.hero', 'div.hero-actions'],
              boxModel: {
                margin: { top: 0, right: 0, bottom: 0, left: 0 },
                border: { top: 1, right: 1, bottom: 1, left: 1 },
                padding: { top: 10, right: 18, bottom: 10, left: 18 },
                content: { width: 97, height: 22 },
              },
            };
            clientWs.send(JSON.stringify({ id: msg.id, type: 'SELECTION_RESPONSE', payload: selection }));
          } else if (msg.type === 'GET_COMPUTED_STYLES') {
            clientWs.send(
              JSON.stringify({
                id: msg.id,
                type: 'COMPUTED_STYLES_RESPONSE',
                payload: {
                  'background-color': 'rgb(24, 24, 27)',
                  'color': 'rgb(255, 255, 255)',
                  'border-radius': '4px',
                  'min-height': '44px',
                },
              })
            );
          } else if (msg.type === 'GET_BOX_MODEL') {
            clientWs.send(
              JSON.stringify({
                id: msg.id,
                type: 'BOX_MODEL_RESPONSE',
                payload: {
                  margin: { top: 0, right: 0, bottom: 0, left: 0 },
                  border: { top: 1, right: 1, bottom: 1, left: 1 },
                  padding: { top: 10, right: 18, bottom: 10, left: 18 },
                  content: { width: 97, height: 22 },
                },
              })
            );
          } else if (msg.type === 'GET_PAGE_DESIGN_DATA') {
            const designSummary: PageDesignSummary = {
              colors: [
                { hex: '#ffffff', role: 'background', usageCount: 12 },
                { hex: '#09090b', role: 'text', usageCount: 20 },
                { hex: '#18181b', role: 'accent', usageCount: 6 },
              ],
              fonts: [
                { family: '-apple-system', weights: ['400', '600', '700'], usageCount: 30 },
              ],
              cssVariables: {
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f4f4f5',
                '--text-primary': '#09090b',
                '--accent-color': '#18181b',
                '--radius-sm': '4px',
                '--radius-md': '6px',
                '--space-md': '16px',
                '--space-xl': '32px',
              },
              spacingScale: {
                '4px': 8,
                '8px': 14,
                '16px': 22,
                '32px': 6,
              },
            };
            clientWs.send(
              JSON.stringify({
                id: msg.id,
                type: 'GET_PAGE_DESIGN_DATA_RESPONSE',
                payload: { success: true, data: designSummary },
              })
            );
          } else if (msg.type === 'CHECK_TAP_TARGETS') {
            clientWs.send(
              JSON.stringify({
                id: msg.id,
                type: 'CHECK_TAP_TARGETS_RESPONSE',
                payload: {
                  pass: true,
                  suboptimalTargets: [],
                  compliantCount: 4,
                },
              })
            );
          } else if (msg.type === 'AUDIT_A11Y') {
            clientWs.send(
              JSON.stringify({
                id: msg.id,
                type: 'AUDIT_A11Y_RESPONSE',
                payload: {
                  violationsCount: 0,
                  passesCount: 18,
                  violations: [],
                },
              })
            );
          } else if (msg.type === 'APPLY_STYLE_CHANGES') {
            clientWs.send(
              JSON.stringify({
                id: msg.id,
                type: 'APPLY_STYLE_CHANGES_RESPONSE',
                payload: {
                  success: true,
                  applied: msg.payload,
                  timestamp: Date.now(),
                },
              })
            );
          } else if (msg.type === 'GET_ANNOTATIONS') {
            clientWs.send(
              JSON.stringify({
                id: msg.id,
                type: 'GET_ANNOTATIONS_RESPONSE',
                payload: [
                  {
                    id: 'pin-testbed-1',
                    index: 1,
                    selector: '#card-selection',
                    comment: 'Verify monochrome hover state and 4px border radius',
                    status: 'open',
                    createdAt: Date.now(),
                  },
                ],
              })
            );
          }
        });

        resolve();
      });

      clientWs.on('error', reject);
    });
  });

  afterAll(async () => {
    if (clientWs) clientWs.close();
    if (wsServer) await wsServer.stop();
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });

  it('serves the testing website over local HTTP', async () => {
    const rawContent = await new Promise<string>((resolve, reject) => {
      http.get(`http://127.0.0.1:${httpPort}/`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    expect(rawContent).toContain('Vibe Inspector — Test Bed Site');
    expect(rawContent).toContain('Local Visual Inspection &amp; Agent Tooling');
    expect(rawContent).toContain('id="btn-primary-action"');
    expect(rawContent).toContain('data-source="src/components/Hero.tsx:21:7"');
  });

  it('connects MCP bridge and responds to get_page_info for testing-website', async () => {
    const tools = (mcpServer as any)._registeredTools;
    const getPageInfoTool = tools['get_page_info'];
    expect(getPageInfoTool).toBeDefined();

    const result = await getPageInfoTool.handler({});
    expect(result.content).toBeDefined();
    expect(result.content[0].text).toContain('Vibe Inspector — Test Bed Site');
    expect(result.content[0].text).toContain(`http://127.0.0.1:${httpPort}/`);
  });

  it('inspects selected DOM element on testing-website via get_selection', async () => {
    const tools = (mcpServer as any)._registeredTools;
    const getSelectionTool = tools['get_selection'];
    expect(getSelectionTool).toBeDefined();

    const result = await getSelectionTool.handler({});
    expect(result.content[0].text).toContain('#btn-primary-action');
    expect(result.content[0].text).toContain('<button>');
    expect(result.content[0].text).toContain('Pick Element');
    expect(result.content[0].text).toContain('src/components/Hero.tsx');
    expect(result.content[0].text).toContain('Line: 21');
    expect(result.content[0].text).toContain('rgb(24, 24, 27)');
  });

  it('resolves React component source location via resolve_source_location', async () => {
    const tools = (mcpServer as any)._registeredTools;
    const resolveSourceTool = tools['resolve_source_location'];
    expect(resolveSourceTool).toBeDefined();

    const result = await resolveSourceTool.handler({});
    expect(result.content[0].text).toContain('src/components/Hero.tsx');
    expect(result.content[0].text).toContain('"line": 21');
  });

  it('inspects computed CSS variables from testing-website via get_css_variables', async () => {
    const tools = (mcpServer as any)._registeredTools;
    const getCssVarsTool = tools['get_css_variables'];
    expect(getCssVarsTool).toBeDefined();

    const result = await getCssVarsTool.handler({});
    expect(result.content[0].text).toContain('--bg-primary');
    expect(result.content[0].text).toContain('--accent-color');
    expect(result.content[0].text).toContain('--radius-sm');
  });

  it('inspects element box model via get_box_model', async () => {
    const tools = (mcpServer as any)._registeredTools;
    const getBoxModelTool = tools['get_box_model'];
    expect(getBoxModelTool).toBeDefined();

    const result = await getBoxModelTool.handler({ selector: '#btn-primary-action' });
    expect(result.content[0].text).toContain('"padding"');
    expect(result.content[0].text).toContain('"border"');
  });

  it('audits accessibility and tap targets on testing-website via check_tap_targets', async () => {
    const tools = (mcpServer as any)._registeredTools;
    const checkTapTargetsTool = tools['check_tap_targets'];
    expect(checkTapTargetsTool).toBeDefined();

    const result = await checkTapTargetsTool.handler({});
    expect(result.content[0].text).toContain('Touch Target Analysis');
    expect(result.content[0].text).toContain('"pass": true');
  });

  it('exports style changes to CSS and Tailwind utilities', async () => {
    const tools = (mcpServer as any)._registeredTools;

    // CSS Export
    const changesToCssTool = tools['changes_to_css'];
    const cssResult = await changesToCssTool.handler({
      selector: '#btn-primary-action',
    });
    expect(cssResult.content[0].text).toContain('#btn-primary-action');
    expect(cssResult.content[0].text).toContain('background-color: rgb(24, 24, 27)');

    // Tailwind Export
    const changesToTailwindTool = tools['changes_to_tailwind'];
    const twResult = await changesToTailwindTool.handler({});
    expect(twResult.content[0].text).toBeDefined();
    expect(twResult.content[0].text).toContain('Synthesized Tailwind Classes');
  });

  it('lists visual annotations on testing-website and formats agent prompt', async () => {
    const tools = (mcpServer as any)._registeredTools;
    const listAnnotationsTool = tools['list_annotations'];
    const annotationsToPromptTool = tools['annotations_to_prompt'];

    const listRes = await listAnnotationsTool.handler({});
    expect(listRes.content[0].text).toContain('#card-selection');
    expect(listRes.content[0].text).toContain('Verify monochrome hover state');

    const promptRes = await annotationsToPromptTool.handler({});
    expect(promptRes.content[0].text).toContain('#card-selection');
  });
});

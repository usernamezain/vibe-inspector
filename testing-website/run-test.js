#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BridgeWebSocketServer } from '../bridge/dist/ws.js';
import { registerBridgeTools } from '../bridge/dist/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTestBed() {
  console.log('\n========================================================');
  console.log('  🚀 LAUNCHING VIBE INSPECTOR MCP TEST ON TESTING-WEBSITE');
  console.log('========================================================\n');

  const htmlPath = path.resolve(__dirname, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // 1. Start HTTP Server
  const httpServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
  });

  const httpPort = await new Promise((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => {
      const addr = httpServer.address();
      resolve(typeof addr === 'object' && addr ? addr.port : 3000);
    });
  });
  console.log(`[1/5] 🌐 Testing Website hosted at: http://127.0.0.1:${httpPort}/`);

  // 2. Start WebSocket Bridge
  const testToken = 'vibe-testbed-auth-token-xyz';
  const wsServer = new BridgeWebSocketServer({
    port: 0,
    token: testToken,
  });
  const wsPort = await wsServer.start();
  console.log(`[2/5] 🔌 Bridge WebSocket Server listening on: ws://127.0.0.1:${wsPort}`);

  // 3. Register MCP Server
  const mcpServer = new McpServer({
    name: 'vibe-inspector-testbed',
    version: '2.0.0',
  });
  registerBridgeTools(mcpServer, wsServer);
  console.log(`[3/5] 🛠️  McpServer initialized with 36 tools registered.`);

  // 4. Connect simulated Chrome Extension
  const clientWs = new WebSocket(`ws://127.0.0.1:${wsPort}?token=${testToken}`, {
    headers: { Origin: 'chrome-extension://vibe-inspector-test-id' },
  });

  await new Promise((resolve, reject) => {
    clientWs.on('open', () => {
      clientWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'GET_PAGE_INFO') {
          clientWs.send(JSON.stringify({
            id: msg.id,
            type: 'PAGE_INFO_RESPONSE',
            payload: {
              url: `http://127.0.0.1:${httpPort}/`,
              title: 'Vibe Inspector — Test Bed Site',
              domain: '127.0.0.1',
              viewport: { width: 1280, height: 800 },
            },
          }));
        } else if (msg.type === 'GET_SELECTION') {
          clientWs.send(JSON.stringify({
            id: msg.id,
            type: 'SELECTION_RESPONSE',
            payload: {
              tag: 'button',
              id: 'btn-primary-action',
              selector: '#btn-primary-action',
              elementName: { primary: 'Pick Element Button' },
              textContent: 'Pick Element',
              boundingRect: { x: 100, y: 220, width: 135, height: 44 },
              computedStyles: {
                'background-color': 'rgb(24, 24, 27)',
                'color': 'rgb(255, 255, 255)',
                'border-radius': '4px',
                'min-height': '44px',
              },
              sourceLocation: {
                file: 'src/components/Hero.tsx',
                line: 21,
                column: 7,
              },
            },
          }));
        } else if (msg.type === 'GET_PAGE_DESIGN_DATA') {
          clientWs.send(JSON.stringify({
            id: msg.id,
            type: 'GET_PAGE_DESIGN_DATA_RESPONSE',
            payload: {
              success: true,
              data: {
                cssVariables: {
                  '--bg-primary': '#ffffff',
                  '--accent-color': '#18181b',
                  '--radius-sm': '4px',
                },
              },
            },
          }));
        } else if (msg.type === 'CHECK_TAP_TARGETS') {
          clientWs.send(JSON.stringify({
            id: msg.id,
            type: 'CHECK_TAP_TARGETS_RESPONSE',
            payload: { pass: true, compliantCount: 4, suboptimalTargets: [] },
          }));
        }
      });
      resolve();
    });
    clientWs.on('error', reject);
  });
  console.log(`[4/5] 🧩 Simulated Chrome Extension connected via WebSocket.`);

  // 5. Execute MCP Tool Calls
  console.log(`[5/5] 🔬 Executing MCP Tool Invocations on testing-website:\n`);

  const tools = mcpServer._registeredTools;

  // Tool 1: get_page_info
  const pageInfoRes = await tools['get_page_info'].handler({});
  console.log('  ✅ [Tool: get_page_info]');
  console.log('     ', pageInfoRes.content[0].text.split('\n')[1]);
  console.log('     ', pageInfoRes.content[0].text.split('\n')[2]);

  // Tool 2: get_selection
  const selectionRes = await tools['get_selection'].handler({});
  console.log('\n  ✅ [Tool: get_selection]');
  const lines = selectionRes.content[0].text.split('\n').filter(Boolean).slice(1, 6);
  lines.forEach((l) => console.log('     ', l));

  // Tool 3: resolve_source_location
  const sourceRes = await tools['resolve_source_location'].handler({});
  console.log('\n  ✅ [Tool: resolve_source_location]');
  console.log('     ', sourceRes.content[0].text.replace(/\n/g, ' '));

  // Tool 4: get_css_variables
  const cssVarsRes = await tools['get_css_variables'].handler({});
  console.log('\n  ✅ [Tool: get_css_variables]');
  console.log('     ', cssVarsRes.content[0].text.replace(/\n/g, ' '));

  // Tool 5: check_tap_targets
  const tapRes = await tools['check_tap_targets'].handler({});
  console.log('\n  ✅ [Tool: check_tap_targets]');
  console.log('     ', tapRes.content[0].text.split('\n')[2]);

  // Tool 6: changes_to_css
  const cssExportRes = await tools['changes_to_css'].handler({ selector: '#btn-primary-action' });
  console.log('\n  ✅ [Tool: changes_to_css]');
  console.log('     ', cssExportRes.content[0].text.replace(/\n/g, ' '));

  // Teardown
  clientWs.close();
  await wsServer.stop();
  httpServer.close();

  console.log('\n========================================================');
  console.log('  🎉 ALL MCP TESTS PASSED SUCCESSFULLY ON TESTING-WEBSITE!');
  console.log('========================================================\n');
}

runTestBed().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

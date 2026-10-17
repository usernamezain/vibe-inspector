#!/usr/bin/env node
import { getOrCreateAuthToken } from './auth.js';
import { BridgeWebSocketServer } from './ws.js';
import { createMcpServer, startMcpStdio } from './server.js';

async function main() {
  const args = process.argv.slice(2);
  let port = 7890;
  let tokenArg: string | undefined;
  let allowedExtId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[i + 1], 10) || 7890;
      i++;
    } else if (args[i] === '--token' && args[i + 1]) {
      tokenArg = args[i + 1];
      i++;
    } else if (args[i] === '--allowed-extension-id' && args[i + 1]) {
      allowedExtId = args[i + 1];
      i++;
    }
  }

  const token = getOrCreateAuthToken(tokenArg);

  // Initialize and start authenticated WebSocket bridge on 127.0.0.1
  const wsServer = new BridgeWebSocketServer({
    port,
    token,
    allowedExtensionId: allowedExtId,
  });

  try {
    const actualPort = await wsServer.start();

    // Log diagnostic banner strictly to stderr so MCP JSON-RPC on stdout is not corrupted
    console.error('====================================================');
    console.error('  🎯 Vibe Inspector Local Bridge & MCP Server');
    console.error(`  Listening on: ws://127.0.0.1:${actualPort}`);
    console.error(`  Auth Token:   ${token}`);
    console.error('====================================================');
    console.error('  Enter this token into the Vibe Inspector Side Panel');
    console.error('  in Chrome to connect your visual browser session.');
    console.error('====================================================');

    // Create and start MCP server on stdio
    const mcpServer = createMcpServer(wsServer);
    await startMcpStdio(mcpServer);

    // Clean exit handlers
    const shutdown = async () => {
      console.error('[Vibe Inspector Bridge] Shutting down...');
      await wsServer.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[Vibe Inspector Bridge] Failed to start:', err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Vibe Inspector Bridge] Fatal error:', err);
  process.exit(1);
});

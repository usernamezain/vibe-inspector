import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BridgeWebSocketServer } from './ws.js';
import { registerBridgeTools } from './tools.js';

export function createMcpServer(wsServer: BridgeWebSocketServer): McpServer {
  const server = new McpServer({
    name: 'vibe-inspector',
    version: '1.0.0',
  });

  registerBridgeTools(server, wsServer);

  return server;
}

export async function startMcpStdio(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Vibe Inspector Bridge] MCP server connected via stdio transport.');
}

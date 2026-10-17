import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BridgeWebSocketServer } from '../src/ws.js';
import { registerBridgeTools } from '../src/tools.js';

describe('MCP Tools Registration & Security Catalog', () => {
  it('registers all 36 MCP tools across all 7 categories on McpServer', () => {
    const server = new McpServer({
      name: 'vibe-inspector-test',
      version: '2.0.0',
    });

    const mockWsServer = new BridgeWebSocketServer({
      port: 0,
      token: 'test-token',
    });

    // Register all tools
    registerBridgeTools(server, mockWsServer);

    // McpServer internal tools registry inspection
    // Check that server has registered tools
    const tools = (server as any)._registeredTools || (server as any).tools || {};
    const toolNames = Object.keys(tools);

    // Verify key tools from all 7 categories exist
    const expectedCatalog = [
      // 1. Selection & Inspection
      'get_selection',
      'get_selection_group',
      'select_by_selector',
      'select_relative',
      'get_element_tree',
      'get_computed_styles',
      'get_applied_rules',
      'get_box_model',
      'get_layout_info',
      'get_stacking_info',
      'force_pseudo_state',
      'get_accessibility_info',
      'clear_selection',
      'highlight_element',

      // 2. Page Diagnostics
      'get_page_info',
      'get_fonts_in_use',
      'get_color_palette',
      'get_css_variables',
      'get_spacing_scale',
      'screenshot',
      'capabilities_list',
      'bridge_status',

      // 3. Editing Tools
      'apply_style_changes',
      'revert_changes',
      'get_change_log',
      'apply_preset',
      'list_presets',
      'save_preset',
      'set_viewport_size',
      'export_element_png',

      // 4. Change Export Tools
      'changes_to_css',
      'changes_to_tailwind',
      'changes_to_react_style',
      'changes_to_prompt',

      // 5. Source & Verify Loop
      'resolve_source_location',
      'find_component',
      'open_in_editor',
      'wait_for_reload',
      'assert_style',
      'compare_before_after',

      // 6. Design QA
      'audit_accessibility',
      'check_contrast',
      'check_tap_targets',
      'check_spacing_consistency',
      'find_token_violations',
      'check_responsive',
      'get_web_vitals',

      // 7. Annotations
      'list_annotations',
      'add_annotation',
      'resolve_annotation',
      'reopen_annotation',
      'remove_annotation',
      'annotations_to_prompt',
    ];

    for (const toolName of expectedCatalog) {
      expect(toolNames, `Expected tool '${toolName}' to be registered`).toContain(toolName);
    }

    expect(toolNames.length).toBeGreaterThanOrEqual(36);
  });

  it('rejects calls gracefully when Chrome extension is not connected', async () => {
    const server = new McpServer({
      name: 'vibe-inspector-test',
      version: '2.0.0',
    });

    const mockWsServer = new BridgeWebSocketServer({
      port: 0,
      token: 'test-token',
    });

    registerBridgeTools(server, mockWsServer);

    const tools = (server as any)._registeredTools;
    const getSelectionTool = tools['get_selection'];
    expect(getSelectionTool).toBeDefined();

    // Execute tool handler when disconnected
    const result = await getSelectionTool.handler({});
    expect(result.content[0].text).toContain('Chrome Extension is not connected to the Vibe Inspector bridge');
  });
});

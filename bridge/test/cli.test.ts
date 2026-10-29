import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { detectFramework, configureAiAgents } from '../src/cli.js';

describe('Vibe Inspector CLI: Project & AI Agent Auto-Configuration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-cli-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('detects Next.js project correctly', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { next: '^14.0.0', react: '^18.0.0' } })
    );
    const fw = detectFramework(tmpDir);
    expect(fw.name).toBe('Next.js');
  });

  it('detects Vite project correctly', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { vite: '^5.0.0' } })
    );
    const fw = detectFramework(tmpDir);
    expect(fw.name).toBe('Vite');
  });

  it('detects Astro project correctly', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { astro: '^4.0.0' } })
    );
    const fw = detectFramework(tmpDir);
    expect(fw.name).toBe('Astro');
  });

  it('automatically configures Cursor .cursor/mcp.json in workspace', () => {
    const token = 'test-token-12345678901234567890';
    const port = 7890;
    const results = configureAiAgents(tmpDir, token, port);

    const cursorResult = results.find((r) => r.agent.includes('Cursor'));
    expect(cursorResult).toBeDefined();
    expect(cursorResult?.status).toBe('created');

    const cursorFile = path.join(tmpDir, '.cursor', 'mcp.json');
    expect(fs.existsSync(cursorFile)).toBe(true);

    const data = JSON.parse(fs.readFileSync(cursorFile, 'utf-8'));
    expect(data.mcpServers['vibe-inspector']).toBeDefined();
    expect(data.mcpServers['vibe-inspector'].command).toBe('vibe-inspector');
    expect(data.mcpServers['vibe-inspector'].args).toContain(token);
    expect(data.mcpServers['vibe-inspector'].args).toContain('7890');
  });

  it('merges with existing config without overwriting other MCP servers', () => {
    const cursorDir = path.join(tmpDir, '.cursor');
    fs.mkdirSync(cursorDir, { recursive: true });
    const cursorFile = path.join(cursorDir, 'mcp.json');

    fs.writeFileSync(
      cursorFile,
      JSON.stringify({
        mcpServers: {
          'existing-mcp-server': {
            command: 'node',
            args: ['server.js'],
          },
        },
      })
    );

    const token = 'test-token-98765432109876543210';
    const port = 8000;
    configureAiAgents(tmpDir, token, port);

    const data = JSON.parse(fs.readFileSync(cursorFile, 'utf-8'));
    expect(data.mcpServers['existing-mcp-server']).toBeDefined();
    expect(data.mcpServers['vibe-inspector']).toBeDefined();
    expect(data.mcpServers['vibe-inspector'].args).toContain('8000');
  });
});

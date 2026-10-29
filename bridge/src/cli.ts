#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { getOrCreateAuthToken } from './auth.js';
import { BridgeWebSocketServer } from './ws.js';
import { createMcpServer, startMcpStdio } from './server.js';

interface FrameworkInfo {
  name: string;
  devCommand: string;
  configFound?: string;
}

interface AgentConfigResult {
  agent: string;
  configPath: string;
  status: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
}

/**
 * Detects frontend framework in the target project directory
 */
export function detectFramework(cwd: string): FrameworkInfo {
  let pkg: any = {};
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    } catch {}
  }

  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  // Next.js
  if (allDeps['next'] || fs.existsSync(path.join(cwd, 'next.config.js')) || fs.existsSync(path.join(cwd, 'next.config.mjs')) || fs.existsSync(path.join(cwd, 'next.config.ts'))) {
    return { name: 'Next.js', devCommand: pkg.scripts?.dev ? 'npm run dev' : 'npx next dev' };
  }

  // Vite (React, Vue, Svelte, Vanilla)
  if (allDeps['vite'] || fs.existsSync(path.join(cwd, 'vite.config.ts')) || fs.existsSync(path.join(cwd, 'vite.config.js')) || fs.existsSync(path.join(cwd, 'vite.config.mjs'))) {
    return { name: 'Vite', devCommand: pkg.scripts?.dev ? 'npm run dev' : 'npx vite' };
  }

  // Astro
  if (allDeps['astro'] || fs.existsSync(path.join(cwd, 'astro.config.mjs')) || fs.existsSync(path.join(cwd, 'astro.config.ts'))) {
    return { name: 'Astro', devCommand: pkg.scripts?.dev ? 'npm run dev' : 'npx astro dev' };
  }

  // Nuxt
  if (allDeps['nuxt'] || fs.existsSync(path.join(cwd, 'nuxt.config.ts')) || fs.existsSync(path.join(cwd, 'nuxt.config.js'))) {
    return { name: 'Nuxt', devCommand: pkg.scripts?.dev ? 'npm run dev' : 'npx nuxt dev' };
  }

  // SvelteKit
  if (allDeps['@sveltejs/kit'] || fs.existsSync(path.join(cwd, 'svelte.config.js'))) {
    return { name: 'SvelteKit', devCommand: pkg.scripts?.dev ? 'npm run dev' : 'npx vite dev' };
  }

  // Remix
  if (allDeps['@remix-run/react'] || fs.existsSync(path.join(cwd, 'remix.config.js'))) {
    return { name: 'Remix', devCommand: pkg.scripts?.dev ? 'npm run dev' : 'npx remix dev' };
  }

  if (pkg.scripts?.dev) {
    return { name: 'Custom Node App', devCommand: 'npm run dev' };
  }

  return { name: 'Static / HTML Project', devCommand: 'npx serve .' };
}

/**
 * Automatically configures all detected AI agents to connect to Vibe Inspector MCP bridge
 */
export function configureAiAgents(cwd: string, token: string, port: number): AgentConfigResult[] {
  const results: AgentConfigResult[] = [];
  const mcpEntry = {
    command: 'vibe-inspector',
    args: ['--port', String(port), '--token', token],
  };

  const updateJsonMcpConfig = (filePath: string, agentName: string, rootKey: 'mcpServers' | 'mcp_servers' = 'mcpServers') => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let data: any = {};
      const exists = fs.existsSync(filePath);
      if (exists) {
        try {
          data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {
          data = {};
        }
      }

      if (!data[rootKey]) {
        data[rootKey] = {};
      }

      data[rootKey]['vibe-inspector'] = mcpEntry;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

      results.push({
        agent: agentName,
        configPath: filePath,
        status: exists ? 'updated' : 'created',
      });
    } catch (err: any) {
      results.push({
        agent: agentName,
        configPath: filePath,
        status: 'failed',
        error: err?.message || String(err),
      });
    }
  };

  // 1. Cursor (.cursor/mcp.json in workspace)
  const cursorPath = path.join(cwd, '.cursor', 'mcp.json');
  updateJsonMcpConfig(cursorPath, 'Cursor (.cursor/mcp.json)');

  // 2. Antigravity / Gemini Workspace / Project
  const antigravityLocalPath = path.join(cwd, '.gemini', 'mcp_config.json');
  const antigravityGlobalPath = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');
  if (fs.existsSync(path.dirname(antigravityGlobalPath))) {
    updateJsonMcpConfig(antigravityGlobalPath, 'Antigravity (Global)');
  } else {
    updateJsonMcpConfig(antigravityLocalPath, 'Antigravity (Local)');
  }

  // 3. Claude Desktop
  let claudeDesktopPath = '';
  if (process.platform === 'win32' && process.env.APPDATA) {
    claudeDesktopPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
  } else if (process.platform === 'darwin') {
    claudeDesktopPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else {
    claudeDesktopPath = path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
  }

  if (fs.existsSync(path.dirname(claudeDesktopPath))) {
    updateJsonMcpConfig(claudeDesktopPath, 'Claude Desktop');
  }

  // 4. Claude Code project configuration (.claude/mcp.json)
  const claudeCodePath = path.join(cwd, '.claude', 'mcp.json');
  updateJsonMcpConfig(claudeCodePath, 'Claude Code (.claude/mcp.json)');

  // 5. Windsurf (~/.codeium/windsurf/mcp_config.json)
  const windsurfPath = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
  if (fs.existsSync(path.dirname(windsurfPath))) {
    updateJsonMcpConfig(windsurfPath, 'Windsurf');
  }

  // 6. VS Code (.vscode/mcp.json or settings)
  const vscodeMcpPath = path.join(cwd, '.vscode', 'mcp.json');
  updateJsonMcpConfig(vscodeMcpPath, 'VS Code (.vscode/mcp.json)');

  return results;
}

/**
 * Run 'vibe-inspector init' in a project directory
 */
export async function runInit(cwd: string, options: { port?: number; token?: string } = {}) {
  console.log('\n🎯 Initializing Vibe Inspector for project in:\n   ' + cwd + '\n');

  const framework = detectFramework(cwd);
  console.log(`📦 Detected Framework: \x1b[36m${framework.name}\x1b[0m (Recommended dev runner: ${framework.devCommand})`);

  const port = options.port || 7890;
  const token = getOrCreateAuthToken(options.token);

  // 1. Configure AI agents
  console.log('\n🤖 Configuring AI Agent MCP connections...');
  const agentResults = configureAiAgents(cwd, token, port);
  for (const res of agentResults) {
    if (res.status === 'created' || res.status === 'updated') {
      console.log(`  \x1b[32m✓\x1b[0m ${res.agent}: ${res.status} (${path.relative(cwd, res.configPath) || res.configPath})`);
    } else if (res.status === 'failed') {
      console.log(`  \x1b[31m✗\x1b[0m ${res.agent}: ${res.error}`);
    }
  }

  // 2. Write .vibe-inspector.json
  const configPath = path.join(cwd, '.vibe-inspector.json');
  const projectConfig = {
    version: '1.0.0',
    port,
    token,
    framework: framework.name,
    devCommand: framework.devCommand,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2), 'utf-8');
  console.log(`\n  \x1b[32m✓\x1b[0m Project configuration written to .vibe-inspector.json`);

  // 3. Ensure .vibe-inspector.json is git-ignored
  const gitignorePath = path.join(cwd, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignoreContent.includes('.vibe-inspector.json')) {
      fs.appendFileSync(gitignorePath, '\n# Vibe Inspector local auth token\n.vibe-inspector.json\n');
      console.log(`  \x1b[32m✓\x1b[0m Added .vibe-inspector.json to .gitignore`);
    }
  }

  // 4. Instructions
  console.log('\n================================================================');
  console.log('  🎉 Vibe Inspector is ready for this project!');
  console.log('================================================================');
  console.log('\n🚀 Next Steps:');
  console.log('  1. Start your dev session with:');
  console.log('     \x1b[32mvibe-inspector dev\x1b[0m (or: \x1b[32mnpx vibe-inspector dev\x1b[0m)\n');
  console.log('  2. Open your web app in Google Chrome and click the');
  console.log('     \x1b[36mVibe Inspector Side Panel\x1b[0m icon to start inspecting elements!\n');
  console.log('  3. In your AI agent (Cursor, Claude, Antigravity, etc.), ask:');
  console.log('     \x1b[33m"Check the currently selected element in Vibe Inspector and update it."\x1b[0m\n');
}

/**
 * Run 'vibe-inspector dev' to start bridge and project dev server together
 */
export async function runDev(cwd: string, args: string[] = []) {
  let port = 7890;
  let token: string | undefined;

  // Try reading from .vibe-inspector.json
  const configPath = path.join(cwd, '.vibe-inspector.json');
  let devCommand: string | null = null;
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (cfg.port) port = cfg.port;
      if (cfg.token) token = cfg.token;
      if (cfg.devCommand) devCommand = cfg.devCommand;
    } catch {}
  }

  // CLI arg overrides
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[i + 1], 10) || 7890;
      i++;
    } else if (args[i] === '--token' && args[i + 1]) {
      token = args[i + 1];
      i++;
    }
  }

  const effectiveToken = getOrCreateAuthToken(token);

  // Start WebSocket bridge
  const wsServer = new BridgeWebSocketServer({
    port,
    token: effectiveToken,
  });

  const actualPort = await wsServer.start();

  console.log('\n================================================================');
  console.log('  🎯 Vibe Inspector Live Dev Environment');
  console.log('================================================================');
  console.log(`  🟢 WebSocket Bridge:  ws://127.0.0.1:${actualPort}`);
  console.log(`  🔑 Auth Token:        ${effectiveToken}`);
  console.log('  ⚡ AI Agents:         Cursor, Claude, Antigravity, Windsurf ready');
  console.log('================================================================\n');

  // Spawn project dev server concurrently if requested or present
  const noDev = args.includes('--no-dev') || args.includes('--bridge-only');
  if (!noDev && devCommand) {
    console.log(`🚀 Starting project dev server: \x1b[36m${devCommand}\x1b[0m\n`);
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'powershell.exe' : '/bin/sh';
    const devProc = spawn(shell, [isWindows ? '-Command' : '-c', devCommand], {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, VIBE_INSPECTOR_PORT: String(actualPort), VIBE_INSPECTOR_TOKEN: effectiveToken },
    });

    devProc.on('exit', (code) => {
      console.log(`[Vibe Inspector] Project dev process exited with code ${code}`);
    });
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[Vibe Inspector] Shutting down bridge...');
    await wsServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Run 'vibe-inspector doctor'
 */
export function runDoctor(cwd: string) {
  console.log('\n🩺 Vibe Inspector Doctor\n');
  console.log(`  • Node.js:  ${process.version} (✓)`);
  console.log(`  • Platform: ${process.platform} (${os.arch()})`);
  console.log(`  • Directory: ${cwd}`);

  const configPath = path.join(cwd, '.vibe-inspector.json');
  if (fs.existsSync(configPath)) {
    console.log(`  • Local Project Config: \x1b[32mFound\x1b[0m (.vibe-inspector.json)`);
  } else {
    console.log(`  • Local Project Config: \x1b[33mNot initialized\x1b[0m (Run 'vibe-inspector init')`);
  }

  const cursorPath = path.join(cwd, '.cursor', 'mcp.json');
  console.log(`  • Cursor Config: ${fs.existsSync(cursorPath) ? '\x1b[32mConfigured\x1b[0m' : '\x1b[33mNot found\x1b[0m'}`);

  console.log('\nDiagnosis complete. Run \x1b[32mvibe-inspector init\x1b[0m to configure any project.\n');
}

/**
 * Main CLI entry
 */
export async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const cwd = process.cwd();

  if (command === 'init' || command === 'setup') {
    await runInit(cwd);
  } else if (command === 'dev' || command === 'start') {
    await runDev(cwd, args.slice(1));
  } else if (command === 'doctor') {
    runDoctor(cwd);
  } else if (command === '--help' || command === '-h' || command === 'help') {
    console.log(`
Vibe Inspector CLI 🎯

Usage:
  vibe-inspector <command> [options]
  npx vibe-inspector <command> [options]

Commands:
  init, setup    Automatically configure any frontend project & AI agents in 1 step
  dev, start     Start the Vibe Inspector bridge and project dev server together
  doctor         Verify configuration, ports, and connected AI agents
  bridge         Start standalone MCP server over stdio / WebSocket

Options:
  --port <port>   Specify custom WebSocket port (default: 7890)
  --token <token> Specify custom auth token
  --no-dev        In 'dev' mode, start only the bridge without spawning project dev server
  --help, -h      Show this help message
`);
  } else {
    // If no command specified or flags given, check if running in bridge mode or interactive init
    if (args.includes('--port') || args.includes('--token') || process.env.MCP_STDIO === 'true') {
      // Delegate to standard bridge execution (index.js logic)
      let port = 7890;
      let tokenArg: string | undefined;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--port' && args[i + 1]) {
          port = parseInt(args[i + 1], 10) || 7890;
          i++;
        } else if (args[i] === '--token' && args[i + 1]) {
          tokenArg = args[i + 1];
          i++;
        }
      }
      const token = getOrCreateAuthToken(tokenArg);
      const wsServer = new BridgeWebSocketServer({ port, token });
      const actualPort = await wsServer.start();
      console.error(`[Vibe Inspector Bridge] ws://127.0.0.1:${actualPort} | Token: ${token}`);
      const mcpServer = createMcpServer(wsServer);
      await startMcpStdio(mcpServer);
    } else {
      // Prompt user or run init
      console.log('No command specified. Running initialization...');
      await runInit(cwd);
    }
  }
}

// Execute when run as CLI
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('cli.js')) {
  main().catch((err) => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
  });
}

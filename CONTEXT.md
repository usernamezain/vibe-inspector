# Project Context: Vibe Inspector

> **What to read first:**
> If you are a coding agent arriving with zero prior context:
> 1. Read this file ([`CONTEXT.md`](file:///C:/Users/SHABBIR%20TRADERS/Desktop/New%20Ext%20MCP/CONTEXT.md)) completely.
> 2. Check current status in [`docs/ROADMAP.md`](file:///C:/Users/SHABBIR%20TRADERS/Desktop/New%20Ext%20MCP/docs/ROADMAP.md).
> 3. Check architectural decisions in [`docs/DECISIONS.md`](file:///C:/Users/SHABBIR%20TRADERS/Desktop/New%20Ext%20MCP/docs/DECISIONS.md).
> 4. Review security rules in [`.agent/skills/extension-security/SKILL.md`](file:///C:/Users/SHABBIR%20TRADERS/Desktop/New%20Ext%20MCP/.agent/skills/extension-security/SKILL.md).
> 5. Follow the Ponytail philosophy in [`.agent/skills/ponytail/SKILL.md`](file:///C:/Users/SHABBIR%20TRADERS/Desktop/New%20Ext%20MCP/.agent/skills/ponytail/SKILL.md).

---

## 1. What the Product Is & Why

**One-line Pitch:**
"Click any element in the browser, tweak it visually, and your AI agent receives the exact element, its source location, and its styles, then edits the code."

**Target Users:**
Frontend developers and "vibe coders" using AI coding assistants (Antigravity, Claude Code, Cursor, Codex). Instead of copying messy HTML or guessing CSS classes and line numbers, users inspect and edit elements visually in Chrome. The AI assistant receives structured, validated element data over an MCP (Model Context Protocol) connection and writes changes directly to disk.

---

## 2. High-Level Architecture

A Chrome Extension cannot be an MCP server directly because browser extensions cannot bind native TCP listening ports or talk to stdio. The system consists of three distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                         │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Host Web Page       │       │ Extension Side Panel  │  │
│  │   (Any website)       │       │ (Tabs: Edit/Page/CSS) │  │
│  │                       │       │                       │  │
│  │   Shadow DOM Overlay  │◀─────▶│ Visual property       │  │
│  │   - Hover highlight   │ Msg   │ editors, presets,     │  │
│  │   - Click picker      │ Bus   │ export, approvals     │  │
│  │   - Numbered pins     │       └───────────┬───────────┘  │
│  └───────────────────────┘                   │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │ WebSocket
                                               │ (Token + Origin Auth)
                                               │ ws://127.0.0.1:PORT
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Local Node.js Bridge (npx package)              │
│                                                             │
│  - Binds strictly to 127.0.0.1                              │
│  - Validates random token & Origin: chrome-extension://<id> │
│  - Bridges WebSocket messages to MCP tools                  │
│  - Enforces explicit user confirmation on writes            │
│  - MCP Server (StdioTransport & Streamable HTTP / SSE)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ MCP Protocol (Stdio / SSE)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       AI Coding Agent                       │
│        (Antigravity / Claude Code / Cursor / Codex)         │
│                                                             │
│  - Calls tools: get_selection, highlight_element, etc.      │
│  - Reads verified source file locations (data-at / plugins) │
│  - Edits real source files on disk                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Current Status

## Current status
Phase: 2 of 7 (Visual Editor Panel & Live CSS).
Done: Monorepo workspace setup, `@vibe-inspector/shared` contracts and algorithms, MV3 Chrome extension, Shadow DOM element picker overlay, and full visual editor side panel with 3-tab navigation (Edit / Page / CSS), real-time CSS mutations, Undo/Redo stack, interactive Spacing box model visualizer, presets manager in chrome.storage.local, viewport screenshot capture, and agent prompt exporter.
In progress: Ready to proceed to Phase 3 (Local Bridge & MCP Server).
Next: Phase 3 (Scaffold `/bridge` package, 127.0.0.1 WebSocket server with token + Origin validation, MCP server with stdio and SSE transports, MCP tools: `get_selection`, `clear_selection`, `highlight_element`, `get_page_info`, `get_computed_styles`, `screenshot`, and interactive write approval gate).
Blocked: None.
Last updated: 2026-10-18 by Antigravity Agent.

---

## 4. Key Constraints (Non-Negotiable)

### 4.1 Security
- **Localhost Isolation:** The local bridge binds exclusively to `127.0.0.1` (never `0.0.0.0`).
- **Authentication & Origin Check:** The bridge generates a cryptographically random token on first run. Every WebSocket connection must supply this token and send an `Origin: chrome-extension://<extension-id>` header matching the installed extension. Web page origins are rejected.
- **Untrusted Page Data:** All text, attributes, class names, and annotation comments extracted from web pages are marked as untrusted user data. They must never be executed or treated as instructions by LLM agents.
- **Write Approval Gate:** Any tool action that writes to disk or modifies persistent state requires explicit interactive user approval in the Extension Side Panel.
- **No Bundled Secrets:** No API keys or credentials exist in the extension bundle. Any user-supplied keys reside strictly in `chrome.storage.local`.
- **Minimal Permissions:** Manifest requests `activeTab`, `sidePanel`, `storage`, `scripting`. No blanket `<all_urls>` permission unless proven unavoidable.
- **Strict Content Security Policy:** MV3 default CSP with zero remote script execution.

### 4.2 Product & Compatibility
- **Manifest V3 & Side Panel API:** Main interface runs in Chrome's native Side Panel.
- **Shadow DOM Isolation:** In-page overlays (picker, highlight box, pins) live in a closed/open Shadow DOM root attached to `document.documentElement`, ensuring zero CSS bleed into or out of the host page.
- **React 19 Compatibility:** React 19 removed `_debugSource`. Source file resolution uses build plugin data attributes (`data-at`, `data-inspector-line`), bundler source maps, or gracefully returns an `unmapped` state.
- **Tailwind Awareness:** Edits to projects using Tailwind CSS synthesize utility class suggestions rather than raw inline styles.
- **Accessibility:** Extension UI is fully keyboard-navigable (`Tab`, `Esc`, arrow keys) and meets WCAG AA contrast standards.

### 4.3 Legal
- **Clean-room Implementation:** All code is written from scratch. UI-Inspector has no license file; no code is copied. Original UI visual design and branding.

---

## 5. Technology Stack & Monorepo Structure

```
/
├── extension/           # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── src/
│   │   ├── background/  # Service worker, side panel behavior
│   │   ├── sidepanel/   # React visual editor (Edit/Page/CSS tabs)
│   │   ├── content/     # Shadow DOM element picker & pin overlay
│   │   └── shared/      # In-extension message passing & types
│   ├── package.json
│   └── vite.config.ts   # Vite + @crxjs/vite-plugin
│
├── bridge/              # Local Bridge & MCP Server
│   ├── src/
│   │   ├── server.ts    # MCP server (@modelcontextprotocol/sdk)
│   │   ├── ws.ts        # Authenticated 127.0.0.1 WebSocket server
│   │   ├── auth.ts      # Token generation and Origin validator
│   │   └── tools/       # MCP tool definitions and approval gates
│   ├── package.json     # Publishable as npx package
│   └── tsconfig.json
│
├── shared/              # Shared TypeScript contracts
│   ├── src/
│   │   ├── types.ts     # ElementInfo, Annotation, StyleDelta
│   │   ├── protocol.ts  # WS message schemas
│   │   └── naming.ts    # Element naming waterfall constants
│   └── package.json
│
├── docs/                # Project Documentation
│   ├── ROADMAP.md       # Master progress tracker
│   ├── DECISIONS.md     # Architectural decision log
│   ├── TECH-DEBT.md     # Ponytail debt tracker
│   └── REFERENCE-ui-inspector.md
│
├── .agent/              # Agent skills
│   └── skills/
│       ├── ponytail/
│       ├── mcp-tool-design/
│       ├── extension-security/
│       └── update-context/
│
├── AGENTS.md            # Agent operational rules
├── CONTEXT.md           # This file
└── package.json         # Workspace root (pnpm/npm workspaces)
```

---

## 6. Glossary

- **MV3 (Manifest V3):** The current Chrome extension platform specification using service workers and declarative rules.
- **Side Panel API (`chrome.sidePanel`):** Native Chrome browser sidebar panel for persistent extension interaction alongside web pages.
- **Shadow DOM:** Web standard encapsulating a DOM tree and CSS styles completely separated from the host document.
- **MCP (Model Context Protocol):** Open protocol standardizing how AI applications expose tools and resources to LLMs over stdio or Streamable HTTP/SSE.
- **`data-at` / `data-inspector-line`:** Build-time DOM attributes injected by compiler plugins (Vite/Babel) to map rendered elements to source file paths and line numbers.
- **Element Name Priority Waterfall:** 12-tier heuristic sorting attributes (ID > testId > ARIA > label > component > class > tag) to generate natural names for elements.
- **Agentation:** Interaction pattern featuring numbered visual pins on elements, comments, and task prompts for AI agents.
- **Ponytail:** Development philosophy enforcing the leanest working solution, avoiding bloat, marking shortcuts with `ponytail:` comments, and maintaining zero regression on security.

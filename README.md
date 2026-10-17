# Vibe Inspector 🎯

> **Click any element in the browser, tweak it visually, and your AI assistant receives the exact element, its source location, and its styles, then writes the code.**

Vibe Inspector is a Chrome Extension (Manifest V3) and authenticated local Model Context Protocol (MCP) bridge designed specifically for AI coding assistants (**Antigravity**, **Claude Code**, **Cursor**, **Codex**). Instead of copying messy HTML or guessing CSS classes and line numbers, users inspect and tweak elements visually in Chrome. The local bridge feeds structured, validated element data directly to your AI coding agent and lets you approve mutations interactively.

---

## 🌟 Key Features

### 🎯 Precision Element Picker & Inspector
- Hover over any element on any web page with smooth bounding box outlines and informative UI badges.
- **12-Tier Identification Waterfall:** Resolves elements by ID, `data-testid`, `aria-label`, component name, tag, and first class.
- **Source Location Resolver:** Detects build-plugin attributes (`data-at`, `data-loc`, `data-inspector-line`, `LocatorJS`, `code-inspector-plugin`) with deep ancestor tree crawling and graceful fallback to an `unmapped` state.
- **Robust Selector Generator:** Generates unambiguous primary CSS selectors with fallback paths.

### ✏️ Visual Live CSS Tweaker
- Tweak appearance, typography, colors, borders, and flexbox layout with instant live page preview.
- **Interactive Spacing Box Model:** Visual box visualizer for tweaking margins and paddings in real time.
- **Full Undo/Redo History:** `Ctrl+Z` / `Ctrl+Y` keyboard shortcuts to roll back changes effortlessly.
- **Native EyeDropper API:** Sample any pixel on your desktop screen with zero bundle bloat (`// ponytail: native EyeDropper API`).
- **Saved Presets:** Store and load visual style presets in `chrome.storage.local`.

### ✨ Tailwind CSS Synthesizer & Token Extractor
- Translates visual CSS modifications into idiomatic **Tailwind utility classes** in real time.
- Automatically detects CSS custom properties (`--color-*`, `--spacing-*`, `--radius-*`) and substitutes design tokens into generated styles.
- **One-Click Export:** "Copy Tailwind" and "Copy Prompt for AI" buttons.

### 📌 Visual Numbered Pins & Marquee Grouping
- Drop numbered pins anchored to DOM elements inside an encapsulated Shadow DOM.
- **Multi-Pin Fan-Out Stacking:** Automatically calculates horizontal offsets (`+28px`) so multiple pins on the same target never obscure each other.
- **Drag-to-Select Marquee Grouping:** Drag across the page to group multiple elements; automatically filters to outermost ancestors and caps at 30 items to prevent DOM tree explosion.
- **Page-Scoped Persistence:** Annotations survive page reloads and automatically refresh across SPA route transitions (`popstate`, `hashchange`, Next.js/React Router transitions).
- **In-Browser Resolve / Reopen:** Mark pins as resolved with optional notes directly in the live page.

### ♿ Accessibility & Web Vitals
- **axe-core Audit Engine:** Run automated WCAG 2.1 AA audits on demand to detect contrast failures, missing labels, and ARIA issues.
- **Real-Time Core Web Vitals:** Live performance metrics for LCP, CLS, FCP, and TTFB with color-coded status badges.

### 🔒 Non-Negotiable Localhost Security
- **Strict 127.0.0.1 Binding:** Local WebSocket bridge binds exclusively to `127.0.0.1` (never `0.0.0.0`).
- **Cryptographic Token Auth:** First-run 48-character hex token required on every connection.
- **Origin Header Verification:** Rejects web pages (`http://`, `https://`, `null`, `file://`); accepts only matching `chrome-extension://` origins.
- **Interactive User Approval Gate:** AI agents cannot mutate page styles without explicit human approval in the Side Panel UI.
- **Untrusted Page Data Notices:** All tool outputs flag page content as untrusted data to prevent prompt injection.
- **Zero Bundled Secrets:** No API keys in the extension bundle.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                         │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Host Web Page       │       │ Extension Side Panel  │  │
│  │   (Any website)       │       │ (Edit/Page/Pins/CSS)  │  │
│  │                       │       │                       │  │
│  │   Shadow DOM Overlay  │◀─────▶│ Visual property       │  │
│  │   - Hover highlight   │ Msg   │ editors, presets,     │  │
│  │   - Click picker      │ Bus   │ a11y, pins, approvals │  │
│  │   - Numbered pins     │       └───────────┬───────────┘  │
│  └───────────────────────┘                   │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │ WebSocket
                                               │ (Token + Origin Auth)
                                               │ ws://127.0.0.1:7890
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

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **pnpm:** v9.0.0 or higher
- **Google Chrome:** Version 114+ (for Side Panel API)

### 2. Build the Monorepo
Clone this repository and build all packages:
```bash
pnpm install
pnpm build
```

### 3. Load the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `extension/dist` folder in this repository.
5. Click the Vibe Inspector puzzle-piece icon in your browser toolbar to open the Side Panel.

### 4. Start the Local Bridge
Run the bridge CLI in your terminal:
```bash
pnpm --filter @vibe-inspector/bridge start
# Or when published:
npx vibe-inspector-bridge
```
The bridge will output your generated authentication token and display connection instructions. Copy the token into the **Bridge Connection Wizard** (gear icon in the Side Panel header) to connect.

---

## 🤖 AI Assistant MCP Configurations

Add the bridge to your AI assistant's configuration file:

### Antigravity (`~/.gemini/antigravity/mcp_config.json`)
```json
{
  "mcpServers": {
    "vibe-inspector": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/bridge/dist/index.js", "--port", "7890"]
    }
  }
}
```

### Claude Code (`~/.claude/mcp.json` or `claude mcp add`)
```bash
claude mcp add vibe-inspector node <PATH_TO_REPO>/bridge/dist/index.js
```

### Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "vibe-inspector": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/bridge/dist/index.js"]
    }
  }
}
```

### Codex (`~/.codex/config.json`)
```json
{
  "mcp_servers": {
    "vibe-inspector": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/bridge/dist/index.js"]
    }
  }
}
```

---

## 🛠️ Registered MCP Tools (11 Tools)

| Tool Name | Type | Description |
| :--- | :---: | :--- |
| `get_selection` | Read | Returns details of the currently selected element (tag, selector, source file, dimensions, styles). |
| `clear_selection` | Write | Deselects the current element in the browser. |
| `highlight_element` | Write | Flash-highlights an element on the live web page with an animated indicator to verify targeting. |
| `get_page_info` | Read | Returns the active tab URL, page title, and viewport dimensions. |
| `screenshot` | Read | Captures a high-resolution PNG snapshot of the current viewport. |
| `get_computed_styles` | Read | Returns full computed CSS styles for an element or selector. |
| `list_annotations` | Read | Retrieves all visual numbered pins on the active page (index, status, comments, source locations). |
| `resolve_annotation` | Write | Marks a pin as resolved with an optional resolution note or git commit hash. |
| `annotations_to_prompt`| Read | Compiles all page annotations into a structured, production-ready markdown prompt for an AI assistant. |
| `audit_accessibility` | Read | Executes an automated `axe-core` WCAG 2.1 AA audit on the page or target element subtree. |
| `get_web_vitals` | Read | Retrieves real-time Core Web Vitals (LCP, CLS, FCP, TTFB, DOMContentLoaded, Load Time). |

---

## 🧪 Testing & Verification

Run the comprehensive unit and integration test suite:
```bash
pnpm test
```
The suite executes 36 automated tests across the monorepo using Vitest and Happy-DOM, verifying element waterfall resolution, selector synthesis, Tailwind utility conversion, design token extraction, pin stack offsets, outermost ancestor filtering, and WebSocket bridge authentication security.

---

## 📄 License & Attribution
- Clean-room implementation written from scratch.
- Distributed under the MIT License.

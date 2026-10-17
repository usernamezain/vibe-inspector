# Companion MCP Servers Interoperability Guide

> How to pair **Vibe Inspector** with other Model Context Protocol (MCP) servers in AI coding assistants (Antigravity, Claude Code, Cursor, Codex).

---

## 1. Overview & Separation of Concerns

AI coding assistants thrive when specialized tools handle specific domains rather than a single monolithic tool attempting everything poorly.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI Coding Assistant Host                        │
│                (Antigravity / Claude Code / Cursor)                    │
└──────┬─────────────────────────┬───────────────────────────────┬───────┘
       │                         │                               │
       ▼                         ▼                               ▼
┌──────────────────┐   ┌────────────────────┐       ┌────────────────────┐
│  Vibe Inspector  │   │ Chrome DevTools    │       │   Playwright MCP   │
│       MCP        │   │       MCP          │       │                    │
│                  │   │                    │       │                    │
│ • Visual picker  │   │ • Network timeline │       │ • Headless runner  │
│ • Numbered pins  │   │ • Request headers  │       │ • Multi-page flows │
│ • Live CSS edit  │   │ • Heap memory      │       │ • E2E test runs    │
│ • Tailwind synth │   │ • Raw CDP streams  │       │ • CI regression    │
│ • Human approval │   │ • Console logs     │       │ • Form automation  │
└──────────────────┘   └────────────────────┘       └────────────────────┘
```

---

## 2. Server Matrix: Choosing the Right Tool

| Capability / Scenario | Vibe Inspector MCP | Chrome DevTools MCP | Playwright MCP |
| :--- | :---: | :---: | :---: |
| **Human Element Picking (Point & Click)** | **Primary** | No | No |
| **Numbered Visual Pin Annotations** | **Primary** | No | No |
| **Live CSS Visual Tweaker & Undo/Redo** | **Primary** | No | No |
| **Tailwind CSS Utility Class Synthesizer**| **Primary** | No | No |
| **Design Token Extraction (`--color-*`)** | **Primary** | No | No |
| **Interactive Write-Approval Gate** | **Primary** | No | No |
| **Raw CDP Network Request Inspection** | Complementary | **Primary** | Complementary |
| **Heap Snapshots & Memory Leaks** | No | **Primary** | No |
| **Headless E2E Browser Testing in CI** | No | No | **Primary** |
| **Multi-tab / Multi-page Navigation Scripts** | Complementary | Complementary | **Primary** |

---

## 3. Working with Chrome DevTools MCP

### When to use Vibe Inspector:
- Finding the exact DOM element a user or designer is talking about ("make *this* button blue").
- Reading build-plugin source coordinates (`data-at`, `data-loc`, `LocatorJS`).
- Converting raw CSS adjustments into idiomatic Tailwind utility classes.
- Reviewing visual numbered pins and user feedback.

### When to call Chrome DevTools MCP:
- Investigating failed XHR/Fetch API responses, HTTP 500 error bodies, and auth headers.
- Inspecting browser cookies, session storage, and IndexedDB state.
- Profiling JavaScript execution call trees and long-running event loops.

### Example Multi-Server Config (`mcpServers` in settings):
```json
{
  "mcpServers": {
    "vibe-inspector": {
      "command": "npx",
      "args": ["-y", "@vibe-inspector/bridge", "--port", "7890"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-chrome-devtools"]
    }
  }
}
```

---

## 4. Working with Playwright MCP

### When to use Vibe Inspector:
- Interactive local development and visual tweaking on your active browser tab.
- Rapid visual prototyping without writing test scripts.

### When to call Playwright MCP:
- Executing repeatable end-to-end integration tests across multiple viewport sizes.
- Filling out multi-step checkout forms or testing authentication redirects in a sandboxed clean browser.

---

## 5. Architectural Evaluation: `chrome.debugger` vs Extension API

Why does Vibe Inspector use native Manifest V3 Extension APIs instead of attaching `chrome.debugger`?

1. **Intrusive Chrome Banner:** Attaching `chrome.debugger` triggers Chrome's top banner: `""Vibe Inspector" started debugging this browser"`. This disrupts vibe coding and reduces trust.
2. **Permission Surface:** `chrome.debugger` grants unrestricted remote execution rights over the entire browser process. Vibe Inspector adheres strictly to minimal permissions (`activeTab`, `sidePanel`, `storage`).
3. **Speed & Reliability:** `chrome.tabs.captureVisibleTab` and encapsulated Shadow DOM overlays execute with zero initialization delay, zero permission prompts, and zero risk of crashing browser tabs.

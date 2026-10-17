# Project Roadmap: Vibe Inspector (Chrome Extension + MCP Bridge)

> **Single Source of Truth for Project Progress**
> Updated at the conclusion of every phase.

---

## Progress Overview

| Phase | Description | Status | Completion |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Research and Setup | Complete | 100% |
| **Phase 1** | Extension Shell & Element Picker | Complete | 100% |
| **Phase 2** | Visual Editor Panel & Live CSS | Complete | 100% |
| **Phase 3** | Local Bridge & MCP Server | Complete | 100% |
| **Phase 4** | Source Mapping & Code Write-Back | Complete | 100% |
| **Phase 5** | Pin Annotations & Grouping | Complete | 100% |
| **Phase 6** | Advanced Integrations | Complete | 100% |
| **Phase 7** | Hardening & Release | Complete | 100% |

---

## Detailed Task Breakdown

### Phase 0: Research & Setup
- [x] Read reference repository `beyondworks/UI-Inspector` servers/ folder in full. *(Owner: Agent, Status: Complete, Notes: Analyzed 18 tools, data schemas, naming waterfall, and annotation lifecycle)*
- [x] Write `docs/REFERENCE-ui-inspector.md`. *(Owner: Agent, Status: Complete, Notes: Comprehensive comparison and architectural learnings)*
- [x] Verify current APIs: Chrome MV3, `chrome.sidePanel`, `chrome.debugger`, Native Messaging vs WebSocket, MCP SDK, and React 19 source mapping. *(Owner: Agent, Status: Complete, Notes: Verified React 19 PR #28265 _debugSource removal, MV3 CSP restrictions, and tokenized localhost WS model)*
- [x] Find, audit, and install Ponytail skill. *(Owner: Agent, Status: Complete, Notes: Sourced from official repo `DietrichGebert/ponytail`, installed globally into Antigravity config and locally in `.agent/skills`)*
- [x] Create project deliverables: `CONTEXT.md`, `AGENTS.md`, `docs/DECISIONS.md`, `docs/TECH-DEBT.md`, and `.agent/skills/`. *(Owner: Agent, Status: Complete)*
- [x] Propose monorepo structure and technology choices. *(Owner: Agent, Status: Complete, Notes: Monorepo with `/extension`, `/bridge`, `/shared`, `/docs` using TypeScript, Vite, and MCP SDK)*
- [x] Present Phase 0 summary to user and obtain explicit approval before Phase 1 code. *(Owner: User/Agent, Status: Complete, Notes: Approved by user)*

---

### Phase 1: Extension Shell & Element Picker
- [x] Scaffold `/extension` package with Manifest V3 and TypeScript. *(Owner: Agent, Status: Complete, Notes: Strict CSP, minimal permissions: activeTab, sidePanel, storage, scripting)*
- [x] Implement Background Service Worker and Side Panel entry. *(Owner: Agent, Status: Complete, Notes: Configured with `chrome.sidePanel.setPanelBehavior` and fallback dynamic script injection)*
- [x] Build Content Script inside Shadow DOM (`attachShadow`). *(Owner: Agent, Status: Complete, Notes: `#vibe-inspector-host` with scoped styles, zero style bleed)*
- [x] Build Element Picker (hover highlight box, click select, ESC key cancel). *(Owner: Agent, Status: Complete, Notes: Crosshair cursor, interactive badge `[Term] Tag · Name · WxH`)*
- [x] Implement Element Metadata Extractor:
  - [x] Tag, classes, ID, text (truncated to 200 chars).
  - [x] Bounding rect and computed styles.
  - [x] Parent chain.
  - [x] 12-tier Element Name Priority Waterfall with framework-generated ID filtering.
  - [x] UI/UX Terminology inference engine (Button, Search Input, Heading, Nav, Card, etc.).
- [x] Implement robust CSS selector generator with fallback strategies (ID, testId, ARIA, unique class, structural nth-of-type, absolute path). *(Owner: Agent, Status: Complete)*
- [x] Side Panel React UI with Inspect toggle, Hero Element Card, Selector copy, Source Location badge, and Computed Styles summary. *(Owner: Agent, Status: Complete)*
- [x] Automated unit test suite with happy-dom and vitest (11/11 tests passing). *(Owner: Agent, Status: Complete)*
- [x] Phase 1 verification and clean build (`dist/` verified). *(Owner: Agent, Status: Complete)*

---

### Phase 2: Visual Editor Panel & Live CSS
- [x] Implement Side Panel UI with 3-tab navigation: **Edit** / **Page** / **CSS**. *(Owner: Agent, Status: Complete, Notes: Badge counters for active element deltas and page-wide modifications)*
- [x] Build Property Editor Sections:
  - [x] **Appearance**: Opacity slider, border radius slider.
  - [x] **Typography**: Font size, font weight select, text align segmented control, text color picker.
  - [x] **Background**: Color picker, transparent toggle.
  - [x] **Spacing**: Interactive margin and padding box model visualizer with click-to-edit values.
  - [x] **Border**: Border width slider, border style select, border color picker.
  - [x] **Layout**: Display segmented control (block, flex, grid, inline-block), flex direction, align-items, justify-content, gap slider.
- [x] Implement live CSS preview engine with Undo / Redo history stack and keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`). *(Owner: Agent, Status: Complete, Notes: Managed via `useLiveStyles` custom hook)*
- [x] Build per-element change log and reset capabilities ("Reset Styles" per element and "Reset All" page-wide). *(Owner: Agent, Status: Complete)*
- [x] Presets management (save current changes as named preset, load, apply, and delete presets in `chrome.storage.local`). *(Owner: Agent, Status: Complete)*
- [x] Export features: Viewport screenshot snapshot capture with instant PNG download. *(Owner: Agent, Status: Complete)*
- [x] Copy actions: "Copy CSS" (clean formatted rules) and "Copy Changes as Agent Prompt" (markdown prompt for AI agents). *(Owner: Agent, Status: Complete)*
- [x] Unit test suite extended for style deltas, presets, and CSS formatting (14/14 tests passing). *(Owner: Agent, Status: Complete)*
- [x] Phase 2 verification and production build. *(Owner: Agent, Status: Complete)*

---

### Phase 3: Local Bridge & MCP Server
- [x] Scaffold `/bridge` package (Node.js + TypeScript, publishable via npx as `vibe-inspector-bridge`). *(Owner: Agent, Status: Complete)*
- [x] Implement WebSocket server strictly on `127.0.0.1`:
  - [x] First-run 48-char cryptographically random hex token generation.
  - [x] Strict Origin header validation (`chrome-extension://...`).
  - [x] Reject all non-extension / unauthorized origins (`http://`, `https://`, `null`, `file://`).
- [x] Implement MCP Server using `@modelcontextprotocol/sdk`:
  - [x] Stdio server transport with non-interfering diagnostic logging to `stderr`.
- [x] Register core MCP tools with untrusted data sanitization notices:
  - [x] `get_selection`: Retrieve current selected element, source info, styles.
  - [x] `clear_selection`: Clear current selection.
  - [x] `highlight_element`: Flash-highlight element in connected browser.
  - [x] `get_page_info`: URL, title, viewport dimensions.
  - [x] `screenshot`: Capture viewport PNG snapshot.
- [x] Implement interactive user approval security gate in Extension UI for write/mutation tools (`APPLY_STYLE`). *(Owner: Agent, Status: Complete)*
- [x] Build Connection Wizard & Agent Setup Guide in Extension Side Panel with copy-paste configs for Antigravity, Claude Code, Cursor, Codex. *(Owner: Agent, Status: Complete)*
- [x] Automated unit and WebSocket server integration tests (21/21 tests passing). *(Owner: Agent, Status: Complete)*
- [x] Phase 3 verification and production build. *(Owner: Agent, Status: Complete)*

---

### Phase 4: Source Mapping & Code Write-Back
- [x] Evaluate and document build plugin integrations:
  - [x] `code-inspector-plugin` / `LocatorJS` data attributes (`data-inspector-line`, `data-at`, `data-loc`).
  - [x] Dev tooling hooks across Next.js, Vite React, Vue, Svelte, Astro.
- [x] Implement source location resolver returning `{ file, line, column, componentName, framework }` with ancestor tree crawling or explicit `unmapped` state. *(Owner: Agent, Status: Complete)*
- [x] Implement Tailwind-aware class synthesizer (converting margins, paddings, display, flexbox, colors, typography, borders, and arbitrary values to Tailwind utility classes). *(Owner: Agent, Status: Complete)*
- [x] Design token extractor (detecting CSS custom properties `--color-*`, `--spacing-*`, `--radius-*`, `--font-*` and matching values). *(Owner: Agent, Status: Complete)*
- [x] Side Panel integration: Live Tailwind class display, "Copy Tailwind" button, and AI prompt exporter with Tailwind utility injection. *(Owner: Agent, Status: Complete)*
- [x] Automated unit test suite extended (30/30 tests passing across monorepo). *(Owner: Agent, Status: Complete)*
- [x] Phase 4 verification and production build. *(Owner: Agent, Status: Complete)*

---

### Phase 5: Annotations System
- [x] Visual numbered pins anchored to DOM elements. *(Owner: Agent, Status: Complete)*
- [x] Multi-pin stacking with horizontal offset handling. *(Owner: Agent, Status: Complete)*
- [x] Drag-to-select marquee multi-element grouping (capped at 30 items, filtering to outermost ancestors). *(Owner: Agent, Status: Complete)*
- [x] Page-scoped persistence surviving page reloads and SPA client-side route transitions. *(Owner: Agent, Status: Complete)*
- [x] In-browser resolve/reopen dialogs with modification notes. *(Owner: Agent, Status: Complete)*
- [x] Copy Prompt button for agents without active MCP connections. *(Owner: Agent, Status: Complete)*
- [x] Bridge MCP tools registered (`list_annotations`, `resolve_annotation`, `annotations_to_prompt`, `get_computed_styles`). *(Owner: Agent, Status: Complete)*
- [x] Automated unit and integration test suite extended (36/36 tests passing across monorepo). *(Owner: Agent, Status: Complete)*
- [x] Phase 5 Ponytail review. *(Owner: Agent, Status: Complete)*

---

### Phase 6: Advanced Integrations (Evaluated)
- [x] `axe-core` accessibility audit engine integration. *(Owner: Agent, Status: Complete)*
- [x] `chrome.debugger` / CDP architectural evaluation documented in ADR-007 (avoiding disruptive yellow browser banner). *(Owner: Agent, Status: Complete)*
- [x] Web Vitals & performance summary panel (LCP, CLS, FCP, TTFB). *(Owner: Agent, Status: Complete)*
- [x] Native `EyeDropper` API integration for desktop screen color sampling. *(Owner: Agent, Status: Complete)*
- [x] Interoperability guide for companion MCP servers (`docs/COMPANION-MCP-GUIDE.md`). *(Owner: Agent, Status: Complete)*
- [x] Optional bring-your-own-key in-browser chat panel (keys strictly in `chrome.storage.local`). *(Owner: Agent, Status: Complete)*
- [x] Phase 6 Ponytail review. *(Owner: Agent, Status: Complete)*


---

### Phase 7: Hardening & Release
- [x] Full security audit against project constraints checklist (`docs/SECURITY-AUDIT.md`). *(Owner: Agent, Status: Complete, Notes: 100% compliant across localhost binding, token auth, origin checks, untrusted content warnings, write approval gate, and CSP)*
- [x] Permission audit (`manifest.json` verified with zero unnecessary permissions). *(Owner: Agent, Status: Complete, Notes: activeTab, sidePanel, storage, scripting)*
- [x] Privacy Policy and Chrome Web Store listing assets (`docs/PRIVACY-POLICY.md`, `docs/CHROME-WEB-STORE.md`). *(Owner: Agent, Status: Complete, Notes: Store package with single-purpose and permission justifications ready for submission)*
- [x] Documentation: Install guides, per-agent configurations, troubleshooting (`README.md`, `docs/COMPANION-MCP-GUIDE.md`). *(Owner: Agent, Status: Complete, Notes: Tested copy-paste setup configs for Antigravity, Claude Code, Cursor, and Codex)*
- [x] Prepare npm package for bridge CLI (`bridge/package.json` updated with files whitelist for `npx vibe-inspector-bridge`). *(Owner: Agent, Status: Complete)*
- [x] Final `/ponytail-audit` and technical debt consolidation (`docs/TECH-DEBT.md`). *(Owner: Agent, Status: Complete, Notes: 3 deliberate shortcuts documented with clean upgrade paths, zero high-risk debt)*

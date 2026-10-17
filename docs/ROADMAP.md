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
| **Phase 3** | Local Bridge & MCP Server | Ready to Start | 0% |
| **Phase 4** | Source Mapping & Code Write-Back | Pending | 0% |
| **Phase 5** | Pin Annotations & Grouping | Pending | 0% |
| **Phase 6** | Advanced Integrations | Pending | 0% |
| **Phase 7** | Hardening & Release | Pending | 0% |

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
- [ ] Scaffold `/bridge` package (Node.js + TypeScript, publishable via npx). *(Owner: Agent, Status: Pending)*
- [ ] Implement WebSocket server on `127.0.0.1`:
  - [ ] First-run cryptographically random token generation.
  - [ ] Strict Origin header validation (`chrome-extension://<id>`).
  - [ ] Reject all non-extension / unauthorized origins.
- [ ] Implement MCP Server using `@modelcontextprotocol/sdk`:
  - [ ] Stdio server transport for CLI agents.
  - [ ] Streamable HTTP / SSE transport.
- [ ] Register core MCP tools:
  - [ ] `get_selection`: Retrieve current selected element, source info, styles.
  - [ ] `clear_selection`: Clear current selection.
  - [ ] `highlight_element`: Flash-highlight element in connected browser.
  - [ ] `get_page_info`: URL, title, viewport dimensions.
  - [ ] `get_computed_styles`: Deep computed styles inspection.
  - [ ] `screenshot`: Capture element or viewport snapshot.
  - [ ] `get_errors`: Capture client-side console errors.
  - [ ] `list_annotations`: List visual pins and feedback.
  - [ ] `resolve_annotation`: Resolve pin with status note.
  - [ ] `annotations_to_prompt`: Agentation markdown task list.
- [ ] Implement user approval security gate in Extension UI for all write/mutation tools. *(Owner: Agent, Status: Pending)*
- [ ] Build Connection Wizard in Extension Side Panel with copy-paste configs for Antigravity, Claude Code, Cursor, Codex. *(Owner: Agent, Status: Pending)*
- [ ] Unit & integration tests for authentication and Origin rejection. *(Owner: Agent, Status: Pending)*
- [ ] Phase 3 Ponytail review. *(Owner: Agent, Status: Pending)*

---

### Phase 4: Source Mapping & Code Write-Back
- [ ] Evaluate and document build plugin integrations:
  - [ ] `code-inspector-plugin` / `LocatorJS` data attributes (`data-inspector-line`, `data-at`).
  - [ ] Dev tooling hooks across Next.js, Vite React, Vue, Svelte, Astro.
  - [ ] Standard browser source map resolution.
- [ ] Implement source location resolver returning `{ file, line, column }` or explicit `unmapped` state. *(Owner: Agent, Status: Pending)*
- [ ] Implement Tailwind-aware class synthesizer (convert edited CSS properties into utility classes when Tailwind is detected). *(Owner: Agent, Status: Pending)*
- [ ] Design token extractor (detect CSS custom properties `--color-*` and Tailwind theme tokens). *(Owner: Agent, Status: Pending)*
- [ ] Phase 4 Ponytail review. *(Owner: Agent, Status: Pending)*

---

### Phase 5: Annotations System
- [ ] Visual numbered pins anchored to DOM elements. *(Owner: Agent, Status: Pending)*
- [ ] Multi-pin stacking with horizontal offset handling. *(Owner: Agent, Status: Pending)*
- [ ] Drag-to-select marquee multi-element grouping (capped at 30 items, filtering to outermost ancestors). *(Owner: Agent, Status: Pending)*
- [ ] Page-scoped persistence surviving page reloads and SPA client-side route transitions. *(Owner: Agent, Status: Pending)*
- [ ] In-browser resolve/reopen dialogs with modification notes. *(Owner: Agent, Status: Pending)*
- [ ] Copy Prompt button for agents without active MCP connections. *(Owner: Agent, Status: Pending)*
- [ ] Phase 5 Ponytail review. *(Owner: Agent, Status: Pending)*

---

### Phase 6: Advanced Integrations (Evaluated)
- [ ] `axe-core` accessibility audit engine integration. *(Owner: Agent, Status: Pending)*
- [ ] `chrome.debugger` / CDP bridge for high-fidelity screenshots and accessibility tree inspection (with user alert regarding Chrome debugging banner). *(Owner: Agent, Status: Pending)*
- [ ] Web Vitals & performance summary panel. *(Owner: Agent, Status: Pending)*
- [ ] Native `EyeDropper` API integration for color sampling. *(Owner: Agent, Status: Pending)*
- [ ] Interoperability guide for companion MCP servers (Chrome DevTools MCP, Playwright MCP). *(Owner: Agent, Status: Pending)*
- [ ] Optional bring-your-own-key in-browser chat panel (keys strictly in `chrome.storage.local`). *(Owner: Agent, Status: Pending)*
- [ ] Phase 6 Ponytail review. *(Owner: Agent, Status: Pending)*

---

### Phase 7: Hardening & Release
- [ ] Full security audit against project constraints checklist. *(Owner: Agent, Status: Pending)*
- [ ] Permission audit (verify zero unnecessary permissions). *(Owner: Agent, Status: Pending)*
- [ ] Privacy Policy and Chrome Web Store listing assets. *(Owner: Agent, Status: Pending)*
- [ ] Documentation: Install guides, per-agent configurations, troubleshooting. *(Owner: Agent, Status: Pending)*
- [ ] Prepare npm package for bridge CLI (`npx vibe-inspector-bridge`). *(Owner: Agent, Status: Pending)*
- [ ] Final `/ponytail-audit` and technical debt consolidation. *(Owner: Agent, Status: Pending)*

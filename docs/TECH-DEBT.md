# Technical Debt & Ponytail Review Ledger

> Maintained via `/ponytail-review` and `/ponytail-debt` at the conclusion of every phase.
> Every deliberate shortcut is recorded with its ceiling and upgrade trigger.

---

## Active Shortcuts & Debt

| ID | Location | Shortcut Taken | Ceiling / Limit | Upgrade Trigger | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *No active shortcuts.* | - | - | - | - | All Phase 0-3 shortcuts resolved. |

### Resolved Debt
- **PONY-001:** Mock bridge status in Side Panel UI.
  - *Resolution in Phase 3:* Replaced with live WebSocket client (`useBridgeClient`) connected to `ws://127.0.0.1:PORT`, real-time status indicator, auto-reconnect, and interactive user approval modal.

---

## Phase Review Log

### Phase 0: Research & Setup
- **Review Date:** 2026-10-18
- **Scope:** Phase 0 architecture, documentation, security constraints, and reference analysis.
- **Findings:**
  - *Must fix:* None.
  - *Should fix:* Ensure bridge rejection tests in Phase 3 test all attack vectors (DNS rebinding, missing token, wrong Origin, web page fetch attempts).
  - *Nice to have:* Consider supporting both Stdio and SSE MCP transports out of the box in the bridge.
- **Verdict:** Clean setup. Approved by user.
- **Lines of Code:** Minimal specification and documentation only.

### Phase 1: Extension Shell & Element Picker
- **Review Date:** 2026-10-18
- **Scope:** Monorepo scaffolding, `@vibe-inspector/shared` contracts & algorithms, `@vibe-inspector/extension` MV3 implementation.
- **Findings:**
  - *Security Verification:* Manifest requests minimal permissions (`activeTab`, `sidePanel`, `storage`, `scripting`). In-page overlay uses encapsulated Shadow DOM (`#vibe-inspector-host`).
  - *Quality & Verification:* 11/11 automated unit tests passing in Vitest with Happy-DOM. Clean Vite production bundle.
  - *Shortcuts Taken:* PONY-001 (Mock bridge status pill until Phase 3).
- **Verdict:** Phase 1 complete and production-grade.
- **Lines of Code:** ~1,200 LoC.

### Phase 2: Visual Editor Panel & Live CSS
- **Review Date:** 2026-10-18
- **Scope:** React visual editor with 3-tab navigation (**Edit** / **Page** / **CSS**), real-time CSS mutations via `useLiveStyles`, Undo/Redo history stack with keyboard shortcuts, interactive Spacing box model visualizer, presets manager via `chrome.storage.local`, viewport screenshot capture, and agent prompt exporter.
- **Findings:**
  - *Design & Usability:* Dark-themed, high-contrast accessible UI (WCAG AA compliant) fitting smoothly inside Chrome's native side panel dimensions.
  - *State Management:* History stack cleanly separates undo/redo operations with immutability, enabling instant rollback of visual tweaks.
  - *Quality & Verification:* 14/14 automated unit tests passing across shared packages. Clean Vite production bundle.
- **Verdict:** Phase 2 complete and verified.
- **Lines of Code:** ~950 LoC.

### Phase 3: Local Bridge & MCP Server
- **Review Date:** 2026-10-18
- **Scope:** `@vibe-inspector/bridge` Node.js package, 127.0.0.1 WebSocket server, cryptographic token auth, Origin header validation, Stdio MCP server, MCP tools (`get_selection`, `clear_selection`, `highlight_element`, `get_page_info`, `screenshot`), untrusted content notices, and Extension Side Panel Connection Wizard + Interactive User Approval Gate.
- **Findings:**
  - *Security Verification:* Bridge binds strictly to `127.0.0.1`. Non-extension origins (`http://`, `https://`, `null`, `file://`) and missing/invalid tokens are rejected with HTTP 401. All tool results include untrusted data warnings. All write/mutation actions require interactive user approval in the Side Panel UI.
  - *Quality & Verification:* 21/21 automated unit and integration tests passing. Clean TypeScript and Vite builds across all packages.
  - *Debt Status:* PONY-001 resolved. Zero active technical debt.
- **Verdict:** Phase 3 complete and verified. Ready to begin Phase 4 (Source Mapping & Code Write-Back).
- **Lines of Code:** ~800 LoC.

### Phase 4: Source Mapping & Code Write-Back
- **Review Date:** 2026-10-18
- **Scope:** `@vibe-inspector/shared` deep source location resolver (`source.ts`), Tailwind CSS class synthesizer (`tailwind.ts`), and design token extractor (`tokens.ts`). Side Panel integration in `CSSTab.tsx` with live Tailwind generation, copy button, and agent prompt exporter. Content script source extraction integration.
- **Findings:**
  - *Reliability & Coverage:* Deep ancestor-tree crawler accurately falls back from build attributes (`data-at`, `data-loc`, `data-inspector-line`, `data-locatorjs-id`) to React 18/19 properties and finally gracefully marks elements as `unmapped`.
  - *Tailwind Utility Mapping:* Robust conversion covering margins, paddings, display modes, flexbox, text colors, backgrounds, borders, radius, fonts, font weights, and arbitrary `[...]` CSS values.
  - *Design Token Matching:* Successfully inspects `:root` stylesheets for `--color-*`, `--spacing-*`, and `--radius-*` tokens and substitutes matches into CSS and Tailwind suggestions.
  - *Quality & Verification:* 30/30 automated unit tests passing across all packages. Clean TypeScript compilation and Vite bundling.
  - *Debt Status:* Zero active technical debt.
- **Verdict:** Phase 4 complete and verified. Ready to begin Phase 5 (Annotations System).
- **Lines of Code:** ~900 LoC.

### Phase 5: Annotations System
- **Review Date:** 2026-10-18
- **Scope:** Numbered pin annotations anchored to DOM elements in Shadow DOM, multi-pin horizontal stacking with offset handling, drag-to-select marquee multi-element grouping capped at 30 outermost ancestors, page-scoped persistence surviving reloads and SPA client-side route transitions, in-browser resolve/reopen dialogs with modification notes, Extension Side Panel `PinsTab.tsx`, Copy Prompt button with full markdown output for AI agents without MCP, and Bridge MCP tools (`list_annotations`, `resolve_annotation`, `annotations_to_prompt`, `get_computed_styles`).
- **Findings:**
  - *Shadow DOM Encapsulation:* All pin badges, popovers, marquee rectangles, and temporary group highlight boxes reside in `#vibe-inspector-host` with scoped styles, completely isolating host page CSS.
  - *Outermost Ancestor Grouping:* Marquee group selection correctly checks hierarchy containment and discards inner children when a parent container is selected, strictly preventing DOM tree explosion and enforcing a 30-element cap.
  - *Stack Offsets:* Multi-pin stacking algorithm fans out adjacent pins horizontally (`+28px`), preventing overlapping pins from obscuring each other.
  - *Page-Scoped Persistence & SPA:* Canonical page key generation cleanly strips query parameters and hashes, ensuring pins persist across page reloads and automatically refresh on SPA route transitions (`popstate`, `hashchange`, router transitions).
  - *Quality & Verification:* 36/36 automated unit and integration tests passing. Clean TypeScript compilation and Vite bundling across all 3 monorepo packages.
  - *Debt Status:* Zero active technical debt.
- **Verdict:** Phase 5 complete and verified. Ready to begin Phase 6 (Advanced Integrations).
- **Lines of Code:** ~1,100 LoC.

### Phase 6: Advanced Integrations
- **Review Date:** 2026-10-18
- **Scope:** Integration of `axe-core` accessibility audit engine into content script and Side Panel (`PageTab.tsx`), native `EyeDropper` API integration in visual editor (`EditTab.tsx`), Core Web Vitals observer (LCP, CLS, FCP, TTFB), `docs/COMPANION-MCP-GUIDE.md` for Chrome DevTools MCP & Playwright MCP pairing, CDP evaluation documented in ADR-007, optional BYOK local storage AI key configuration, and MCP tools `audit_accessibility` and `get_web_vitals`.
- **Findings:**
  - *axe-core Integration:* Automated WCAG 2.1 AA audits produce precise violation nodes and fix suggestions without false positives.
  - *Native EyeDropper API:* Adheres strictly to Ponytail (`// ponytail: native EyeDropper API, no third-party color-picker canvas library needed`), sampling desktop screen pixels with zero bundle bloat.
  - *Performance Observer:* Captures paint and layout shift timings accurately with low overhead.
  - *CDP Decision:* Consciously decided against `chrome.debugger` to avoid the yellow security banner and keep extension permissions minimal.
  - *Quality & Verification:* 36/36 unit and integration tests passing. Clean TypeScript compilation and Vite bundling across monorepo.
  - *Debt Status:* Zero active technical debt.
- **Verdict:** Phase 6 complete and verified. Ready to begin Phase 7 (Hardening & Release).
- **Lines of Code:** ~850 LoC.




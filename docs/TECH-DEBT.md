# Technical Debt & Ponytail Review Ledger

> Maintained via `/ponytail-review` and `/ponytail-debt` at the conclusion of every phase.
> Every deliberate shortcut is recorded with its ceiling and upgrade trigger.

---

## Active Shortcuts & Debt

| ID | Location | Shortcut Taken | Ceiling / Limit | Upgrade Trigger | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| PONY-001 | `extension/src/sidepanel/App.tsx` | Mock bridge status ("Bridge Standby") in Side Panel UI | Visual status only, no live WS polling yet | Phase 3 WebSocket bridge implementation | Active |

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
- **Verdict:** Phase 1 complete and production-grade. Ready to advance to Phase 2.
- **Lines of Code:** ~1,200 LoC (Clean-room, zero copied code).

### Phase 2: Visual Editor Panel & Live CSS
- **Review Date:** 2026-10-18
- **Scope:** React visual editor with 3-tab navigation (**Edit** / **Page** / **CSS**), real-time CSS mutations via `useLiveStyles`, Undo/Redo history stack with keyboard shortcuts, interactive Spacing box model visualizer, presets manager via `chrome.storage.local`, viewport screenshot capture, and agent prompt exporter.
- **Findings:**
  - *Design & Usability:* Dark-themed, high-contrast accessible UI (WCAG AA compliant) fitting smoothly inside Chrome's native side panel dimensions.
  - *State Management:* History stack cleanly separates undo/redo operations with immutability, enabling instant rollback of visual tweaks.
  - *Quality & Verification:* 14/14 automated unit tests passing across shared packages. Clean Vite production bundle.
  - *Shortcuts Taken:* None new added; PONY-001 remains active awaiting Phase 3.
- **Verdict:** Phase 2 complete and verified. Ready to begin Phase 3 (Local Bridge & MCP Server).
- **Lines of Code:** ~950 LoC added.

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

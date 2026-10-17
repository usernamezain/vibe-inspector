# Technical Debt & Ponytail Review Ledger

> Maintained via `/ponytail-review` and `/ponytail-debt` at the conclusion of every phase.
> Every deliberate shortcut is recorded with its ceiling and upgrade trigger.

---

## Active Shortcuts & Debt

| ID | Location | Shortcut Taken | Ceiling / Limit | Upgrade Trigger | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *No shortcuts active in Phase 0.* | - | - | - | - | - |

---

## Phase Review Log

### Phase 0: Research & Setup
- **Review Date:** 2026-10-18
- **Scope:** Phase 0 architecture, documentation, security constraints, and reference analysis.
- **Findings:**
  - *Must fix:* None.
  - *Should fix:* Ensure bridge rejection tests in Phase 3 test all attack vectors (DNS rebinding, missing token, wrong Origin, web page fetch attempts).
  - *Nice to have:* Consider supporting both Stdio and SSE MCP transports out of the box in the bridge.
- **Verdict:** Clean setup. Ready for Phase 0 approval.
- **Lines of Code:** Minimal specification and documentation only.

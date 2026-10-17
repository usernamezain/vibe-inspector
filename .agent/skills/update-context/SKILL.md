---
name: update-context
description: Instructions and standard operating procedure for updating CONTEXT.md, docs/ROADMAP.md, docs/DECISIONS.md, and docs/TECH-DEBT.md at phase boundaries.
---

# Update Context Skill

Maintain documentation integrity across all phases of development.

## When to Run
- **At the end of every Phase:** Mandatory before declaring a phase complete.
- **Mid-Phase on Major Architecture Shifts:** When an ADR is decided, a constraint is adjusted, or an unforeseen blocker appears.

## 1. Updating `docs/ROADMAP.md`
1. Check off completed items in the detailed task breakdown: `[ ]` -> `[x]`.
2. Update the task metadata: `(Owner: Agent, Status: Complete, Notes: <concise summary of implementation>)`.
3. Update the Progress Overview table at the top of `docs/ROADMAP.md` with current percentage and phase status.

## 2. Updating `CONTEXT.md`
Update the `## Current status` block in `CONTEXT.md`:
```markdown
## Current status
Phase: <current phase number> of 7 (<phase name>).
Done: <comma-separated list of built capabilities>.
In progress: <active work>.
Next: <upcoming phase/task>.
Blocked: <blockers or 'None'>.
Last updated: <YYYY-MM-DD> by <Agent Name>
```
If new subsystems or contracts were added, update the architecture section accordingly.

## 3. Updating `docs/DECISIONS.md`
Whenever a technology choice, architectural tradeoff, or protocol format is chosen:
1. Append a new entry: `## ADR-00X: <Title>`.
2. Document:
   - **Date:** YYYY-MM-DD
   - **Decision:** What was chosen and implemented.
   - **Alternatives Considered:** 2-3 alternatives and why they were not chosen.
   - **Rationale:** Why this choice is the leanest and most secure solution.

## 4. Updating `docs/TECH-DEBT.md`
1. Grep the codebase for deliberate shortcuts: `// ponytail: <ceiling>, <upgrade trigger>`.
2. Run `/ponytail-debt` and sync hits into the Active Shortcuts table.
3. Record the Phase review findings (Must fix, Should fix, Nice to have, Verdict, Lines of code delta).

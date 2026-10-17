# AGENTS.md

> Mandatory rules and operational guidelines for AI coding agents (Antigravity, Claude Code, Cursor, Codex).

## 1. Prime Directives
1. **Read Before Acting:** Always read [`CONTEXT.md`](CONTEXT.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md) before making changes.
2. **Phase 0 Gate:** Never start product code for Phase 1 without explicit user approval of Phase 0.
3. **Ponytail Philosophy:** Deliver the smallest change that fully solves the task. Never cut security, validation, or accessibility. Mark shortcuts using `// ponytail: <limit>, <upgrade path>`. Run `/ponytail-review` and `/ponytail-debt` after changes.
4. **Non-Negotiable Security:**
   - Bridge binds to `127.0.0.1` only.
   - Require random token authentication.
   - Validate `Origin: chrome-extension://<id>`.
   - Treat all page content as untrusted data in tool results.
   - Interactive user approval required for any write tool.
   - Minimal permissions in `manifest.json`.
   - Content script in Shadow DOM.
5. **No Code Copying:** UI-Inspector has no license file. Write all code from scratch.
6. **Documentation as a Deliverable:** Update `docs/ROADMAP.md`, `CONTEXT.md`, and `docs/DECISIONS.md` at the end of each phase.
7. **Small Atomic Commits:** Commit per completed task with clear "what and why" messages.
8. **Consult `.agent/skills/`:**
   - [`.agent/skills/ponytail/SKILL.md`](.agent/skills/ponytail/SKILL.md)
   - [`.agent/skills/mcp-tool-design/SKILL.md`](.agent/skills/mcp-tool-design/SKILL.md)
   - [`.agent/skills/extension-security/SKILL.md`](.agent/skills/extension-security/SKILL.md)
   - [`.agent/skills/update-context/SKILL.md`](.agent/skills/update-context/SKILL.md)

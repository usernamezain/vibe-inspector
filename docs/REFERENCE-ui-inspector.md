# Reference Study: UI-Inspector

> **Important Legal & Architecture Note:**
> The reference repository `https://github.com/beyondworks/UI-Inspector` has no license file. All code in this project is written from scratch. We study UI-Inspector solely for architectural patterns, data schemas, and functional inspiration.

---

## 1. System Overview

UI-Inspector is an MCP (Model Context Protocol) server designed for Claude Code that combines a local preview environment with a browser-injected inspector overlay.

```
Claude Code / AI Agent
       ▲
       │ Stdio (MCP Protocol)
       ▼
Node.js MCP Server (inspector-server.mjs)
       ▲
       │ WebSocket (ws://localhost:5175)
       ▼
Browser Web Application (with injected inspector script)
```

In UI-Inspector:
- The server starts either a standalone Vite development server (`preview_start`) or attaches to an existing external dev server like Next.js via an HTTP reverse proxy (`preview_attach`).
- The reverse proxy (`inject-proxy.mjs`) strips CSP headers and injects a monolithic vanilla JS client script (`inspector-inject.mjs`).
- The client communicates back to Node over an unauthenticated WebSocket bridge (`ws-bridge.mjs`).

---

## 2. Tools Analysis (18 Tools)

UI-Inspector exposes 18 tools grouped into 4 categories:

### A. Preview Tools (8)
1. `preview_start`: Scaffolds a project (React, Vue, or Vanilla) and launches a Vite development server.
2. `preview_attach`: Proxies an external dev server (e.g. Next.js on port 3000) and injects the inspector script.
3. `preview_update`: Writes or deletes files in the preview project; Vite HMR applies updates live.
4. `preview_status`: Returns current session state, uptime, active file tree, and URLs.
5. `preview_stop`: Terminates the session, closes proxy/WebSocket, and optionally deletes project files.
6. `preview_export`: Converts the project into a target framework (Next.js, Vite React, Astro, Nuxt, etc.) and packages it as a ZIP.
7. `preview_screenshot`: Captures a screenshot (stub in reference).
8. `preview_errors`: Retrieves recent runtime and console errors captured from the browser page.

### B. Inspector Tools (4)
9. `preview_select_element`: Enables or disables inspection mode or returns the currently selected element.
10. `inspector_get_selection`: Returns the most recently selected element across active sessions (or for a specific session), including code location, selector, styles, bounding box, and UI/UX terminology.
11. `inspector_clear_selection`: Resets current element selection.
12. `inspector_highlight`: Agent-to-user visual pointing; flashes a red outline and label on a specific element identified by selector or `data-at` location.

### C. Annotation Tools (4)
13. `annotation_list`: Lists all pins and comments left by the user in the browser, filterable by `open`, `resolved`, or `all`.
14. `annotation_resolve`: Marks annotations as resolved (changing the pin to a green checkmark) with an optional resolution note, or reopens them.
15. `annotation_remove`: Deletes annotations by ID or clears all.
16. `annotation_to_prompt`: Compiles annotations into an Agentation-style markdown task list suitable for agents without MCP access.

### D. Knowledge / Ontology Tools (2)
17. `query_ontology`: Queries an in-memory design ontology store (DesignArtifact, VisualNode, StyleToken, LayoutConstraint, Interaction, RuleConstraint).
18. `validate_design`: Evaluates a design JSON object against rule constraints (contrast ratios, tap targets, typography hierarchy, 4px grid spacing).

---

## 3. Data Shapes & Core Algorithms

### 3.1 Element Information Shape (`ElementInfo`)
```typescript
interface ElementInfo {
  tag: string;
  className: string;
  textContent: string; // Truncated to 200 chars
  boundingRect: { x: number; y: number; width: number; height: number };
  computedStyles: Record<string, string>; // Filtered to key visual properties
  sourceLocation: { file: string; line: number; column: number } | null;
  parentChain: string[]; // e.g. ["div#app", "main.content", "section"]
  uiTerm: string; // Inferred UX term, e.g. "Card", "Button", "Sticky Header"
  uiDescription: string;
  elementName: ElementNameInfo;
  cssPath: string; // Hierarchical CSS selector path
  htmlSnippet: string; // Outer HTML truncated to 400 chars
}
```

### 3.2 Element Name Priority Hierarchy
UI-Inspector determines the human-readable and selector name through a strict priority waterfall:
1. `id` (`#id`)
2. `data-testid`, `data-test`, `data-cy`, `data-qa`
3. `aria-label`
4. `aria-labelledby` (resolves referenced element text up to 120 chars)
5. `label[for]` (text of linked label up to 120 chars)
6. Component name (inferred from `data-at` file path, e.g. `Button.tsx` -> `Button`)
7. `name` attribute
8. `alt` attribute
9. `title` attribute
10. `placeholder` attribute
11. First CSS class (`.class`)
12. Tag name (fallback)

### 3.3 Source Location Strategy (`data-at`)
UI-Inspector provides a Babel plugin (`babel-plugin-source-loc.mjs`) that intercepts `JSXOpeningElement` and attaches:
```jsx
<div data-at="src/components/Header.tsx:14:5">...</div>
```
When an element is clicked, `target.getAttribute("data-at")` directly yields file, line, and column.

### 3.4 Annotation & Pin System
- **Pins:** Rendered as floating circles numbered sequentially (`#1`, `#2`...) anchored to element bounding boxes (`rect.right - 11`, `rect.top - 11`).
- **Multi-pin Stacking:** When multiple pins share an element, they offset horizontally (`- offset * 24px`).
- **Marquee Drag Multi-select:** Users can drag a selection box across elements. An algorithm filters the matches down to outermost ancestors and caps the group at 30 items.
- **Page Scoping:** Annotations record `pageUrl`. The client only displays pins where `new URL(ann.pageUrl).pathname === location.pathname`.
- **SPA Routing Awareness:** A `requestAnimationFrame` loop monitors `location.pathname` changes and re-evaluates pin visibility across client-side page transitions.

---

## 4. Key Ideas to Adopt

1. **Element Name Priority Hierarchy**: The 12-tier identification algorithm is reliable and provides human-readable element identifiers for AI prompts.
2. **UI/UX Terminology Engine**: Mapping tags, ARIA roles, class names, and computed layout properties into standard design terms ("Card", "Sticky Header", "Metric Card", "Accordion Trigger") gives the AI agent semantic context far beyond raw DOM tags.
3. **Agentation-Style Numbered Pin Annotations**: Visual pins anchored to elements, resolve/reopen states, and multi-element grouping provide an intuitive review feedback loop.
4. **Copy Prompt Fallback**: Generating a formatted Markdown task list allows users to copy feedback directly into chat-only interfaces (ChatGPT, Claude web, Cursor chat without MCP).
5. **Agent-to-User Pointing (`inspector_highlight`)**: Allowing the AI agent to scroll and flash-highlight an element in the browser gives two-way visual feedback.

---

## 5. Architectural Differences & Improvements in Our Product

| Feature / Concern | UI-Inspector (Reference) | Our Product |
| :--- | :--- | :--- |
| **Delivery Model** | Injected via proxy into local Vite/Next.js dev servers | **Chrome Extension (Manifest V3)** running on **any** live site |
| **In-Page Isolation** | Injected directly into the host DOM (`data-gemini-inspector` attributes), risking style leakage and conflict with host page CSS | **Shadow DOM (`attachShadow`)** for content script UI, guaranteeing 100% style isolation |
| **Visual Editing** | No live CSS editor (read-only inspector and annotation pins) | **Side Panel Visual CSS Editor** with tabs (Edit / Page / CSS) and property controls (Appearance, Typography, Spacing, Border, Layout, etc.) |
| **Host Security & CSP** | Strips CSP headers in proxy; breaks if host page enforces strict CSP or iframe sandboxing | Runs via **Chrome Extension isolated world**; adheres to MV3 strict CSP with zero inline remote code |
| **WebSocket Security** | Unauthenticated WebSocket on `localhost` accepting any origin; vulnerable to malicious website probing | **Token-authenticated WebSocket** bound strictly to `127.0.0.1`, validates `Origin: chrome-extension://<id>`, rejects unknown origins |
| **React 19 Compatibility** | Depended on legacy Babel attribute injection; broken by React 19 fiber changes (`_debugSource` removal) | Integrates with modern build plugins (`code-inspector-plugin`, `locatorjs`), bundler source maps, and provides a clean "unmapped" fallback |
| **Tailwind Support** | Output only raw CSS snippets | **Tailwind-aware class synthesis** for visual property edits when Tailwind is detected |
| **Safety Gates** | AI could write or stop servers without user confirmation | **Explicit user approval gates** in the Extension UI for any code write or mutation |
| **Accessibility** | Overlay had basic elements | Full keyboard navigation (`Tab`, `Esc`, arrow keys), ARIA labels, and WCAG contrast conformance |

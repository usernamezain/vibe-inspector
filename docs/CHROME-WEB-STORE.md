# Chrome Web Store Submission & Listing Package

> Assets, copy, metadata, and single-purpose justifications for Chrome Web Store submission.

---

## 1. General Listing Information

- **Extension Name:** Vibe Inspector
- **Category:** Developer Tools
- **Version:** 1.0.0
- **Language:** English
- **Pricing:** Free / Open Source

---

## 2. Store Copy

### 2.1 Short Description (132 character limit)
> Visual element inspector, live CSS editor, and authenticated local MCP bridge for AI coding assistants (Antigravity, Claude, Cursor).

### 2.2 Detailed Description
```markdown
Click any element in the browser, tweak it visually, and your AI assistant receives the exact element, its source location, and its styles, then writes the code.

Vibe Inspector is the missing bridge between your browser and AI coding assistants like Antigravity, Claude Code, Cursor, and Codex. Instead of copying messy HTML or guessing CSS class names and line numbers, you inspect and edit elements visually in Chrome. The local MCP (Model Context Protocol) bridge feeds structured, verified element data directly into your agentic workflow.

KEY FEATURES:

🎯 Precision Element Picker & Inspector:
- Hover over any element on any web page with smooth bounding box outlines and UI badges.
- Automatic element naming waterfall: IDs, data-testid, ARIA labels, component names, and semantic tags.
- Robust, reliable CSS selector generation with fallback paths.

✏️ Live CSS Visual Tweaker:
- Tweak appearance, typography, colors, borders, and flexbox alignment with instant live updates.
- Interactive Spacing Box Model visualizer (margins & paddings).
- Full Undo/Redo history stack with Ctrl+Z / Ctrl+Y keyboard shortcuts.
- Native EyeDropper API: Sample any pixel on your desktop screen with zero bundle bloat.
- Save and load visual presets in local storage.

✨ Tailwind CSS Synthesizer & Token Extractor:
- Automatically translates CSS edits into idiomatic Tailwind utility classes.
- Detects CSS variables and design tokens (`--color-*`, `--spacing-*`, `--radius-*`) in real time.
- Instant "Copy Tailwind Classes" and "Copy Prompt for AI" buttons.

📌 Visual Numbered Pins & Annotations:
- Drop numbered pins anchored to DOM elements inside an encapsulated Shadow DOM.
- Multi-pin horizontal fan-out offsets so stacked pins never hide each other.
- Drag-to-select marquee multi-element grouping (capped at 30 outermost ancestors).
- Page-scoped persistence surviving page reloads and SPA client-side route transitions.
- In-browser resolve and reopen controls with modification notes.

♿ Accessibility & Core Web Vitals:
- Built-in axe-core accessibility engine for on-demand WCAG 2.1 AA audits.
- Real-time Core Web Vitals summary (LCP, CLS, FCP, TTFB).

🔒 Non-Negotiable Localhost Security:
- 100% local execution: The bridge binds strictly to 127.0.0.1.
- Cryptographically secure token authentication + Origin header verification. Web pages cannot access the bridge.
- Interactive User Approval Gate: The AI agent cannot mutate page styles without explicit human approval in Chrome.
- Zero analytics, zero external tracking servers, zero bundled secrets.
```

---

## 3. Single Purpose Justification (for Web Store Reviewers)
> **Single Purpose:** "To provide frontend developers with visual element inspection, live CSS editing, and local Model Context Protocol (MCP) bridging to AI coding assistants."

---

## 4. Permission Justifications

| Requested Permission | Reason for Request |
| :--- | :--- |
| `activeTab` | Required to inspect DOM elements and apply live style modifications on the active tab when the developer clicks the inspector. |
| `sidePanel` | Required to display the visual editor panels, pin manager, and connection wizard in Chrome's native side panel. |
| `storage` | Required to persist user presets, connection credentials (port/token), and page-scoped annotations locally. |
| `scripting` | Required to mount the isolated Shadow DOM overlay (`#vibe-inspector-host`) onto inspected tabs. |

---

## 5. Visual Asset Specifications

- **Icons:**
  - `extension/icons/icon16.png` (16x16 px)
  - `extension/icons/icon48.png` (48x48 px)
  - `extension/icons/icon128.png` (128x128 px)
- **Promo Tiles:**
  - Small promo tile: 440 x 280 px
  - Marquee promo tile: 1400 x 560 px
- **Screenshots (1280 x 800 px):**
  1. *Screenshot 1 - Visual Picker:* Hovering an element with UI badges and dimensional bounds.
  2. *Screenshot 2 - Visual Editor & Spacing Box:* Live CSS tweaking and Spacing box model in the Side Panel.
  3. *Screenshot 3 - Tailwind Synthesizer:* Live Tailwind utility class generation and CSS variable matching.
  4. *Screenshot 4 - Numbered Pins & Marquee Grouping:* Interactive pins and marquee selection on a live web page.
  5. *Screenshot 5 - MCP Bridge & Approval Gate:* Antigravity/Claude Code prompt workflow with the human approval modal.

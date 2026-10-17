# Vibe Inspector: Visual Editor Panel UI Specification

> **Status:** Specification Phase (Approved Architecture)  
> **Target Package:** `packages/extension/src/sidepanel/` & `packages/extension/src/content/`  
> **Visual Identity:** Polished, calm dark theme, dense yet legible, monospace values, soft periwinkle accent.  

---

## 1. Visual Character & Design System Tokens

The panel UI is hosted entirely inside Chrome's native Side Panel (`sidepanel.html`), isolated from host page CSS. It embodies a calm, focused, developer-grade aesthetic. No fake "pro" badges, no upsell banners, and zero third-party branding clones.

### 1.1 Color Tokens & Surfaces

```css
:root {
  /* Surface Layers (Dark Theme Default) */
  --vi-surface-base: #131418;       /* Root side panel background */
  --vi-surface-card: #1a1b20;       /* Section cards & containers */
  --vi-surface-input: #22242a;      /* Input fields & select boxes */
  --vi-surface-input-hover: #282a32;/* Input hover state */
  --vi-surface-elevated: #2d3039;   /* Menus, tooltips & popovers */

  /* Borders & Dividers */
  --vi-border-subtle: #272932;      /* Thin dividers between sections */
  --vi-border-input: #323540;       /* Neutral input field borders */
  --vi-border-focus: #7c8cf8;       /* Periwinkle focus ring */

  /* Text & Labels */
  --vi-text-primary: #e6e8ee;       /* Values, headers, active chips */
  --vi-text-secondary: #9da2b4;     /* Section titles, descriptions */
  --vi-text-muted: #5e6375;         /* Unset properties ("-"), defaults, units */
  --vi-text-monospace: "JetBrains Mono", "Fira Code", monospace;

  /* Accent (Soft Periwinkle Blue) */
  --vi-accent-base: #7c8cf8;        /* Active tab indicator, focused sliders, linked icons */
  --vi-accent-hover: #929ff9;       /* Accent hover */
  --vi-accent-subtle: rgba(124, 140, 248, 0.12); /* Active segmented button background */
  --vi-accent-dot: #818cf8;         /* Indicator dot for user-modified properties */

  /* Status Colors */
  --vi-status-success: #34d399;     /* Approved / passing audits */
  --vi-status-warning: #fbbf24;     /* Token violations / contrast warnings */
  --vi-status-danger: #f87171;      /* Axe a11y violations / reset actions */

  /* Radii */
  --vi-radius-sm: 6px;              /* Small icons & segmented pills */
  --vi-radius-md: 8px;              /* Standard controls, dropdowns, inputs */
  --vi-radius-lg: 12px;             /* Card containers, box model visualizer */
  --vi-radius-pill: 9999px;         /* Badges & indicator dots */

  /* Motion & Timings */
  --vi-duration-fast: 120ms;        /* Instant hover & press feedback */
  --vi-duration-normal: 180ms;      /* Tab switches, accordion expands */
  --vi-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Light Theme Alternate (Honors prefers-color-scheme or manual toggle) */
[data-theme="light"] {
  --vi-surface-base: #f8f9fc;
  --vi-surface-card: #ffffff;
  --vi-surface-input: #f1f3f7;
  --vi-surface-input-hover: #e8ecf2;
  --vi-surface-elevated: #ffffff;
  --vi-border-subtle: #e5e8ef;
  --vi-border-input: #d6dae3;
  --vi-border-focus: #5d6ff4;
  --vi-text-primary: #181a20;
  --vi-text-secondary: #585e70;
  --vi-text-muted: #959cb0;
  --vi-accent-base: #5d6ff4;
  --vi-accent-hover: #4a5df2;
  --vi-accent-subtle: rgba(93, 111, 244, 0.10);
  --vi-accent-dot: #5d6ff4;
}
```

---

## 2. Global Input Mechanics & Interactions

Every visual control conforms to standard high-efficiency micro-interactions:

1. **Numeric Field Drag-to-Scrub:**
   - Any numeric label has `cursor: col-resize`.
   - Uses Pointer Events (`onPointerDown`, `setPointerCapture`, `onPointerMove`, `onPointerUp`).
   - Dragging horizontally scrubs the value smoothly at 60 fps.
   - Holding `Shift` accelerates step by `10x`.
   - Holding `Alt` / `Option` decelerates step to `0.1x`.
2. **Keyboard Arrow Stepping:**
   - Inside numeric inputs, `ArrowUp` / `ArrowDown` step value by `1`.
   - `Shift + Arrow` steps by `10`.
   - `Alt + Arrow` steps by `0.1`.
3. **Unit Dropdowns & Unset State:**
   - Supported units: `px`, `%`, `em`, `rem`, `vw`, `vh`, `auto`.
   - If a CSS property is unset on the element, the input displays a muted `"-"`.
   - Inherited/default browser values are styled with muted text (`--vi-text-muted`).
   - Any property explicitly set/modified by the user displays normal font weight and a small 4px accent dot (`--vi-accent-dot`) beside the property label.
   - **Double-clicking any label** resets that specific property to its original inherited/computed value.
4. **Group Link Toggles:**
   - Grouped properties (Border Radius 4 corners, Spacing 4 sides, Flex/Grid gaps) feature an interactive Link icon button.
   - When **Linked**: changing any field updates all 4 synchronized sides simultaneously.
   - When **Unlinked**: each corner/side is edited independently.
5. **Multi-Selection "Mixed" Display:**
   - When multiple elements are selected via marquee or pin grouping, conflicting values display `"Mixed"`. Editing the field harmonizes all selected elements to the new value.
6. **Undo / Redo & Change Batching:**
   - `Ctrl+Z` / `Cmd+Z` performs Undo; `Shift+Ctrl+Z` / `Shift+Cmd+Z` performs Redo.
   - Per-element and global reset buttons ("Reset Element", "Reset All").
   - DOM writes on the host page are batched via `requestAnimationFrame` to eliminate layout thrashing.
   - Debounced bridge notifications (`~100ms`) prevent socket flooding.
7. **Collapsible Sections:**
   - Accordion sections remember their expanded/collapsed state in `chrome.storage.local`.
   - Optional sections (Image, Background, Spacing, Border, Box Shadow) have a `+` button in the header when omitted, and a `-` button when added.

---

## 3. Tab 1: Edit Tab Specification

```
┌────────────────────────────────────────────────────────┐
│ [  Edit  ]   [  Page  ]   [  CSS  ]                    │
├────────────────────────────────────────────────────────┤
│ <div> div.relative.w-full.flex.p-4...  [Copy] [Nav ◀▲▼▶]│
├────────────────────────────────────────────────────────┤
│ SENSITIVITY [═══════════●════════] Deep                │
│ [ ⚡ Browse Presets... ] [💾 Save] [⇥ Import/Export]    │
├────────────────────────────────────────────────────────┤
│ ▼ APPEARANCE                                           │
│   Opacity: [ 100 ] %      Rotation: [  0  ] deg        │
│   Border Radius: [ 8 ][ 8 ][ 8 ][ 8 ] px  [🔗 Linked]   │
│   Blend Mode: [ Normal               ▼ ]               │
├────────────────────────────────────────────────────────┤
│ ▼ TYPOGRAPHY                                           │
│   Font: [ Inter, -apple-system       ▼ ]               │
│   Weight: [ 600 - SemiBold           ▼ ]               │
│   Size: [ 16 ] px         Line Ht: [ 24 ] px [px/unit] │
│   Spacing: [ -0.2 ] px    Align: [ ⫷ | ≡ | ⫸ | ≣ ]     │
│   Color: [■ #FFFFFF ] [💧 EyeDropper]                   │
├────────────────────────────────────────────────────────┤
│ ▶ Image               [+]                              │
│ ▼ BACKGROUND          [-]                              │
│   Type: [ Solid | Linear | Radial | Image ]            │
│   Color: [■ rgba(15, 23, 42, 0.8) ]                   │
│   Backdrop Blur: [ 12 ] px                             │
├────────────────────────────────────────────────────────┤
│ ▼ SPACING & BOX MODEL [-]                              │
│   [ Margin / Padding Interactive Canvas ]              │
│   Width: [ 320 ] px       Height: [ Auto ]             │
│   Min W: [ - ]            Max W: [ 1200 ] px           │
├────────────────────────────────────────────────────────┤
│ ▼ BORDER              [-]                              │
│   Width: [ 1 ] px         Style: [ Solid     ▼ ]       │
│   Color: [■ #334155 ]     Sides: [ All sides 🔗 ]      │
├────────────────────────────────────────────────────────┤
│ ▼ BOX SHADOW          [-]                              │
│   Layer 1: [ 0 ] [ 4 ] [ 12 ] [ 0 ] [■ rgba(0,0,0,.2)] │
│   [+ Add Layer]   [Text Shadow Variant Toggle]         │
├────────────────────────────────────────────────────────┤
│ ▼ LAYOUT                                               │
│   Display: [ Flex                    ▼ ]               │
│   Direction: [ Row → ]    Wrap: [ Wrap ⤶ ]             │
│   Justify: [ Space Between           ▼ ]               │
│   Align: [ Center                    ▼ ]               │
│   Row Gap: [ 16 ] px      Col Gap: [ 16 ] px [🔗]      │
├────────────────────────────────────────────────────────┤
│ 📷 EXPORT                                              │
│   Scale: [ 1x | 2x | 3x ]   [✓] Transparent BG         │
│   [ Export Element as PNG ]  [ Export Viewport as PNG ] │
└────────────────────────────────────────────────────────┘
```

### 3.1 Detail Breakdown of Edit Controls

- **Element Header & Hierarchy Navigator:**
  - Selector Chip: Formatted monospace class names truncated with ellipsis, tooltip displays full CSS path, single click copies selector to clipboard.
  - Directional Navigation Buttons: `▲` Parent element, `▼` First child, `◀` Previous sibling, `▶` Next sibling.
- **Sensitivity Slider:**
  - Range `0` to `100`.
  - At `0-25` (Exact): Target the deepest leaf node (`<span>`, `<svg>`, `<b>`).
  - At `50` (Balanced): Target UI components (`<button>`, `<a>`, `<input>`).
  - At `75-100` (Semantic Containers): Snaps up to nearest major container (`<nav>`, `<header>`, `<article>`, `<form>`, `.card`).
- **Presets Manager:**
  - Built-in presets: "Glass Surface", "Soft Card", "Pill Button", "Elevated Modal", "Muted Border".
  - Hovering a preset triggers a real-time live preview on the host element; mouseout reverts; clicking applies permanently.
  - Save preset button captures active modifications and prompts for a name.
  - Stored in `chrome.storage.local` with JSON import/export buttons.
- **Typography Engine:**
  - Autocompletes from fonts dynamically detected on the host web page (`document.fonts`) plus standard modern system stacks.
  - Font weight dropdown inspects available `@font-face` rules when accessible.
  - Line height supports both absolute (`px`) and unitless multiplier (`1.5`).
- **Interactive Box Model Diagram:**
  - Visual 2D nesting of Margin (outer orange-tinted rect) and Padding (inner green-tinted rect) with center content box.
  - Each number in the diagram is directly clickable and draggable.
- **Exporting (CDP vs Canvas Tradeoff):**
  - Allows exporting active element or full viewport at `1x`, `2x`, or `3x` resolution with optional transparent background.
  - Default: Fast, zero-permission `chrome.tabs.captureVisibleTab` with bounding box crop.
  - Opt-in CDP Mode: `Page.captureScreenshot` via `chrome.debugger` for full-page or hidden scroll regions (displays Chrome warning banner).

---

## 4. Tab 2: Page Tab Specification (Proposed)

The Page Tab provides a macro-level overview of the entire host page's design language, performance, and accessibility health.

```
┌────────────────────────────────────────────────────────┐
│ [  Edit  ]   [  Page  ]   [  CSS  ]                    │
├────────────────────────────────────────────────────────┤
│ QUICK TOGGLES                                          │
│   [ Outline All Elements ]      [ Spacing Heatmap ]    │
│   [ Disable Animations ]        [ Force Dark/Light ]   │
├────────────────────────────────────────────────────────┤
│ RESPONSIVE PRESETS                                     │
│   [ 320 Mobile ] [ 375 iPhone ] [ 768 Tablet ]         │
│   [ 1024 Laptop ] [ 1440 Desktop ] [ Custom: 1200px ]  │
├────────────────────────────────────────────────────────┤
│ FONTS IN USE (3)                                       │
│   • Inter: 400 (62 elements), 600 (18), 700 (9)        │
│   • JetBrains Mono: 400 (12 elements)                  │
├────────────────────────────────────────────────────────┤
│ COLOR PALETTE DETECTED (6)                             │
│   [■ #0f172a (48)] [■ #3b82f6 (14)] [■ #64748b (31)]  │
│   [■ #10b981 (6)]  [■ #ef4444 (2)]  [■ #ffffff (94)]  │
├────────────────────────────────────────────────────────┤
│ CSS VARIABLES DETECTED (24)                            │
│   --primary: #3b82f6          --radius: 8px            │
│   --font-sans: 'Inter'        --spacing-4: 16px        │
├────────────────────────────────────────────────────────┤
│ DETECTED SPACING SCALE                                 │
│   Grid standard: 4px / 8px (92% compliance)            │
│   Outliers detected: 13px (2 elements), 7px (1 element)│
└────────────────────────────────────────────────────────┘
```

- **Quick Toggles:**
  - `Outline All Elements`: Injects non-intrusive 1px colored outlines to inspect layout boundaries without shifting layout.
  - `Spacing Heatmap`: Overlays margin/padding highlights on all visible elements.
  - `Disable Animations`: Sets `* { animation-duration: 0s !important; transition-duration: 0s !important; }` to inspect static UI.
  - `Emulate Color Scheme`: Switches `prefers-color-scheme` between `dark` and `light`.
- **Palette & Font Extractors:** Scans visible DOM nodes, aggregates counts, and allows clicking any color or font to highlight all matching elements.

---

## 5. Tab 3: CSS & Changes Tab Specification (Proposed)

The CSS tab acts as the bridge between visual tweaks and actual codebases.

```
┌────────────────────────────────────────────────────────┐
│ [  Edit  ]   [  Page  ]   [  CSS  ]                    │
├────────────────────────────────────────────────────────┤
│ MODIFIED ELEMENTS (2)                  [ Reset All ]   │
│                                                        │
│ ▼ button.bg-blue-600.px-4 (3 changes)                  │
│   [Diff View] [Revert Element]                         │
│   + border-radius: 9999px;                             │
│   + padding: 12px 24px;                                │
│   - background-color: rgb(37, 99, 235);                │
│   + background-color: rgb(79, 70, 229);                │
├────────────────────────────────────────────────────────┤
│ EXPORT FORMATS                                         │
│   [ Copy CSS ]             [ Copy Tailwind Classes ]   │
│   [ Copy React Style Obj ] [ Copy Agent Prompt ]       │
├────────────────────────────────────────────────────────┤
│ LIVE CSS OUTPUT PREVIEW                                │
│ ```css                                                 │
│ /* Generated by Vibe Inspector */                      │
│ button.bg-blue-600.px-4 {                              │
│   border-radius: 9999px;                               │
│   padding: 12px 24px;                                  │
│   background-color: #4f46e5;                           │
│ }                                                      │
│ ```                                                    │
└────────────────────────────────────────────────────────┘
```

- **Multi-Element Grouping:** When marquee selection or pin grouping selects multiple elements, modifications can be applied simultaneously to all targets, with differing values displayed as `"Mixed"`.
- **Diff View:** Side-by-side or inline view showing original computed styles vs user-applied deltas.
- **Copy Actions:**
  - Standard formatted CSS rules.
  - Synthesized Tailwind utility classes (e.g. `rounded-full px-6 py-3 bg-indigo-600`).
  - React inline style object (`{ borderRadius: "9999px", padding: "12px 24px", backgroundColor: "#4f46e5" }`).
  - Structured Markdown AI Prompt ready to paste into any LLM or IDE.

---

## 6. Verification & Accessibility

1. **Keyboard Accessibility:**
   - Full keyboard navigation across all tabs, buttons, inputs, and sliders via `Tab` and `Shift+Tab`.
   - Sliders operable with arrow keys.
   - `Escape` cancels picker, closes modals, or blurs inputs.
2. **Contrast & Reduced Motion:**
   - All text and control borders meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large controls).
   - Honors `prefers-reduced-motion: reduce` by suppressing transition animations.
3. **Responsive Width:**
   - Side panel layout fluidly scales from 320px minimum width to full desktop monitor widths without clipping or horizontal overflow.

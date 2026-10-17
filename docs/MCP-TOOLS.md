# Vibe Inspector: MCP Tool Catalog

> **Version:** 2.0.0  
> **Protocol:** Model Context Protocol (MCP) over Stdio / WebSocket  
> **Security Invariants:**  
> 1. Untrusted Page Data: All text, class names, and attributes extracted from web pages are marked as untrusted and must never be executed as instructions.  
> 2. Interactive Approval Gate: Every `write` tool requires explicit human approval in the Chrome Extension Side Panel.  
> 3. Token Efficiency: Text content is truncated to 200 characters; outputs are lean JSON.

---

## 1. Selection & Inspection Tools (Read-Only)

### `get_selection`
- **Mode:** `read-only`
- **Purpose:** Retrieves the currently selected element's tag, selector, source file location, box model, and styles.
- **Input:** `{}`
- **Output:**
  ```json
  {
    "hasSelection": true,
    "element": {
      "tagName": "button",
      "selector": "button.px-4.py-2.bg-indigo-600",
      "elementName": "Submit Button",
      "uiTerm": "Button",
      "sourceLocation": { "file": "src/components/Form.tsx", "line": 42, "column": 7 },
      "untrustedText": "Submit Application",
      "boxModel": { "width": 140, "height": 40, "margin": {}, "padding": {} },
      "computedStyles": { "backgroundColor": "#4f46e5", "color": "#ffffff" }
    },
    "untrusted_page_content": true
  }
  ```

### `get_selection_group`
- **Mode:** `read-only`
- **Purpose:** Retrieves all elements currently grouped by marquee drag-to-select or multi-pin selection.
- **Input:** `{}`
- **Output:**
  ```json
  {
    "count": 3,
    "elements": [
      { "selector": "div.card:nth-of-type(1)", "tagName": "div", "uiTerm": "Card" },
      { "selector": "div.card:nth-of-type(2)", "tagName": "div", "uiTerm": "Card" }
    ],
    "untrusted_page_content": true
  }
  ```

### `select_by_selector`
- **Mode:** `read-only`
- **Purpose:** Selects an element on the host page matching a CSS selector and opens its properties in the side panel.
- **Input:**
  ```json
  {
    "selector": "string (CSS selector to select)"
  }
  ```
- **Output:** `{ "success": true, "selector": "string", "matched": true }`

### `select_relative`
- **Mode:** `read-only`
- **Purpose:** Moves active selection relative to the current element in the DOM tree.
- **Input:**
  ```json
  {
    "direction": "parent | child | next | prev"
  }
  ```
- **Output:** `{ "success": true, "previousSelector": "string", "newSelector": "string" }`

### `get_element_tree`
- **Mode:** `read-only`
- **Purpose:** Returns a depth-limited hierarchical DOM subtree of the selected element.
- **Input:**
  ```json
  {
    "selector": "string (optional, defaults to current selection)",
    "depth": "number (optional, 1-4, default 2)"
  }
  ```
- **Output:** `{ "tree": { "tag": "div", "classes": ["card"], "children": [...] } }`

### `get_computed_styles`
- **Mode:** `read-only`
- **Purpose:** Fetches computed CSS styles filtered by property group to conserve context tokens.
- **Input:**
  ```json
  {
    "selector": "string (optional, defaults to current selection)",
    "group": "appearance | typography | spacing | border | shadow | layout | all"
  }
  ```
- **Output:** `{ "selector": "string", "group": "typography", "styles": { "fontFamily": "Inter", "fontSize": "16px" } }`

### `get_applied_rules`
- **Mode:** `read-only`
- **Purpose:** Returns matched CSS rules, stylesheets, and cascade inheritance (via CDP or styleSheet reflection).
- **Input:** `{ "selector": "string" }`
- **Output:** `{ "matchedCSSRules": [{ "selector": ".btn-primary", "source": "globals.css:102", "style": {} }] }`

### `get_box_model`
- **Mode:** `read-only`
- **Purpose:** Returns exact pixel measurements for margin, border, padding, and content box.
- **Input:** `{ "selector": "string (optional)" }`
- **Output:** `{ "width": 300, "height": 120, "margin": [16,0,16,0], "padding": [8,12,8,12], "border": [1,1,1,1] }`

### `get_layout_info`
- **Mode:** `read-only`
- **Purpose:** Detailed layout properties including flex/grid direction, tracks, gap, and alignment.
- **Input:** `{ "selector": "string (optional)" }`
- **Output:** `{ "display": "flex", "flexDirection": "row", "justifyContent": "space-between", "gap": "16px" }`

### `get_stacking_info`
- **Mode:** `read-only`
- **Purpose:** Analyzes stacking context, z-index hierarchy, opacity, and transform containment.
- **Input:** `{ "selector": "string (optional)" }`
- **Output:** `{ "zIndex": 10, "createsStackingContext": true, "reason": "position: relative with z-index" }`

### `force_pseudo_state`
- **Mode:** `read-only`
- **Purpose:** Temporarily forces pseudo-classes (`:hover`, `:focus`, `:active`) on an element and reads updated styles.
- **Input:**
  ```json
  {
    "selector": "string (optional)",
    "state": "hover | focus | active"
  }
  ```
- **Output:** `{ "forcedState": "hover", "updatedStyles": { "backgroundColor": "#4338ca" } }`

### `get_accessibility_info`
- **Mode:** `read-only`
- **Purpose:** Extracts ARIA role, computed accessible name, keyboard focusability, and states (`aria-expanded`, `aria-hidden`).
- **Input:** `{ "selector": "string (optional)" }`
- **Output:** `{ "role": "button", "accessibleName": "Close dialog", "focusable": true, "ariaHidden": false }`

---

## 2. Page-Level Tools (Read-Only)

### `get_page_info`
- **Mode:** `read-only`
- **Purpose:** Returns URL, title, document dimensions, and viewport size.
- **Input:** `{}`
- **Output:** `{ "url": "http://localhost:3000/dashboard", "title": "Dashboard", "viewport": { "width": 1440, "height": 900 } }`

### `get_fonts_in_use`
- **Mode:** `read-only`
- **Purpose:** Scans the active page for all loaded font families, weights, and usage counts.
- **Input:** `{}`
- **Output:** `{ "fonts": [{ "family": "Inter", "weights": [400, 600, 700], "elementCount": 89 }] }`

### `get_color_palette`
- **Mode:** `read-only`
- **Purpose:** Aggregates all unique background and text colors utilized across visible elements.
- **Input:** `{}`
- **Output:** `{ "colors": [{ "hex": "#4f46e5", "count": 14, "sampleSelectors": ["button.primary"] }] }`

### `get_css_variables`
- **Mode:** `read-only`
- **Purpose:** Lists all CSS custom properties (`--*`) declared on `:root` or body.
- **Input:** `{}`
- **Output:** `{ "variables": { "--primary": "#4f46e5", "--radius-md": "8px", "--spacing-4": "16px" } }`

### `get_spacing_scale`
- **Mode:** `read-only`
- **Purpose:** Analyzes margins, paddings, and gaps to detect compliance against a 4px/8px grid system.
- **Input:** `{}`
- **Output:** `{ "baseGrid": 4, "compliancePercent": 94, "outliers": [{ "selector": "header", "property": "margin-top", "value": "13px" }] }`

### `screenshot`
- **Mode:** `read-only`
- **Purpose:** Captures high-resolution PNG viewport or cropped element snapshot.
- **Input:**
  ```json
  {
    "target": "viewport | element (optional, default viewport)",
    "selector": "string (optional when target is element)",
    "scale": "number (optional, 1 | 2 | 3, default 2)"
  }
  ```
- **Output:** `{ "mimeType": "image/png", "data": "base64...", "width": 1440, "height": 900 }`

### `get_console_errors`
- **Mode:** `read-only`
- **Purpose:** Retrieves recent browser console runtime errors and warnings from the active tab.
- **Input:** `{}`
- **Output:** `{ "errors": [{ "message": "Failed to load resource: net::ERR_CONNECTION_REFUSED", "timestamp": 123456789 }] }`

### `get_network_failures`
- **Mode:** `read-only`
- **Purpose:** Lists recent HTTP 4xx/5xx requests or aborted network fetches.
- **Input:** `{}`
- **Output:** `{ "failures": [{ "url": "/api/user", "status": 404, "statusText": "Not Found" }] }`

### `capabilities_list`
- **Mode:** `read-only`
- **Purpose:** Queries bridge and extension status, indicating which tools and integrations (e.g. axe-core, CDP) are live.
- **Input:** `{}`
- **Output:** `{ "bridgeVersion": "2.0.0", "connectedExtension": true, "toolsAvailable": ["get_selection", "apply_style_changes", ...] }`

### `bridge_status`
- **Mode:** `read-only`
- **Purpose:** Returns WebSocket port, connection latency, and active tab metadata.
- **Input:** `{}`
- **Output:** `{ "connected": true, "port": 8765, "origin": "chrome-extension://...", "activeTabId": 102 }`

---

## 3. Editing Tools (Write, Approval Required)

> **All editing tools mutate the live host page or browser storage. Execution is halted until the developer clicks "Approve" in the extension.**

### `apply_style_changes`
- **Mode:** `write (approval required)`
- **Purpose:** Applies batch style modifications to the host web page for live visual review (does not touch source code).
- **Input:**
  ```json
  {
    "selector": "string",
    "styles": { "borderRadius": "9999px", "backgroundColor": "#4f46e5" }
  }
  ```
- **Output:** `{ "success": true, "appliedStyles": { ... } }`

### `revert_changes`
- **Mode:** `write (approval required)`
- **Purpose:** Reverts visual modifications on a single element or page-wide.
- **Input:**
  ```json
  {
    "selector": "string (optional, omits to reset entire page)"
  }
  ```
- **Output:** `{ "reverted": true, "affectedElements": 1 }`

### `get_change_log`
- **Mode:** `read-only`
- **Purpose:** Returns the active delta stack of all style changes made during the session.
- **Input:** `{}`
- **Output:** `{ "changes": [{ "selector": "button", "property": "padding", "oldValue": "8px", "newValue": "16px" }] }`

### `apply_preset`
- **Mode:** `write (approval required)`
- **Purpose:** Applies a named preset (e.g. "Glass Surface", "Soft Card") to an element.
- **Input:**
  ```json
  {
    "presetName": "string",
    "selector": "string (optional)"
  }
  ```
- **Output:** `{ "success": true, "preset": "Glass Surface", "appliedProperties": [...] }`

### `list_presets`
- **Mode:** `read-only`
- **Purpose:** Lists all built-in and user-saved presets from `chrome.storage.local`.
- **Input:** `{}`
- **Output:** `{ "presets": [{ "name": "Glass Surface", "isBuiltIn": true, "styles": { ... } }] }`

### `save_preset`
- **Mode:** `write (approval required)`
- **Purpose:** Saves current element modifications as a reusable named preset.
- **Input:**
  ```json
  {
    "name": "string",
    "styles": "object"
  }
  ```
- **Output:** `{ "saved": true, "name": "Custom Pill" }`

### `set_viewport_size`
- **Mode:** `write (approval required)`
- **Purpose:** Resizes browser tab viewport to evaluate responsive breakpoints.
- **Input:**
  ```json
  {
    "width": "number (320 - 2560)",
    "height": "number (480 - 1440)"
  }
  ```
- **Output:** `{ "width": 375, "height": 812, "emulated": true }`

### `export_element_png`
- **Mode:** `write (approval required)`
- **Purpose:** Captures and downloads an element as a transparent PNG file.
- **Input:**
  ```json
  {
    "selector": "string (optional)",
    "scale": "number (1, 2, or 3, default 2)"
  }
  ```
- **Output:** `{ "downloaded": true, "filename": "element-button.png" }`

### `export_viewport_png`
- **Mode:** `write (approval required)`
- **Purpose:** Captures and downloads the active viewport as a PNG file.
- **Input:** `{ "scale": "number (optional, default 2)" }`
- **Output:** `{ "downloaded": true, "filename": "viewport-1440x900.png" }`

---

## 4. Change Export Tools (Read-Only)

### `changes_to_css`
- **Mode:** `read-only`
- **Purpose:** Formats all active session modifications as standard CSS rules.
- **Input:** `{}`
- **Output:**
  ```json
  {
    "css": "button.primary {\n  border-radius: 9999px;\n  background-color: #4f46e5;\n}"
  }
  ```

### `changes_to_tailwind`
- **Mode:** `read-only`
- **Purpose:** Synthesizes session modifications into Tailwind CSS utility classes.
- **Input:** `{}`
- **Output:**
  ```json
  {
    "tailwindMap": {
      "button.primary": "rounded-full bg-indigo-600 px-6 py-3"
    }
  }
  ```

### `changes_to_react_style`
- **Mode:** `read-only`
- **Purpose:** Formats modifications into React camelCase style objects.
- **Input:** `{}`
- **Output:**
  ```json
  {
    "reactStyles": {
      "button.primary": { "borderRadius": "9999px", "backgroundColor": "#4f46e5" }
    }
  }
  ```

### `changes_to_prompt`
- **Mode:** `read-only`
- **Purpose:** Generates a structured markdown instructions prompt for AI agents.
- **Input:** `{}`
- **Output:**
  ```json
  {
    "prompt": "### UI Change Request\n\nTarget Element: `button.primary`\nSource File: `src/components/Button.tsx:14`\n\nApply these CSS updates:\n- `border-radius`: `9999px` (`rounded-full`)\n- `background-color`: `#4f46e5` (`bg-indigo-600`)\n"
  }
  ```

---

## 5. Source & Verify Loop Tools (The Key Vibe-Coder Loop)

### `resolve_source_location`
- **Mode:** `read-only`
- **Purpose:** Deep-crawls DOM attributes (`data-at`, `data-inspector-line`, `data-loc`) to find exact source file and line.
- **Input:** `{ "selector": "string (optional)" }`
- **Output:** `{ "file": "src/components/Header.tsx", "line": 28, "column": 5, "componentName": "Header", "framework": "react" }`

### `find_component`
- **Mode:** `read-only`
- **Purpose:** Best-effort detection of component boundary name and declaration file.
- **Input:** `{ "selector": "string (optional)" }`
- **Output:** `{ "componentName": "UserProfileCard", "file": "src/components/UserProfileCard.tsx" }`

### `open_in_editor`
- **Mode:** `write (approval required)`
- **Purpose:** Opens source file in local IDE at exact line number via OS protocol handler (`vscode://file/...`).
- **Input:**
  ```json
  {
    "file": "string",
    "line": "number",
    "column": "number (optional)"
  }
  ```
- **Output:** `{ "opened": true, "uri": "vscode://file/src/components/Header.tsx:28:5" }`

### `wait_for_reload`
- **Mode:** `read-only`
- **Purpose:** Blocks until Vite/Webpack HMR updates or a page reload occurs following an agent file edit.
- **Input:** `{ "timeoutMs": "number (optional, default 5000)" }`
- **Output:** `{ "reloaded": true, "hmrUpdated": true, "elapsedMs": 420 }`

### `assert_style`
- **Mode:** `read-only`
- **Purpose:** After an agent edits source code, verifies the browser page now matches intended styles.
- **Input:**
  ```json
  {
    "selector": "string (optional)",
    "expected": { "fontSize": "16px", "borderRadius": "12px" }
  }
  ```
- **Output:**
  ```json
  {
    "pass": true,
    "results": [
      { "property": "fontSize", "expected": "16px", "actual": "16px", "pass": true },
      { "property": "borderRadius", "expected": "12px", "actual": "12px", "pass": true }
    ]
  }
  ```

### `compare_before_after`
- **Mode:** `read-only`
- **Purpose:** Captures visual diff of an element before and after an edit; returns diff percentage and base64 diff image.
- **Input:** `{ "selector": "string (optional)" }`
- **Output:** `{ "diffPercentage": 2.4, "pixelDifferences": 142, "hasVisualChange": true }`

---

## 6. Design QA Tools (Read-Only)

### `check_accessibility`
- **Mode:** `read-only`
- **Purpose:** Runs in-browser `axe-core` automated WCAG 2.1 AA audit on page or element.
- **Input:** `{ "selector": "string (optional)" }`
- **Output:** `{ "violationsCount": 1, "violations": [{ "id": "color-contrast", "impact": "serious", "help": "Elements must have sufficient color contrast" }] }`

### `check_contrast`
- **Mode:** `read-only`
- **Purpose:** Calculates WCAG contrast ratio between text color and effective background color.
- **Input:** `{ "selector": "string (optional)" }`
- **Output:** `{ "ratio": 3.8, "aaLargePass": true, "aaNormalPass": false, "recommendation": "Increase font-weight or darken background" }`

### `check_tap_targets`
- **Mode:** `read-only`
- **Purpose:** Inspects interactive elements (`<button>`, `<a>`, `<input>`) to ensure min 48x48px touch targets.
- **Input:** `{}`
- **Output:** `{ "suboptimalTargets": [{ "selector": "nav a.link", "width": 24, "height": 18, "recommendation": "Increase padding" }] }`

### `check_spacing_consistency`
- **Mode:** `read-only`
- **Purpose:** Verifies that all paddings, margins, and gaps adhere to a 4px or 8px grid.
- **Input:** `{ "grid": "number (4 or 8, default 4)" }`
- **Output:** `{ "violations": [{ "selector": "aside", "property": "margin-right", "value": "11px", "suggested": "12px" }] }`

### `find_token_violations`
- **Mode:** `read-only`
- **Purpose:** Detects hardcoded colors, spacing, and radii that should map to existing CSS custom properties.
- **Input:** `{}`
- **Output:** `{ "violations": [{ "selector": "div.banner", "property": "backgroundColor", "raw": "#3b82f6", "suggestedToken": "var(--primary)" }] }`

### `check_responsive`
- **Mode:** `read-only`
- **Purpose:** Checks for horizontal scrollbars, layout overflows, or clipped text across standard breakpoints (375, 768, 1024, 1440).
- **Input:** `{}`
- **Output:** `{ "issues": [{ "breakpoint": 375, "hasHorizontalOverflow": false, "clippedElements": [] }] }`

### `compare_to_reference_image`
- **Mode:** `read-only`
- **Purpose:** Compares the rendered page or element against a user-supplied reference PNG (Figma export).
- **Input:**
  ```json
  {
    "referenceImageBase64": "string",
    "selector": "string (optional)"
  }
  ```
- **Output:** `{ "similarityScore": 0.96, "mismatchPercent": 4.0 }`

---

## 7. Annotations Tools (Visual Pinning & Bug Reporting)

### `list_annotations`
- **Mode:** `read-only`
- **Purpose:** Lists all visual numbered pins on current page with coordinates, selectors, notes, and status.
- **Input:** `{}`
- **Output:** `{ "annotations": [{ "id": "pin-1", "number": 1, "selector": "h1", "note": "Make font bolder", "status": "open" }] }`

### `add_annotation`
- **Mode:** `write (approval required)`
- **Purpose:** Programmatically places a new numbered pin on an element.
- **Input:**
  ```json
  {
    "selector": "string",
    "note": "string",
    "proposedStyles": "object (optional)"
  }
  ```
- **Output:** `{ "id": "pin-2", "number": 2, "created": true }`

### `resolve_annotation`
- **Mode:** `write (approval required)`
- **Purpose:** Marks a pin as resolved with resolution note and git commit reference.
- **Input:**
  ```json
  {
    "id": "string",
    "resolutionNote": "string (optional)",
    "commitHash": "string (optional)"
  }
  ```
- **Output:** `{ "id": "pin-1", "status": "resolved" }`

### `reopen_annotation`
- **Mode:** `write (approval required)`
- **Purpose:** Re-opens a previously resolved pin.
- **Input:** `{ "id": "string" }`
- **Output:** `{ "id": "pin-1", "status": "open" }`

### `remove_annotation`
- **Mode:** `write (approval required)`
- **Purpose:** Deletes an annotation pin from page and storage.
- **Input:** `{ "id": "string" }`
- **Output:** `{ "deleted": true }`

### `annotations_to_prompt`
- **Mode:** `read-only`
- **Purpose:** Compiles all active visual pins into a structured markdown prompt for code modifications.
- **Input:** `{}`
- **Output:**
  ```json
  {
    "prompt": "## Visual Bug Reports (2 Pins)\n\n### Pin 1: `button.submit`\n- Note: Increase contrast\n- Source: `src/Form.tsx:32`\n"
  }
  ```

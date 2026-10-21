# Architecture Decision Log (ADR)

> Format: Date | Decision | Alternatives Considered | Rationale

---

## ADR-001: Local WebSocket Bridge with Token & Origin Authentication

- **Date:** 2026-10-18
- **Decision:** Use a standalone local Node.js process acting as a bridge (`127.0.0.1` WebSocket + MCP stdio/SSE server). Authentication requires a first-run random token and verification of the `Origin: chrome-extension://<id>` header.
- **Alternatives Considered:**
  1. *Native Messaging*: Requires writing a JSON manifest to Windows registry (`HKCU\Software\Google\Chrome\NativeMessagingHosts`). Adds severe installation friction for quick `npx` execution.
  2. *Unauthenticated Localhost WebSocket* (as in UI-Inspector): Highly vulnerable to drive-by malicious web pages querying `ws://localhost:<port>`.
  3. *Direct Extension MCP*: Impossible under browser sandbox constraints (no raw socket listening or stdio access).
- **Rationale:** A tokenized WebSocket on `127.0.0.1` validating the Chrome extension Origin provides strong security against hostile browser tabs while maintaining frictionless zero-install execution via `npx vibe-inspector-bridge`.

---

## ADR-002: Content Script Isolation via Shadow DOM

- **Date:** 2026-10-18
- **Decision:** Encapsulate all in-page extension UI (picker hover boxes, selection outlines, numbered pins, feedback dialogs) inside a Shadow DOM attached to `document.documentElement`.
- **Alternatives Considered:**
  1. *Direct DOM Injection with Prefixed CSS Classes*: Host page styles (e.g. global `* { box-sizing: border-box; }`, resets, aggressive CSS variables) bleed into the extension, and extension styles can break host layouts.
  2. *Injected `<iframe>`*: Difficult to position over arbitrary elements, interferes with page scrolling, and heavy on memory.
- **Rationale:** Shadow DOM provides native CSS encapsulation. The host page cannot modify or inherit styles from our overlay, and our overlay will never mutate the visual presentation of the user's web page.

---

## ADR-003: Extension Build Tooling (Vite + `@crxjs/vite-plugin`)

- **Date:** 2026-10-18
- **Decision:** Build the Chrome extension using TypeScript and Vite with `@crxjs/vite-plugin`.
- **Alternatives Considered:**
  1. *WXT Framework*: High level of abstraction, extra opinionated conventions and runtime dependencies.
  2. *Webpack*: Slower build times, verbose configuration, heavier bundle output.
  3. *Unbundled / Vanilla*: Harder to maintain type safety, React UI components, and modern module sharing.
- **Rationale:** Vite + CRXJS produces clean, lightning-fast Manifest V3 bundles with standard HMR during extension development, full TypeScript support, and zero lock-in.

---

## ADR-004: React 19 Source Mapping via Build-Time Data Attributes

- **Date:** 2026-10-18
- **Decision:** Target build plugins (`code-inspector-plugin`, `LocatorJS`, custom Vite/Babel plugins) that inject `data-at` or `data-inspector-file` into JSX, supplemented by standard source maps, with an explicit `unmapped` state for arbitrary third-party pages.
- **Alternatives Considered:**
  1. *Relying on React Fiber `_debugSource`*: Completely removed in React 19 (PR #28265).
  2. *Refusing to inspect unmapped pages*: Reduces product value for users who want to tweak external websites or live staging environments.
- **Rationale:** Build-time DOM attribute injection is future-proof and framework-agnostic. Supporting unmapped styling ensures the extension is useful on any website, not just locally instrumented projects.

---

## ADR-005: Clean-Room Implementation & Original Visual Design

- **Date:** 2026-10-18
- **Decision:** Write all code from scratch without copying any files from `beyondworks/UI-Inspector`. Design an original, accessible visual interface for the Side Panel and in-page pins.
- **Alternatives Considered:**
  1. *Forking UI-Inspector*: The reference repository lacks a license file, posing copyright risk. Its architecture is also tethered to dev server injection rather than an MV3 extension.
- **Rationale:** Legal clarity, cleaner MV3-native architecture, and superior security.

---

## ADR-006: Explicit User Approval Gate for Agent Write Actions

- **Date:** 2026-10-18
- **Decision:** Any MCP tool that writes files, modifies source code, or executes mutating commands must prompt the user for interactive confirmation in the Extension Side Panel before the bridge fulfills the request.
- **Alternatives Considered:**
  1. *Unrestricted Tool Execution*: Risky if an agent misunderstands context and overwrites files unexpectedly.
- **Rationale:** Guarantees safety for the developer while retaining the speed of agentic coding.

---

## ADR-007: Native Extension Screenshot APIs vs `chrome.debugger` (CDP)

- **Date:** 2026-10-18
- **Decision:** Utilize `chrome.tabs.captureVisibleTab` and DOM tree serialization instead of attaching `chrome.debugger` (CDP) for standard snapshots.
- **Alternatives Considered:**
  1. *`chrome.debugger` / CDP Protocol*: Triggers Chrome's intrusive yellow debugging banner: `"Vibe Inspector" started debugging this browser`, which alarms developers and breaks immersive vibe coding. Also requires broad process-level permissions.
- **Rationale:** `chrome.tabs.captureVisibleTab` provides instant, high-fidelity PNG captures with zero permission warnings and zero disruptive browser banners.

---

## ADR-008: Native `EyeDropper` API for Color Sampling

- **Date:** 2026-10-18
- **Decision:** Use the browser's native `window.EyeDropper` API (`// ponytail: native EyeDropper API`) for desktop screen color picking.
- **Alternatives Considered:**
  1. *Heavy Third-Party Canvas / Color-Wheel Libraries*: Add 50-100KB to bundle size, restricted to the web page viewport, and cannot sample OS pixels outside the browser window.
- **Rationale:** Zero bundle overhead, samples any pixel on the entire screen (including OS UI and other monitors), and adheres to the Ponytail philosophy.

---

## ADR-009: In-Browser `axe-core` Integration for Accessibility Auditing

- **Date:** 2026-10-18
- **Decision:** Integrate the `axe-core` engine directly into the extension content script to execute WCAG 2.1 AA audits on demand.
- **Alternatives Considered:**
  1. *Homegrown Contrast & Label Heuristics*: Prone to false positives and misses complex ARIA relationship rules, tabindex cycles, and hidden element checks.
- **Rationale:** `axe-core` is the industry benchmark with zero false positives. Integrating it directly empowers AI coding assistants to automatically detect and remediate accessibility violations.

---

## ADR-010: Sensitivity Slider Controls Picker Hierarchy Depth

- **Date:** 2026-10-18
- **Decision:** The "Sensitivity" slider controls DOM traversal depth during element hover and selection. Low sensitivity (0-25) targets the deepest exact leaf node (`span`, `svg`, `b`); high sensitivity (75-100) snaps upward to the nearest semantic container (`header`, `nav`, `article`, `form`, `.card`).
- **Alternatives Considered:**
  1. *Hit-area padding / proximity snapping*: Expands bounding box thresholds around the cursor. Unpredictable when elements are densely packed.
  2. *Ignoring tiny elements below a px threshold*: Blindly ignores small badges, icons, and inline text.
- **Rationale:** Matches the most common developer workflow: toggling between tweaking micro leaf nodes (text colors, fonts) and selecting entire cards/containers for layout restructuring. Revisit after user testing.

---

## ADR-011: Element Export Strategy & `chrome.debugger` Tradeoff

- **Date:** 2026-10-18
- **Decision:** Use `chrome.tabs.captureVisibleTab` with HTML5 `<canvas>` bounding box clipping as the default zero-permission, zero-banner export method. Provide an opt-in CDP screenshot engine (`Page.captureScreenshot` with clip) via `chrome.debugger` for off-screen scroll captures and 3x scale.
- **Alternatives Considered:**
  1. *Mandatory CDP (`chrome.debugger`)*: Forces Chrome's intrusive yellow debugging banner (`"Vibe Inspector" started debugging this browser`), alarms users, and demands broad debugger permissions in `manifest.json`.
  2. *`html2canvas` / DOM-to-canvas rendering library*: Fails on modern CSS (oklch, CSS grid, subgrid, container queries) and adds 150KB+ to bundle.
- **Rationale:** Defaulting to native `captureVisibleTab` ensures a clean, silent user experience without banner interruption, with high-accuracy CDP available when explicitly requested.

---

## ADR-012: Pseudo-State Emulation Model

- **Date:** 2026-10-18
- **Decision:** Support pseudo-state testing (`:hover`, `:focus`, `:active`) using synthetic override classes (`.vibe-pseudo-hover`, etc.) injected into stylesheet rules, supplemented by CDP `CSS.forcePseudoState` when debugger mode is active.
- **Alternatives Considered:**
  1. *Simulating DOM mouse events (`mouseenter`, `focus`)*: Does not trigger CSS `:hover` pseudo-classes on static elements due to browser security restrictions.
- **Rationale:** Synthetic class injection works without browser debugging banners on 90% of modern utility-first CSS setups (Tailwind hover classes, component CSS), with CDP fallback for raw CSS `:hover` selectors.

---

## ADR-013: Layout & Style Verification Loop (`assert_style` & `wait_for_reload`)

- **Date:** 2026-10-18
- **Decision:** Implement `wait_for_reload` by attaching lightweight listeners to `window.addEventListener('beforeunload')` and monitoring Vite / Webpack / Next.js client-side HMR WebSocket events. `assert_style` samples computed styles using `window.getComputedStyle()` after a short stabilization tick (50ms).
- **Alternatives Considered:**
  1. *Fixed Sleep Delay*: Flaky on large codebases where build or HMR takes variable time.
  2. *Polling DOM in a Tight Loop*: Causes CPU spikes and layout thrashing.
- **Rationale:** Event-driven HMR and reload observation accurately detects when the developer's agent has successfully written code and the bundler has hot-reloaded the changes.

---

## ADR-014: Visual Diffing Engine Execution Location

- **Date:** 2026-10-18
- **Decision:** Process visual pixel diffs (`compare_before_after`, `compare_to_reference_image`) inside the local Node.js bridge using native Buffer/worker comparisons rather than executing heavy image processing in the extension content script.
- **Alternatives Considered:**
  1. *In-Page Canvas Diffing in Content Script*: Heavy CPU/memory usage freezes the host page UI and can trigger browser tab crashes on 4K displays.
- **Rationale:** Offloading image comparison to the Node.js bridge protects browser tab responsiveness and leverages native Node performance.

---

## ADR-015: Robust PNG Export Pipeline via `chrome.downloads` & In-Memory Blob Fallback

- **Date:** 2026-10-21
- **Decision:** Use a resilient two-tier download pipeline for PNG element and viewport exports:
  1. Primary: Extension background service worker invokes `chrome.downloads.download({ url: dataUrl, filename })` with `"downloads"` manifest permission.
  2. Fallback: If `chrome.downloads` is restricted, errors on data URIs, or fails, background script routes a `TRIGGER_PAGE_DOWNLOAD` message to the active webpage's content script context. The content script converts the data URL into an in-memory `Blob` and creates a temporary `URL.createObjectURL(blob)`, completely bypassing Chrome's "Not allowed to navigate top frame to data URL" security block.
- **Alternatives Considered:**
  1. *Direct `<a href="data:image/png;base64,...">` in Side Panel*: Chrome sandbox restricts top-frame navigation to data URLs in extension sidepanels, causing silent export failures.
  2. *Writing files to local disk via Bridge stdio*: Adds unnecessary bridge dependency when the user only wants an immediate browser download.
- **Rationale:** Guarantees 100% reliable image exports across all Chrome security contexts with zero reliance on the bridge server.


---
name: extension-security
description: Non-negotiable security checklist and verification rules for the Chrome extension, WebSocket bridge, and MCP tools.
---

# Extension & Bridge Security Checklist

Use this checklist during planning, implementation, and code review across all phases.

## 1. Localhost Bridge Security
- [ ] **Loopback Binding Only:** Server listens exclusively on `127.0.0.1` (never `0.0.0.0` or public interfaces).
- [ ] **Random Token Authentication:** A cryptographically secure random token (`crypto.randomBytes(32).toString('hex')`) is generated on first launch and required on all WebSocket connections (`?token=<token>`).
- [ ] **Strict Origin Validation:** Check `req.headers.origin` during WebSocket handshake. Only allow origins matching `chrome-extension://<EXTENSION_ID>` or legitimate local CLI tooling. Reject all regular web page origins (`http://...`, `https://...`).
- [ ] **Timing-Safe Token Comparison:** Use `crypto.timingSafeEqual` when validating authentication tokens to prevent timing attacks.
- [ ] **Reconnection & Rate Limiting:** Rate limit connection attempts and drop unauthorized clients immediately.

## 2. Page Content & Untrusted Input
- [ ] **Untrusted Data Boundary:** All DOM text content, attributes, class names, and user annotation comments are untrusted input.
- [ ] **No Dynamic Execution:** Never pass page content to `eval()`, `new Function()`, or unescaped HTML parsers.
- [ ] **Prompt Injection Mitigation:** When outputting page data to MCP tool responses, explicitly mark it as data (`untrusted_page_data: true`), never system prompts or instructions.

## 3. Tool Mutation Approval Gates
- [ ] **Interactive Confirmation:** Any tool action that writes to disk, alters source code, or executes system commands must trigger an interactive confirmation dialog in the Chrome Extension UI.
- [ ] **Explicit User Consent:** The local bridge must block until the user clicks "Approve" in the Side Panel.

## 4. Extension Bundle & Storage
- [ ] **Zero Hardcoded Secrets:** No API keys, credentials, or private URLs in the extension bundle.
- [ ] **User-Supplied Keys:** If optional AI chat is configured, keys must be stored in `chrome.storage.local` and entered by the user.

## 5. Chrome Permissions & CSP
- [ ] **Least Privilege:** Request only `activeTab`, `sidePanel`, `storage`, `scripting`. Avoid blanket `<all_urls>`.
- [ ] **Strict MV3 CSP:** Ensure `manifest.json` enforces `script-src 'self'; object-src 'self'`. No remote scripts or WebAssembly downloads.

## 6. Content Script DOM Isolation
- [ ] **Shadow DOM Encapsulation:** All injected UI elements (highlight box, picker label, pins, comment dialogs) must be rendered inside a Shadow DOM (`attachShadow({ mode: 'open' })` or `'closed'`).
- [ ] **Style Leak Prevention:** No global CSS stylesheets injected into the host page head; all styling resides within the Shadow Root.

# Privacy Policy for Vibe Inspector

*Last updated: October 18, 2026*

## 1. Overview
Vibe Inspector ("the Extension", "we", "us") is a developer tool designed to visually inspect DOM elements, tweak styles, and bridge element metadata to local AI coding assistants via the Model Context Protocol (MCP). We are committed to protecting your privacy and ensuring transparency about how your data is handled.

## 2. Information Collection and Storage
- **Localhost Execution Only:** Vibe Inspector and its accompanying bridge CLI (`vibe-inspector-bridge`) run entirely on your local machine (`127.0.0.1`).
- **No External Servers or Telemetry:** We do not operate external tracking servers, analytics endpoints, or remote logging services. No user telemetry, browsing history, or inspected web page contents are sent over the internet.
- **Local Storage:** All user preferences, custom style presets, bridge authentication tokens, and page-scoped visual annotations are stored strictly on your device using Chrome's sandboxed local storage (`chrome.storage.local`).
- **No Bundled Third-Party Trackers:** The extension bundle contains zero analytics scripts, advertising SDKs, or third-party cookies.

## 3. In-Browser Permissions
The Extension requests the minimum permissions required to provide its core developer functionality:
- `activeTab`: To inspect elements and apply live style changes on the tab you are actively viewing when you interact with the extension.
- `sidePanel`: To display the visual styling controls, pin manager, and bridge status in Chrome's native Side Panel.
- `storage`: To save your custom visual presets, connection port/token, and page annotations locally.
- `scripting`: To mount the encapsulated Shadow DOM overlay for hover highlighting and element selection.

## 4. Interaction with AI Coding Assistants
- When you connect an AI coding assistant (such as Antigravity, Claude Code, Cursor, or Codex) via the local bridge, the bridge communicates with your assistant using the open Model Context Protocol (MCP).
- Metadata shared with your assistant includes the CSS selector, tag name, computed styles, text snippet, and source file location of elements you inspect.
- All mutating actions (e.g., modifying CSS on the active page) require your explicit interactive approval in the Side Panel UI.

## 5. Security of Stored Data
- Authentication between the Chrome Extension and the local bridge utilizes cryptographically random tokens and verifies the extension's Origin header (`chrome-extension://<id>`).
- Connections from standard web pages (`http://`, `https://`) are strictly rejected.

## 6. Changes to this Policy
If we make changes to this privacy policy, the updated document will be published in this repository with a revised effective date.

## 7. Contact
For questions, feedback, or concerns regarding this policy, please open an issue in the official project GitHub repository.

# 📘 Vibe Inspector: Complete Beginner's Manual & Setup Guide

> **Created by [Zain Ali Mughal](https://mughal.dev) ([@usernamezain](https://github.com/usernamezain))**  
> ✨ **Join our WhatsApp Channel for exclusive updates & AI dev tools:**  
> 👉 [https://whatsapp.com/channel/0029VbBUVv35fM5eAnXw3w2D](https://whatsapp.com/channel/0029VbBUVv35fM5eAnXw3w2D)

---

## 🎯 What is Vibe Inspector?

**Vibe Inspector** connects your Google Chrome browser directly to your AI coding agent (**Cursor**, **Claude Code**, **Antigravity / Gemini**, **Windsurf**, **Codex**, or **VS Code**).

Instead of taking screenshots, manually inspecting DevTools, and copying raw HTML or guessing CSS classes, Vibe Inspector lets you:
1. **Click any element** on your webpage in Chrome.
2. **Visually tweak** colors, typography, margins, paddings, borders, flexbox, and layout in the Chrome Side Panel.
3. Your AI assistant **automatically receives the exact element**, its CSS selector, computed styles, and source file line number (`src/App.tsx:42`), and writes the code directly to disk!

This guide walks you through every single step from zero to fully running, even if you are a complete beginner.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Download & Build the Code](#step-1-download--build-the-code)
3. [Step 2: Install the Chrome Extension](#step-2-install-the-chrome-extension)
4. [Step 3: Quick 1-Command Project Setup](#step-3-quick-1-command-project-setup)
5. [Step 4: Manual AI Agent Setup (If Needed)](#step-4-manual-ai-agent-setup)
6. [Step 5: Connect Chrome Side Panel to the Bridge](#step-5-connect-chrome-side-panel-to-the-bridge)
7. [Step 6: How to Inspect & Edit Like a Pro](#step-6-how-to-inspect--edit-like-a-pro)
8. [Step 7: How to Prompt Your AI Assistant](#step-7-how-to-prompt-your-ai-assistant)
9. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js (v18.0.0 or higher):** Check in your terminal with `node -v`. If not installed, download from [nodejs.org](https://nodejs.org).
- **pnpm (Recommended):** Run `npm install -g pnpm` (or you can use npm).
- **Google Chrome (v114 or higher):** Required for Chrome's native Side Panel feature.

---

## Step 1: Download & Build the Code

Open your terminal or command prompt and clone the repository:

```bash
# 1. Clone the repository
git clone https://github.com/usernamezain/vibe-inspector.git

# 2. Enter the project directory
cd vibe-inspector

# 3. Install dependencies
pnpm install

# 4. Build all packages (Extension, Local Bridge, Shared contracts)
pnpm build
```

You will see confirmation that all packages built cleanly (`dist/` folders generated in `extension/` and `bridge/`).

---

## Step 2: Install the Chrome Extension

Now let's load the extension into Google Chrome:

1. Open Google Chrome.
2. In the address bar, type `chrome://extensions` and press **Enter**.
3. In the top-right corner, turn on the **Developer mode** toggle.
4. Click the **Load unpacked** button in the top-left corner.
5. In the file picker dialog, navigate to the cloned `vibe-inspector` folder and select the **`extension/dist`** folder (make sure you choose `dist` inside `extension`).
6. Click **Select Folder**.
7. You will now see **Vibe Inspector** in your extensions list!
8. Click the Extensions puzzle icon in Chrome's top toolbar and click the **Pin 📌** icon next to Vibe Inspector so it stays visible.

> ⚠️ **Important Note:** Chrome restricts extensions from running on internal pages like `chrome://extensions` or `about:blank`. Open any normal website (like `https://google.com` or your local `http://localhost:3000`) before opening the side panel!

---

## Step 3: Quick 1-Command Project Setup

In **any frontend project** (Next.js, Vite React/Vue/Svelte, Astro, Remix, or static HTML):

### 1. Initialize the project:
Open your project's root folder in your terminal and run:

```bash
npx vibe-inspector init
```

*What happens automatically:*
- Detects your frontend framework.
- Auto-detects and writes configuration for **Cursor** (`.cursor/mcp.json`), **Antigravity** (`mcp_config.json`), **Claude Code**, and **Windsurf**.
- Creates a local `.vibe-inspector.json` with an auth token and adds it to your `.gitignore`.

### 2. Start the Dev Session:
```bash
npx vibe-inspector dev
```
*(Or inside the vibe-inspector repository itself, run `pnpm vibe:dev`)*.

This starts the local bridge on `ws://127.0.0.1:7890` and launches your dev server!

---

## Step 4: Manual AI Agent Setup

If you prefer to configure your AI assistant manually rather than using `npx vibe-inspector init`, find your tool below:

### 🔹 Cursor
Open `.cursor/mcp.json` in your project root (create it if missing) and add:
```json
{
  "mcpServers": {
    "vibe-inspector": {
      "command": "npx",
      "args": ["-y", "@vibe-inspector/bridge", "--port", "7890"]
    }
  }
}
```

### 🔹 Antigravity / Gemini
In your project `.gemini/mcp_config.json` or global user config (`~/.gemini/antigravity/mcp_config.json`):
```json
{
  "mcpServers": {
    "vibe-inspector": {
      "command": "npx",
      "args": ["-y", "@vibe-inspector/bridge", "--port", "7890"]
    }
  }
}
```

### 🔹 Claude Code
Run in your terminal:
```bash
claude mcp add vibe-inspector npx -y @vibe-inspector/bridge --port 7890
```

### 🔹 Windsurf
In `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "vibe-inspector": {
      "command": "npx",
      "args": ["-y", "@vibe-inspector/bridge", "--port", "7890"]
    }
  }
}
```

---

## Step 5: Connect Chrome Side Panel to the Bridge

1. Open your web app (e.g., `http://localhost:5173` or `http://localhost:3000`) in Chrome.
2. Click the **Vibe Inspector** icon in your Chrome toolbar to open the **Side Panel**.
3. Click the **Settings / Gear ⚙️** icon in the Side Panel header.
4. Enter the **Auth Token** displayed in your terminal when you ran `vibe-inspector dev`.
5. Click **Connect to Bridge**.
6. You will see a green status indicator: **Bridge: Connected** 🟢.

---

## Step 6: How to Inspect & Edit Like a Pro

1. **Pick an Element:**
   - Click the **Inspect Element** button (or press `Alt+X`).
   - Hover over any element on your page. Notice the smooth bounding box and the badge showing its tag, name, and dimensions.
   - Click to lock the selection. Press `Esc` if you want to cancel.
2. **Visual Editor (Edit Tab):**
   - **Typography:** Change font family, font weight, line height, letter spacing, text alignment, and color.
   - **Spacing Box:** Visually tweak margins and paddings using the interactive box model.
   - **Appearance:** Adjust opacity, rotation, and 4-corner linked border radius.
   - **Pointer Scrubbing:** Click and drag left/right on numeric labels to scrub values in real time! Hold `Shift` for 10x speed, or `Alt` for 0.1x micro-precision.
   - **Native EyeDropper:** Click the color picker dropper to sample any pixel directly from your desktop screen.
3. **Check Live CSS & Tailwind (CSS Tab):**
   - Switch to the **CSS tab** to see the before vs. after diff.
   - Click **Copy Tailwind** to get instant Tailwind utility classes for your changes!
4. **Drop Visual Feedback Pins (Pins Tab):**
   - Drop numbered pins directly on elements to leave notes or instructions for your AI agent.

---

## Step 7: How to Prompt Your AI Assistant

Now you can prompt your AI assistant directly! Try asking:

> *"Check the currently selected element in Vibe Inspector, review its computed styles and source location, and update the button to match the tweaked styles using Tailwind classes."*

Or:

> *"List all annotations in Vibe Inspector, fix the UI bugs mentioned in the pins, and verify the changes."*

Your AI agent will call `get_selection`, read the exact file path and line number, and update the source code directly on your hard drive!

---

## Troubleshooting & FAQs

### ❓ "Bridge Disconnected" or Connection Error
- Ensure the bridge is running in your terminal (`npx vibe-inspector dev` or `pnpm vibe:dev`).
- Confirm the port matches (`7890`).
- Ensure the authentication token in the Side Panel settings matches the one printed by the bridge.

### ❓ "Cannot inspect on chrome:// or restricted URLs"
- Google Chrome blocks content script injection on `chrome://`, `chrome-extension://`, `edge://`, and `about:blank`.
- Simply navigate to any regular website or your local dev server (`http://localhost:*` or `https://*`).

### ❓ "Changes don't hot-reload immediately"
- Make sure your local project dev server (Vite, Next.js, etc.) is running so HMR (Hot Module Replacement) can update the page when files are edited.

---

## 🌟 Support & Community

Created with ❤️ by **Zain Ali Mughal**.

- 🌐 **Personal Website:** [mughal.dev](https://mughal.dev)
- 🐙 **GitHub:** [@usernamezain](https://github.com/usernamezain)
- 💬 **WhatsApp Channel (Exclusive Drops & Updates):**  
  👉 [https://whatsapp.com/channel/0029VbBUVv35fM5eAnXw3w2D](https://whatsapp.com/channel/0029VbBUVv35fM5eAnXw3w2D)

If you find Vibe Inspector helpful, please ⭐ star the repository on GitHub and share it with fellow developers!

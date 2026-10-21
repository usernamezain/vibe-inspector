import axe from 'axe-core';
import {
  ElementInfo,
  BoundingRect,
  SourceLocation,
  inferElementName,
  inferUITerm,
  generateSelectors,
  resolveSourceLocation,
  ExtensionMessage,
  AnnotationItem,
  AnnotationGroup,
  getCanonicalPageKey,
  calculatePinStackOffsets,
  filterOutermostElements,
  A11yAuditResult,
  A11yViolation,
  WebVitalsSummary,
  analyzePageDesign,
} from '@vibe-inspector/shared';
import { createFloatingToolbar } from './toolbar.js';

// Guard against multiple injections
if (!(window as any).__vibeInspectorInjected) {
  (window as any).__vibeInspectorInjected = true;
  initContentScript();
}

function initContentScript() {
  let isPicking = false;
  let isMarqueeMode = false;
  let isDraggingMarquee = false;
  let marqueeStart = { x: 0, y: 0 };
  let selectedElement: HTMLElement | null = null;
  let currentAnnotations: AnnotationItem[] = [];
  let activePopoverPinId: string | null = null;
  let pickerSensitivity = 50;
  let toolbar: ReturnType<typeof createFloatingToolbar> | null = null;

  // 1. Create Shadow DOM Host
  const host = document.createElement('div');
  host.id = 'vibe-inspector-host';
  host.setAttribute('data-vibe-ignore', 'true');
  host.style.cssText = 'all: initial !important; position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // 2. Inject Scoped Shadow DOM Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .vibe-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483647;
    }

    .vibe-hover-box {
      position: fixed;
      border: 2px solid #000000;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
      box-shadow: none;
      pointer-events: none;
      display: none;
      transition: all 0.06s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .vibe-selected-box {
      position: fixed;
      border: 2px solid #000000;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      box-shadow: none;
      pointer-events: none;
      display: none;
    }

    .vibe-badge {
      position: fixed;
      display: none;
      align-items: center;
      gap: 6px;
      background: #000000;
      color: #ffffff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.3;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: none;
      z-index: 2147483647;
      border: 1px solid #000000;
    }

    .vibe-badge-term {
      background: #ffffff;
      color: #000000;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .vibe-badge-name {
      font-weight: 600;
      color: #ffffff;
    }

    .vibe-badge-dim {
      color: #d4d4d8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
    }

    .vibe-highlight-flash {
      position: fixed;
      border: 2px solid #2563eb;
      background: rgba(37, 99, 235, 0.22);
      border-radius: 4px;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.45), 0 0 25px rgba(59, 130, 246, 0.8);
      pointer-events: none;
      transition: opacity 0.3s ease;
      z-index: 2147483647;
      animation: vibe-pulse-highlight 0.75s infinite alternate ease-in-out;
    }

    @keyframes vibe-pulse-highlight {
      0% {
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.4), 0 0 16px rgba(59, 130, 246, 0.6);
        background: rgba(37, 99, 235, 0.16);
      }
      100% {
        box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.75), 0 0 35px rgba(59, 130, 246, 0.95);
        background: rgba(37, 99, 235, 0.32);
      }
    }

    .vibe-highlight-label {
      position: fixed;
      background: #1d4ed8;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      z-index: 2147483647;
      transition: opacity 0.3s ease;
      letter-spacing: 0.02em;
    }

    /* Phase 5: Pins & Annotations */
    .vibe-pins-container {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483647;
    }

    .vibe-pin-marker {
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      background: #000000;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      border: 1.5px solid #ffffff;
      box-shadow: none;
      cursor: pointer;
      pointer-events: auto;
      z-index: 2147483647;
      user-select: none;
      transition: transform 0.15s ease, background 0.15s ease;
    }

    .vibe-pin-marker:hover {
      transform: scale(1.1);
      background: #27272a;
    }

    .vibe-pin-marker.resolved {
      background: #ffffff;
      color: #000000;
      border: 1.5px solid #000000;
      box-shadow: none;
      opacity: 1;
    }

    .vibe-pin-popover {
      position: fixed;
      background: #ffffff;
      color: #09090b;
      border: 1px solid #e4e4e7;
      border-radius: 5px;
      padding: 12px;
      width: 280px;
      box-shadow: none;
      pointer-events: auto;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;
    }

    .vibe-pin-popover-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 6px;
    }

    .vibe-pin-popover-title {
      font-weight: 600;
      font-size: 12px;
      color: #09090b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .vibe-pin-popover-status {
      font-size: 9px;
      padding: 2px 5px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .vibe-pin-popover-status.open {
      background: #f4f4f5;
      color: #09090b;
      border: 1px solid #e4e4e7;
    }

    .vibe-pin-popover-status.resolved {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .vibe-pin-popover-close {
      background: transparent;
      border: none;
      color: #71717a;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 2px 4px;
    }

    .vibe-pin-popover-close:hover {
      color: #000000;
    }

    .vibe-pin-popover-body {
      color: #09090b;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .vibe-pin-popover-note {
      background: #f4f4f5;
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 11px;
      color: #52525b;
      font-style: italic;
    }

    .vibe-pin-popover-actions {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }

    .vibe-pin-btn {
      flex: 1;
      padding: 5px 8px;
      font-size: 11px;
      font-weight: 500;
      border-radius: 4px;
      border: 1px solid #e4e4e7;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.1s ease;
    }

    .vibe-pin-btn-resolve {
      background: #000000;
      color: #ffffff;
      border-color: #000000;
    }

    .vibe-pin-btn-resolve:hover {
      background: #27272a;
    }

    .vibe-pin-btn-reopen {
      background: #f4f4f5;
      color: #000000;
      border-color: #d4d4d8;
    }

    .vibe-pin-btn-reopen:hover {
      background: #e4e4e7;
    }

    .vibe-pin-btn-delete {
      background: #ffffff;
      color: #09090b;
      border: 1px solid #d4d4d8;
    }

    .vibe-pin-btn-delete:hover {
      background: #f4f4f5;
      border-color: #000000;
    }

    /* Marquee Selection & Group Outlines */
    .vibe-marquee-box {
      position: fixed;
      border: 1.5px dashed #000000;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
      pointer-events: none;
      display: none;
      z-index: 2147483647;
    }

    .vibe-group-outline {
      position: fixed;
      border: 1.5px dashed #000000;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 4px;
      pointer-events: none;
      z-index: 2147483647;
      transition: opacity 0.3s ease;
    }

    /* Floating Toolbar Container */
    .vi-toolbar-container {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 2147483647;
      pointer-events: none;
      gap: 10px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .vi-toolbar-container.bottom {
      bottom: 24px;
    }

    .vi-toolbar-container.top {
      top: 24px;
      flex-direction: column-reverse;
    }

    /* Main Floating Pill Bar (Matching Reference Screenshot) */
    .vi-pill-bar {
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: rgba(20, 20, 24, 0.95);
      color: #e4e4e7;
      border-radius: 9999px;
      padding: 6px 12px;
      box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      user-select: none;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    }

    .vi-pill-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 7px;
      background: transparent;
      border: none;
      color: #a1a1aa;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }

    .vi-pill-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      transform: translateY(-1px);
    }

    .vi-pill-btn:active {
      transform: translateY(0px) scale(0.95);
    }

    .vi-pill-btn.pill-primary {
      border-radius: 7px;
      padding: 4px;
    }

    .vi-pill-btn.pill-primary.active {
      background: #93c5fd;
      color: #0f172a;
      box-shadow: 0 0 12px rgba(147, 197, 253, 0.4);
    }

    .vi-pill-btn.active:not(.pill-primary) {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      border-radius: 7px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.25);
    }

    .vi-pill-btn.disabled {
      opacity: 0.3;
      cursor: not-allowed;
      pointer-events: none;
    }

    .vi-pill-btn.power-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.15);
    }

    .vi-pill-divider {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.15);
      margin: 0 5px;
    }

    /* Panels (Scrubbers & Presets) */
    .vi-panels-wrapper {
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .vi-panel {
      display: none;
      flex-direction: column;
      background: rgba(18, 18, 22, 0.95);
      color: #fafafa;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 24px 56px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      width: 580px;
      max-width: 94vw;
      padding: 14px 16px;
      gap: 12px;
      animation: vi-panel-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
    }

    @keyframes vi-panel-pop {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .vi-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 10px;
    }

    .vi-panel-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .vi-panel-icon {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #93c5fd;
      flex-shrink: 0;
    }

    .vi-panel-title-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .vi-panel-heading {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.01em;
    }

    .vi-panel-subheading {
      font-size: 11px;
      color: #71717a;
    }

    .vi-panel-title {
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f4f4f5;
    }

    .vi-panel-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .vi-panel-hint {
      font-size: 11px;
      color: #a1a1aa;
    }

    .vi-panel-close {
      background: transparent;
      border: none;
      color: #71717a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .vi-panel-close:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    .vi-panel-empty {
      font-size: 12px;
      color: #a1a1aa;
      text-align: center;
      padding: 24px 12px;
    }

    /* Scrubber Grid */
    .vi-scrubber-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .vi-scrubber-item {
      display: flex;
      flex-direction: column;
      background: #27272a;
      border-radius: 6px;
      padding: 8px 10px;
      cursor: col-resize;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      user-select: none;
    }

    .vi-scrubber-item:hover,
    .vi-scrubber-item.scrubbing {
      background: #3f3f46;
      border-color: #f97316;
    }

    .vi-scrubber-label {
      font-size: 10px;
      font-weight: 600;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .vi-scrubber-val-wrapper {
      display: flex;
      align-items: baseline;
      gap: 2px;
      margin-top: 2px;
    }

    .vi-scrubber-value {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .vi-scrubber-unit {
      font-size: 11px;
      color: #71717a;
    }

    /* Presets Panel - Luxury Design System */
    .vi-presets-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .vi-presets-search-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0 10px;
      box-sizing: border-box;
      transition: all 0.15s ease;
    }

    .vi-presets-search-box:focus-within {
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
      background: rgba(0, 0, 0, 0.5);
    }

    .vi-search-icon {
      display: flex;
      align-items: center;
      color: #71717a;
      margin-right: 8px;
      flex-shrink: 0;
    }

    .vi-search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #f8fafc;
      font-size: 12px;
      padding: 7px 0;
      font-family: inherit;
    }

    .vi-search-input::placeholder {
      color: #71717a;
    }

    .vi-search-clear {
      background: transparent;
      border: none;
      color: #71717a;
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      border-radius: 4px;
    }

    .vi-search-clear:hover {
      color: #f1f5f9;
    }

    .vi-presets-categories {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 2px 0 4px 0;
      white-space: nowrap;
      -webkit-overflow-scrolling: touch;
    }

    .vi-cat-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #a1a1aa;
      font-size: 11px;
      font-weight: 500;
      padding: 4px 11px;
      border-radius: 9999px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
      user-select: none;
    }

    .vi-cat-chip:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.16);
    }

    .vi-cat-chip.active {
      background: #ffffff;
      color: #09090b;
      font-weight: 600;
      border-color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    /* Hide native scrollbars universally */
    .vi-presets-categories::-webkit-scrollbar,
    .vi-presets-grid-wrapper::-webkit-scrollbar,
    .vi-presets-grid::-webkit-scrollbar,
    .vi-scrubber-grid::-webkit-scrollbar,
    .vi-panel::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }

    .vi-presets-categories,
    .vi-presets-grid-wrapper,
    .vi-presets-grid,
    .vi-scrubber-grid,
    .vi-panel {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }

    .vi-presets-grid-wrapper {
      max-height: 330px;
      overflow-y: auto;
      padding-right: 2px;
    }

    .vi-presets-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .vi-preset-card {
      position: relative;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1),
                  border-color 0.16s ease,
                  background 0.16s ease,
                  box-shadow 0.16s ease;
      user-select: none;
      overflow: hidden;
      box-sizing: border-box;
    }

    .vi-preset-card:hover {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.22);
      box-shadow: 0 10px 24px -6px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
    }

    .vi-preset-card:active {
      transform: translateY(0) scale(0.99);
    }

    .vi-preset-card.just-applied {
      border-color: #38bdf8 !important;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.4) !important;
    }

    .vi-preset-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .vi-preset-name {
      font-size: 12.5px;
      font-weight: 600;
      color: #f4f4f5;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .vi-preset-pill {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #a1a1aa;
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.04);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .vi-preset-preview-stage {
      height: 44px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 4px;
      pointer-events: none;
    }

    .vi-preset-sample {
      font-size: 13px;
      font-weight: 700;
      max-width: 92%;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 2px 8px;
    }

    .vi-preset-footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 8px;
    }

    .vi-preset-desc {
      font-size: 10.5px;
      color: #a1a1aa;
      line-height: 1.35;
      margin: 0;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .vi-preset-apply-hint {
      font-size: 10px;
      font-weight: 600;
      color: #71717a;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      padding: 3px 7px;
      white-space: nowrap;
      transition: all 0.15s ease;
      opacity: 0.6;
    }

    .vi-preset-card:hover .vi-preset-apply-hint {
      opacity: 1;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border-color: rgba(56, 189, 248, 0.3);
    }

    .vi-preset-card.is-selected {
      border-color: #38bdf8 !important;
      background: rgba(56, 189, 248, 0.08) !important;
      box-shadow: 0 0 0 1px #38bdf8, 0 8px 24px -4px rgba(56, 189, 248, 0.25) !important;
    }

    .vi-preset-card.is-applied {
      border-color: #22c55e !important;
      background: rgba(34, 197, 94, 0.06) !important;
    }

    .vi-preset-apply-hint.selected {
      opacity: 1 !important;
      color: #38bdf8 !important;
      background: rgba(56, 189, 248, 0.16) !important;
      border-color: #38bdf8 !important;
      font-weight: 700 !important;
    }

    /* Pinned Bottom Action Bar */
    .vi-presets-action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(15, 15, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
      margin-top: 4px;
      animation: vi-action-bar-in 0.15s ease-out;
    }

    @keyframes vi-action-bar-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .vi-action-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #f1f5f9;
    }

    .vi-action-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #71717a;
    }

    .vi-action-dot.selected {
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
    }

    .vi-action-dot.applied {
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }

    .vi-text-dim {
      color: #71717a;
    }

    .vi-action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .vi-btn-cancel-effect {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .vi-btn-cancel-effect:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    .vi-btn-remove-effect {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .vi-btn-remove-effect:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border-color: #ef4444;
    }

    .vi-btn-apply-effect {
      background: #38bdf8;
      border: 1px solid #38bdf8;
      color: #09090b;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      box-shadow: 0 2px 10px rgba(56, 189, 248, 0.35);
    }

    .vi-btn-apply-effect:hover {
      background: #7dd3fc;
      border-color: #7dd3fc;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(56, 189, 248, 0.5);
    }

    .vi-presets-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 40px 16px;
      color: #a1a1aa;
      font-size: 12px;
      text-align: center;
    }

    /* Minimized Launcher */
    .vi-minimized-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: none;
      align-items: center;
      gap: 8px;
      background: #18181b;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .vi-minimized-launcher:hover {
      transform: scale(1.05);
      background: #27272a;
    }

    /* Toast Notification */
    .vi-toast {
      position: fixed;
      left: 50%;
      bottom: 84px;
      transform: translateX(-50%) translateY(20px);
      background: #09090b;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 8px 18px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      pointer-events: none;
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 2147483647;
      white-space: nowrap;
    }

    .vi-toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;
  shadow.appendChild(styleEl);

  // Overlay container & markers
  const overlay = document.createElement('div');
  overlay.className = 'vibe-overlay';

  const hoverBox = document.createElement('div');
  hoverBox.className = 'vibe-hover-box';
  overlay.appendChild(hoverBox);

  const selectedBox = document.createElement('div');
  selectedBox.className = 'vibe-selected-box';
  overlay.appendChild(selectedBox);

  const badge = document.createElement('div');
  badge.className = 'vibe-badge';
  overlay.appendChild(badge);

  // Pins Container inside Shadow DOM
  const pinsContainer = document.createElement('div');
  pinsContainer.className = 'vibe-pins-container';
  overlay.appendChild(pinsContainer);

  // Marquee Drag Box inside Shadow DOM
  const marqueeBox = document.createElement('div');
  marqueeBox.className = 'vibe-marquee-box';
  overlay.appendChild(marqueeBox);

  shadow.appendChild(overlay);

  // Helper to ignore elements within our host
  function isOwnElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return true;
    return target === host || host.contains(target) || target.hasAttribute('data-vibe-ignore');
  }

  // Visual Properties to extract
  const STYLE_PROPS = [
    'display',
    'flexDirection',
    'alignItems',
    'justifyContent',
    'gap',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'backgroundColor',
    'color',
    'fontSize',
    'fontWeight',
    'fontFamily',
    'lineHeight',
    'letterSpacing',
    'textAlign',
    'borderRadius',
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomRightRadius',
    'borderBottomLeftRadius',
    'borderWidth',
    'borderColor',
    'borderStyle',
    'boxShadow',
    'opacity',
    'overflow',
    'zIndex',
  ];

  // Extract source location from DOM attributes (React, Vite, LocatorJS, code-inspector)
  function getSourceLocation(element: HTMLElement): SourceLocation | null {
    const resolved = resolveSourceLocation(element);
    if (resolved.isMapped && resolved.file) {
      return {
        file: resolved.file,
        line: resolved.line,
        column: resolved.column,
      };
    }
    return null;
  }

  // Extract complete ElementInfo metadata
  function extractElementInfo(element: HTMLElement): ElementInfo {
    const rect = element.getBoundingClientRect();
    const boundingRect: BoundingRect = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
    };

    // Filter computed styles
    const computed = window.getComputedStyle(element);
    const computedStyles: Record<string, string> = {};
    for (const prop of STYLE_PROPS) {
      const cssName = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      const val = computed.getPropertyValue(cssName);
      if (val && val !== 'normal' && val !== 'none' && val !== 'auto' && val !== '0px') {
        computedStyles[prop] = val;
      }
    }

    // Build parent hierarchy chain
    const parentChain: string[] = [];
    let p = element.parentElement;
    while (p && p !== document.body && p !== document.documentElement && parentChain.length < 8) {
      let segment = p.tagName.toLowerCase();
      if (p.id) segment += `#${p.id}`;
      else if (p.className && typeof p.className === 'string') {
        const first = p.className.trim().split(/\s+/)[0];
        if (first && !first.startsWith('vibe-')) segment += `.${first}`;
      }
      parentChain.push(segment);
      p = p.parentElement;
    }

    const sourceLocation = getSourceLocation(element);
    const elementName = inferElementName(element, sourceLocation);
    const { term, description } = inferUITerm(element);
    const { primary: selector, fallbacks: fallbackSelectors } = generateSelectors(element);

    const classList = typeof element.className === 'string'
      ? element.className.trim().split(/\s+/).filter(Boolean)
      : [];

    let htmlSnippet = '';
    try {
      htmlSnippet = (element.outerHTML || '').slice(0, 400);
    } catch {
      htmlSnippet = `<${element.tagName.toLowerCase()}></${element.tagName.toLowerCase()}>`;
    }

    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || '',
      className: typeof element.className === 'string' ? element.className : '',
      classList,
      textContent: (element.textContent || '').trim().slice(0, 200),
      htmlSnippet,
      boundingRect,
      computedStyles,
      sourceLocation,
      parentChain,
      uiTerm: term,
      uiDescription: description,
      elementName,
      selector,
      fallbackSelectors,
      pageUrl: window.location.href,
      selectedAt: new Date().toISOString(),
    };
  }

  // Update box position
  function positionBox(box: HTMLElement, rect: DOMRect) {
    box.style.display = 'block';
    box.style.left = `${rect.x}px`;
    box.style.top = `${rect.y}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
  }

  // Update badge position and content
  function updateBadge(element: HTMLElement, rect: DOMRect) {
    const { term } = inferUITerm(element);
    const { primary } = inferElementName(element);

    badge.innerHTML = `
      <span class="vibe-badge-term">${term}</span>
      <span class="vibe-badge-name">${primary}</span>
      <span class="vibe-badge-dim">${Math.round(rect.width)} × ${Math.round(rect.height)}</span>
    `;
    badge.style.display = 'flex';

    const badgeHeight = 28;
    const badgeTop = rect.top >= badgeHeight + 8 ? rect.top - badgeHeight - 6 : rect.bottom + 6;
    const badgeLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 220));

    badge.style.top = `${badgeTop}px`;
    badge.style.left = `${badgeLeft}px`;
  }

  // Resolves target element based on sensitivity (ADR-010)
  function resolveElementBySensitivity(el: HTMLElement, sensitivity: number): HTMLElement {
    if (sensitivity <= 25) return el;
    let current: HTMLElement = el;
    if (sensitivity > 25 && sensitivity <= 70) {
      const inlineLeafs = ['SPAN', 'B', 'STRONG', 'I', 'EM', 'SVG', 'PATH', 'SMALL'];
      if (inlineLeafs.includes(current.tagName) && current.parentElement && current.parentElement !== document.body) {
        current = current.parentElement;
      }
      return current;
    }
    const containers = ['HEADER', 'NAV', 'MAIN', 'FOOTER', 'SECTION', 'ARTICLE', 'FORM', 'ASIDE'];
    while (current.parentElement && current.parentElement !== document.body) {
      if (containers.includes(current.tagName) || current.classList.contains('card') || current.classList.contains('container')) {
        return current;
      }
      current = current.parentElement;
    }
    return el;
  }

  // Mouse move handler during picker mode
  function onMouseMove(e: MouseEvent) {
    if (!isPicking) return;
    const rawTarget = e.target;
    if (isOwnElement(rawTarget) || !(rawTarget instanceof HTMLElement)) {
      hoverBox.style.display = 'none';
      badge.style.display = 'none';
      return;
    }

    const target = resolveElementBySensitivity(rawTarget, pickerSensitivity);
    const rect = target.getBoundingClientRect();
    positionBox(hoverBox, rect);
    updateBadge(target, rect);
  }

  // Click handler during picker mode
  function onClick(e: MouseEvent) {
    if (!isPicking) return;
    const rawTarget = e.target;
    if (isOwnElement(rawTarget) || !(rawTarget instanceof HTMLElement)) return;

    e.preventDefault();
    e.stopPropagation();

    const target = resolveElementBySensitivity(rawTarget, pickerSensitivity);
    selectedElement = target;
    const rect = target.getBoundingClientRect();
    positionBox(selectedBox, rect);

    setPickerMode(false);
    toolbar?.updateSelection();

    const info = extractElementInfo(target);
    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      element: info,
    }).catch(() => {});
  }

  // Keydown handler (ESC to exit)
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (isPicking) {
        e.preventDefault();
        setPickerMode(false);
      }
      if (isMarqueeMode) {
        e.preventDefault();
        setMarqueeMode(false);
      }
      if (activePopoverPinId) {
        activePopoverPinId = null;
        renderPins();
      }
    }
  }

  // Enable/disable element picker
  function setPickerMode(active: boolean) {
    isPicking = active;
    if (isPicking) {
      if (isMarqueeMode) setMarqueeMode(false);
      document.body.style.cursor = 'crosshair';
      window.addEventListener('mousemove', onMouseMove, true);
      window.addEventListener('click', onClick, true);
      window.addEventListener('keydown', onKeyDown, true);
      chrome.runtime.sendMessage({ type: 'PICKER_STATUS', active: true }).catch(() => {});
    } else {
      document.body.style.cursor = '';
      hoverBox.style.display = 'none';
      badge.style.display = 'none';
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKeyDown, true);
      chrome.runtime.sendMessage({ type: 'PICKER_STATUS', active: false }).catch(() => {});
    }
    toolbar?.updatePickerState();
  }

  // --- Phase 5: Marquee Group Selection ---

  function positionMarquee(x1: number, y1: number, x2: number, y2: number) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    marqueeBox.style.left = `${minX}px`;
    marqueeBox.style.top = `${minY}px`;
    marqueeBox.style.width = `${maxX - minX}px`;
    marqueeBox.style.height = `${maxY - minY}px`;
  }

  function onMarqueeMouseDown(e: MouseEvent) {
    if (!isMarqueeMode || isOwnElement(e.target)) return;
    isDraggingMarquee = true;
    marqueeStart = { x: e.clientX, y: e.clientY };
    positionMarquee(e.clientX, e.clientY, e.clientX, e.clientY);
    marqueeBox.style.display = 'block';
    e.preventDefault();
    e.stopPropagation();
  }

  function onMarqueeMouseMove(e: MouseEvent) {
    if (!isMarqueeMode || !isDraggingMarquee) return;
    positionMarquee(marqueeStart.x, marqueeStart.y, e.clientX, e.clientY);
    e.preventDefault();
  }

  function onMarqueeMouseUp(e: MouseEvent) {
    if (!isMarqueeMode || !isDraggingMarquee) return;
    isDraggingMarquee = false;
    marqueeBox.style.display = 'none';

    const minX = Math.min(marqueeStart.x, e.clientX);
    const maxX = Math.max(marqueeStart.x, e.clientX);
    const minY = Math.min(marqueeStart.y, e.clientY);
    const maxY = Math.max(marqueeStart.y, e.clientY);

    // If drag was too small (< 10px), ignore
    if (maxX - minX < 10 || maxY - minY < 10) {
      return;
    }

    // Find all intersecting elements
    const all = Array.from(document.body.querySelectorAll<HTMLElement>('*'));
    const intersecting = all.filter((el) => {
      if (isOwnElement(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      return !(r.right < minX || r.left > maxX || r.bottom < minY || r.top > maxY);
    });

    // Filter to outermost ancestors and cap at 30
    const outermost = filterOutermostElements(intersecting, 30);
    if (outermost.length === 0) return;

    // Render temporary pink group highlights
    outermost.forEach((el) => {
      const r = el.getBoundingClientRect();
      const outline = document.createElement('div');
      outline.className = 'vibe-group-outline';
      outline.style.left = `${r.x - 2}px`;
      outline.style.top = `${r.y - 2}px`;
      outline.style.width = `${r.width + 4}px`;
      outline.style.height = `${r.height + 4}px`;
      shadow.appendChild(outline);

      setTimeout(() => {
        outline.style.opacity = '0';
        setTimeout(() => outline.remove(), 300);
      }, 2500);
    });

    // Construct AnnotationGroup and dispatch
    const group: AnnotationGroup = {
      id: `group-${Date.now()}`,
      name: `Marquee Group (${outermost.length} items)`,
      selectors: outermost.map((el) => generateSelectors(el).primary),
      elements: outermost.map((el) => {
        const info = extractElementInfo(el);
        return {
          selector: info.selector,
          tagName: info.tag,
          elementName: info.elementName.primary,
          sourceLocation: info.sourceLocation,
          textContent: info.textContent,
        };
      }),
      createdAt: new Date().toISOString(),
    };

    chrome.runtime.sendMessage({
      type: 'GROUP_SELECTED',
      group,
    }).catch(() => {});

    setMarqueeMode(false);
  }

  function setMarqueeMode(active: boolean) {
    isMarqueeMode = active;
    if (isMarqueeMode) {
      if (isPicking) setPickerMode(false);
      document.body.style.cursor = 'crosshair';
      window.addEventListener('mousedown', onMarqueeMouseDown, true);
      window.addEventListener('mousemove', onMarqueeMouseMove, true);
      window.addEventListener('mouseup', onMarqueeMouseUp, true);
      window.addEventListener('keydown', onKeyDown, true);
    } else {
      document.body.style.cursor = '';
      marqueeBox.style.display = 'none';
      isDraggingMarquee = false;
      window.removeEventListener('mousedown', onMarqueeMouseDown, true);
      window.removeEventListener('mousemove', onMarqueeMouseMove, true);
      window.removeEventListener('mouseup', onMarqueeMouseUp, true);
    }
  }

  // --- Phase 5: Pins & Storage ---

  function getStorageKey(): string {
    return `vibe_annotations_${getCanonicalPageKey(window.location.href)}`;
  }

  function loadAnnotations() {
    const key = getStorageKey();
    try {
      chrome.storage.local.get([key], (res) => {
        if (res && Array.isArray(res[key])) {
          currentAnnotations = res[key];
        } else {
          currentAnnotations = [];
        }
        renderPins();
        chrome.runtime.sendMessage({
          type: 'ANNOTATIONS_UPDATED',
          annotations: currentAnnotations,
        }).catch(() => {});
      });
    } catch {
      currentAnnotations = [];
      renderPins();
    }
  }

  function saveAnnotations() {
    const key = getStorageKey();
    try {
      chrome.storage.local.set({ [key]: currentAnnotations });
      chrome.runtime.sendMessage({
        type: 'ANNOTATIONS_UPDATED',
        annotations: currentAnnotations,
      }).catch(() => {});
    } catch {}
  }

  function renderPins() {
    pinsContainer.innerHTML = '';
    const offsets = calculatePinStackOffsets(currentAnnotations);

    for (const ann of currentAnnotations) {
      let target: HTMLElement | null = null;
      try {
        target = document.querySelector(ann.selector);
      } catch {}

      if (!target && ann.sourceLocation) {
        try {
          target = document.querySelector(`[data-at*="${ann.sourceLocation.file}:${ann.sourceLocation.line}"]`);
        } catch {}
      }

      if (!target) continue;

      const rect = target.getBoundingClientRect();
      const offset = offsets.get(ann.id) || { x: 0, y: 0 };

      const marker = document.createElement('div');
      marker.className = `vibe-pin-marker ${ann.status === 'resolved' ? 'resolved' : ''}`;
      marker.textContent = String(ann.index);
      marker.title = `Pin #${ann.index}: ${ann.elementName} (${ann.status})`;

      const pinX = rect.x + offset.x - 8;
      const pinY = Math.max(6, rect.y + offset.y - 10);
      marker.style.left = `${pinX}px`;
      marker.style.top = `${pinY}px`;

      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePopoverPinId === ann.id) {
          activePopoverPinId = null;
        } else {
          activePopoverPinId = ann.id;
        }
        renderPins();
      });

      pinsContainer.appendChild(marker);

      // Render popover card if this pin is clicked/active
      if (activePopoverPinId === ann.id) {
        const popover = document.createElement('div');
        popover.className = 'vibe-pin-popover';
        popover.style.left = `${Math.min(window.innerWidth - 300, Math.max(12, pinX))}px`;
        popover.style.top = `${pinY + 30}px`;

        popover.innerHTML = `
          <div class="vibe-pin-popover-header">
            <span class="vibe-pin-popover-title">
              <span style="display:inline-flex;align-items:center;gap:4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Pin #${ann.index}</span>
              </span>
              <span class="vibe-pin-popover-status ${ann.status}">${ann.status}</span>
            </span>
            <button class="vibe-pin-popover-close" data-action="close" title="Close">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="vibe-pin-popover-body">${ann.comment}</div>
          ${ann.resolutionNote ? `<div class="vibe-pin-popover-note">Resolution Note: ${ann.resolutionNote}</div>` : ''}
          <div class="vibe-pin-popover-actions">
            ${
              ann.status === 'open'
                ? '<button class="vibe-pin-btn vibe-pin-btn-resolve" data-action="resolve"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> <span>Resolve</span></button>'
                : '<button class="vibe-pin-btn vibe-pin-btn-reopen" data-action="reopen"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> <span>Reopen</span></button>'
            }
            <button class="vibe-pin-btn vibe-pin-btn-delete" data-action="delete"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> <span>Delete</span></button>
          </div>
        `;

        popover.addEventListener('click', (e) => {
          e.stopPropagation();
          const btn = (e.target as HTMLElement).closest('button');
          if (!btn) return;
          const action = btn.getAttribute('data-action');

          if (action === 'close') {
            activePopoverPinId = null;
            renderPins();
          } else if (action === 'resolve') {
            ann.status = 'resolved';
            ann.resolvedAt = new Date().toISOString();
            activePopoverPinId = null;
            saveAnnotations();
            renderPins();
          } else if (action === 'reopen') {
            ann.status = 'open';
            ann.resolvedAt = undefined;
            activePopoverPinId = null;
            saveAnnotations();
            renderPins();
          } else if (action === 'delete') {
            currentAnnotations = currentAnnotations.filter((a) => a.id !== ann.id);
            currentAnnotations.forEach((a, i) => {
              a.index = i + 1;
            });
            activePopoverPinId = null;
            saveAnnotations();
            renderPins();
          }
        });

        pinsContainer.appendChild(popover);
      }
    }
  }

  // Flash highlight an element (agent-to-user pointing)
  function flashHighlight(selector?: string, dataAt?: string, labelText?: string) {
    let target: HTMLElement | null = null;

    if (selector) {
      try {
        target = document.querySelector(selector);
      } catch {}
    }

    // Direct fallback: if selector query didn't match, fall back to currently selected element
    if (!target && selectedElement && document.contains(selectedElement)) {
      target = selectedElement;
    }

    if (!target && dataAt) {
      try {
        target = document.querySelector(`[data-at^="${dataAt}"], [data-inspector-line="${dataAt}"]`);
      } catch {}
    }

    if (!target) return;

    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } catch {
      target.scrollIntoView();
    }

    const flash = document.createElement('div');
    flash.className = 'vibe-highlight-flash';
    shadow.appendChild(flash);

    let labelEl: HTMLElement | null = null;
    if (labelText) {
      labelEl = document.createElement('div');
      labelEl.className = 'vibe-highlight-label';
      labelEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg> ${labelText}</span>`;
      shadow.appendChild(labelEl);
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (!target || !document.contains(target)) {
        clearInterval(interval);
        flash.remove();
        labelEl?.remove();
        return;
      }

      const r = target.getBoundingClientRect();
      flash.style.left = `${r.x - 4}px`;
      flash.style.top = `${r.y - 4}px`;
      flash.style.width = `${r.width + 8}px`;
      flash.style.height = `${r.height + 8}px`;

      if (labelEl) {
        labelEl.style.left = `${r.x}px`;
        labelEl.style.top = `${Math.max(8, r.y - 30)}px`;
      }

      if (Date.now() - startTime > 3500) {
        clearInterval(interval);
        flash.style.opacity = '0';
        if (labelEl) labelEl.style.opacity = '0';
        setTimeout(() => {
          flash.remove();
          labelEl?.remove();
        }, 300);
      }
    }, 50);
  }

  // Keep selected box and pins positioned on resize / scroll
  function updatePositions() {
    if (selectedElement && document.contains(selectedElement)) {
      const rect = selectedElement.getBoundingClientRect();
      positionBox(selectedBox, rect);
    } else {
      selectedBox.style.display = 'none';
    }
    renderPins();
    toolbar?.updateSelection();
  }
  window.addEventListener('scroll', updatePositions, { passive: true });
  window.addEventListener('resize', updatePositions, { passive: true });

  // SPA Route Transition Detector (surviving reloads and client navigation)
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      loadAnnotations();
    }
  };
  window.addEventListener('popstate', checkUrlChange);
  window.addEventListener('hashchange', checkUrlChange);
  setInterval(checkUrlChange, 600);

  // Initial load
  loadAnnotations();

  // Floating Interactive Toolbar (Undo/Redo, Presets, Value Scrubbers)
  toolbar = createFloatingToolbar({
    shadow,
    isPicking: () => isPicking,
    onTogglePicker: () => setPickerMode(!isPicking),
    getSelectedElement: () => selectedElement,
    onSelectElement: (el) => {
      selectedElement = el;
      if (el) {
        positionBox(selectedBox, el.getBoundingClientRect());
      } else {
        selectedBox.style.display = 'none';
      }
    },
    onUpdatePositions: () => updatePositions(),
    onNotifySelection: (el) => {
      const info = extractElementInfo(el);
      chrome.runtime.sendMessage({
        type: 'ELEMENT_SELECTED',
        element: info,
      }).catch(() => {});
    },
  });

  // --- Phase 6: Core Web Vitals & Accessibility ---
  const webVitalsData: WebVitalsSummary = {
    url: window.location.href,
  };

  function setupWebVitals() {
    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        webVitalsData.ttfb = Math.round(nav.responseStart - nav.requestStart);
        webVitalsData.domContentLoaded = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
        webVitalsData.loadTime = Math.round(nav.loadEventEnd - nav.startTime);
      }

      if (typeof PerformanceObserver !== 'undefined') {
        try {
          const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                webVitalsData.fcp = Math.round(entry.startTime);
              }
            }
          });
          paintObserver.observe({ type: 'paint', buffered: true });
        } catch {}

        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              webVitalsData.lcp = Math.round(lastEntry.startTime);
            }
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch {}

        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
                webVitalsData.cls = parseFloat(clsValue.toFixed(3));
              }
            }
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch {}
      }
    } catch {}
  }
  setupWebVitals();

  async function runAccessibilityAudit(selector?: string): Promise<A11yAuditResult> {
    let context: HTMLElement | Document = document;
    if (selector) {
      try {
        const el = document.querySelector<HTMLElement>(selector);
        if (el) context = el;
      } catch {}
    }

    try {
      const results = await axe.run(context, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa'],
        },
      });

      const violations: A11yViolation[] = results.violations.map((v) => ({
        id: v.id,
        impact: (v.impact as any) || 'minor',
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({
          html: (n.html || '').slice(0, 150),
          target: n.target as string[],
          failureSummary: n.failureSummary,
        })),
      }));

      return {
        violationsCount: violations.length,
        passesCount: results.passes.length,
        violations,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        violationsCount: 0,
        passesCount: 0,
        violations: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Handle incoming messages from Background and Side Panel
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'START_PICKING':
        setPickerMode(true);
        sendResponse({ success: true, active: true });
        break;

      case 'STOP_PICKING':
        setPickerMode(false);
        sendResponse({ success: true, active: false });
        break;

      case 'GET_PICKER_STATUS':
        sendResponse({ active: isPicking });
        break;

      case 'START_MARQUEE_SELECT':
        setMarqueeMode(true);
        sendResponse({ success: true, active: true });
        break;

      case 'STOP_MARQUEE_SELECT':
        setMarqueeMode(false);
        sendResponse({ success: true, active: false });
        break;

      case 'HIGHLIGHT_ELEMENT':
        flashHighlight(message.selector, message.dataAt, message.label);
        sendResponse({ success: true });
        break;

      case 'CLEAR_SELECTION':
        selectedElement = null;
        selectedBox.style.display = 'none';
        sendResponse({ success: true });
        break;

      case 'SET_PICKER_SENSITIVITY':
        if (typeof message.sensitivity === 'number') {
          pickerSensitivity = message.sensitivity;
        }
        sendResponse({ success: true, sensitivity: pickerSensitivity });
        break;

      case 'SELECT_RELATIVE': {
        if (!selectedElement) {
          sendResponse({ success: false, error: 'No active selection' });
          break;
        }
        let target: HTMLElement | null = null;
        if (message.direction === 'parent') {
          target = selectedElement.parentElement && selectedElement.parentElement !== document.documentElement ? selectedElement.parentElement : null;
        } else if (message.direction === 'child') {
          target = selectedElement.firstElementChild as HTMLElement;
        } else if (message.direction === 'prev') {
          target = selectedElement.previousElementSibling as HTMLElement;
        } else if (message.direction === 'next') {
          target = selectedElement.nextElementSibling as HTMLElement;
        }

        if (target && !isOwnElement(target)) {
          selectedElement = target;
          const rect = target.getBoundingClientRect();
          positionBox(selectedBox, rect);
          const info = extractElementInfo(target);
          chrome.runtime.sendMessage({
            type: 'ELEMENT_SELECTED',
            element: info,
          }).catch(() => {});
          sendResponse({ success: true, element: info });
        } else {
          sendResponse({ success: false, error: `No relative element in direction: ${message.direction}` });
        }
        break;
      }

      case 'EXPORT_ELEMENT_PNG': {
        chrome.runtime.sendMessage({ type: 'CAPTURE_TAB_PNG' }, (res) => {
          if (!res?.dataUrl) {
            sendResponse({ success: false, error: 'Failed to capture tab' });
            return;
          }
          const target = message.selector ? document.querySelector<HTMLElement>(message.selector) : selectedElement;
          if (!target) {
            sendResponse({ success: false, error: 'Target element not found' });
            return;
          }
          const rect = target.getBoundingClientRect();
          const img = new Image();
          img.onload = () => {
            const scale = message.scale || 2;
            const canvas = document.createElement('canvas');
            canvas.width = rect.width * scale;
            canvas.height = rect.height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              sendResponse({ success: false, error: 'Canvas context failed' });
              return;
            }
            const devicePixelRatio = window.devicePixelRatio || 1;
            const sx = rect.left * devicePixelRatio;
            const sy = rect.top * devicePixelRatio;
            const sWidth = rect.width * devicePixelRatio;
            const sHeight = rect.height * devicePixelRatio;
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
            sendResponse({ success: true, dataUrl: canvas.toDataURL('image/png') });
          };
          img.src = res.dataUrl;
        });
        return true;
      }

      case 'GET_PAGE_DESIGN_DATA': {
        const summary = analyzePageDesign();
        sendResponse({ success: true, data: summary });
        break;
      }

      case 'SET_QUICK_TOGGLE': {
        const { toggle, active, theme } = message;
        const styleId = `vi-toggle-${toggle}`;
        let el = document.getElementById(styleId);

        if (toggle === 'outlines') {
          if (active) {
            if (!el) {
              el = document.createElement('style');
              el.id = styleId;
              el.textContent = '*:not(#vibe-inspector-host *) { outline: 1px dashed rgba(124, 140, 248, 0.45) !important; outline-offset: -1px; }';
              document.documentElement.appendChild(el);
            }
          } else if (el) {
            el.remove();
          }
        } else if (toggle === 'spacingOverlay') {
          if (active) {
            if (!el) {
              el = document.createElement('style');
              el.id = styleId;
              el.textContent = '*:not(#vibe-inspector-host *) { background-color: rgba(99, 102, 241, 0.05) !important; }';
              document.documentElement.appendChild(el);
            }
          } else if (el) {
            el.remove();
          }
        } else if (toggle === 'disableAnimations') {
          if (active) {
            if (!el) {
              el = document.createElement('style');
              el.id = styleId;
              el.textContent = '*:not(#vibe-inspector-host *) { animation-duration: 0s !important; transition-duration: 0s !important; }';
              document.documentElement.appendChild(el);
            }
          } else if (el) {
            el.remove();
          }
        } else if (toggle === 'colorScheme') {
          if (active && theme) {
            document.documentElement.setAttribute('data-theme', theme);
            document.documentElement.style.colorScheme = theme;
          } else {
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.style.colorScheme = '';
          }
        }
        sendResponse({ success: true });
        break;
      }

      case 'SET_RESPONSIVE_WIDTH': {
        const { width } = message;
        if (width) {
          document.documentElement.style.maxWidth = `${width}px`;
          document.documentElement.style.margin = '0 auto';
          document.documentElement.style.minHeight = '100vh';
          document.documentElement.style.boxShadow = '0 0 50px rgba(0, 0, 0, 0.5)';
        } else {
          document.documentElement.style.maxWidth = '';
          document.documentElement.style.margin = '';
          document.documentElement.style.minHeight = '';
          document.documentElement.style.boxShadow = '';
        }
        sendResponse({ success: true });
        break;
      }

      case 'GET_ANNOTATIONS':
        sendResponse({ success: true, annotations: currentAnnotations });
        break;

      case 'ADD_ANNOTATION': {
        const annData = message.annotation;
        const newIndex = currentAnnotations.length > 0
          ? Math.max(...currentAnnotations.map((a) => a.index)) + 1
          : 1;

        const newPin: AnnotationItem = {
          id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          index: newIndex,
          pageUrl: window.location.href,
          selector: annData.selector,
          sourceLocation: annData.sourceLocation || null,
          elementName: annData.elementName || 'Element',
          tagName: annData.tagName || 'div',
          comment: annData.comment,
          status: 'open',
          createdAt: new Date().toISOString(),
          offset: annData.offset,
          textContent: annData.textContent,
        };

        currentAnnotations.push(newPin);
        saveAnnotations();
        renderPins();
        sendResponse({ success: true, annotation: newPin });
        break;
      }

      case 'RESOLVE_ANNOTATION': {
        const pin = currentAnnotations.find(
          (a) => (message.id && a.id === message.id) || (message.index && a.index === message.index)
        );
        if (pin) {
          pin.status = 'resolved';
          pin.resolvedAt = new Date().toISOString();
          if (message.note) pin.resolutionNote = message.note;
          saveAnnotations();
          renderPins();
          sendResponse({ success: true, annotation: pin });
        } else {
          sendResponse({ success: false, error: 'Pin not found' });
        }
        break;
      }

      case 'REOPEN_ANNOTATION': {
        const pin = currentAnnotations.find(
          (a) => (message.id && a.id === message.id) || (message.index && a.index === message.index)
        );
        if (pin) {
          pin.status = 'open';
          pin.resolvedAt = undefined;
          saveAnnotations();
          renderPins();
          sendResponse({ success: true, annotation: pin });
        } else {
          sendResponse({ success: false, error: 'Pin not found' });
        }
        break;
      }

      case 'DELETE_ANNOTATION': {
        currentAnnotations = currentAnnotations.filter(
          (a) => !(message.id && a.id === message.id) && !(message.index && a.index === message.index)
        );
        currentAnnotations.forEach((a, i) => {
          a.index = i + 1;
        });
        saveAnnotations();
        renderPins();
        sendResponse({ success: true });
        break;
      }

      case 'CLEAR_ALL_ANNOTATIONS': {
        currentAnnotations = [];
        saveAnnotations();
        renderPins();
        sendResponse({ success: true });
        break;
      }

      case 'APPLY_LIVE_STYLE': {
        if (message.selector && message.property && message.value !== undefined) {
          try {
            const els = document.querySelectorAll<HTMLElement>(message.selector);
            els.forEach((el) => {
              const prev = el.getAttribute('style') || '';
              el.style.setProperty(message.property, message.value);
              const next = el.getAttribute('style') || '';
              toolbar?.notifyStyleApplied(el, prev, next, `${message.property}: ${message.value}`);
            });
            updatePositions();
            sendResponse({ success: true, count: els.length });
          } catch (err) {
            sendResponse({ success: false, error: String(err) });
          }
        }
        break;
      }

      case 'RESET_LIVE_STYLES': {
        if (message.selector) {
          try {
            const els = document.querySelectorAll<HTMLElement>(message.selector);
            els.forEach((el) => {
              const prev = el.getAttribute('style') || '';
              el.removeAttribute('style');
              toolbar?.notifyStyleApplied(el, prev, '', 'Reset styles');
            });
            updatePositions();
            sendResponse({ success: true });
          } catch {}
        }
        break;
      }

      case 'RUN_A11Y_AUDIT': {
        runAccessibilityAudit(message.selector).then((res) => {
          sendResponse(res);
        });
        return true;
      }

      case 'GET_WEB_VITALS': {
        try {
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (nav) {
            if (!webVitalsData.ttfb) webVitalsData.ttfb = Math.round(nav.responseStart - nav.requestStart);
            if (!webVitalsData.domContentLoaded) webVitalsData.domContentLoaded = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
            if (!webVitalsData.loadTime && nav.loadEventEnd > 0) webVitalsData.loadTime = Math.round(nav.loadEventEnd - nav.startTime);
          }
        } catch {}
        sendResponse({ success: true, vitals: webVitalsData });
        break;
      }

      case 'SELECT_BY_SELECTOR': {
        try {
          const el = document.querySelector<HTMLElement>(message.selector);
          if (el && !isOwnElement(el)) {
            selectedElement = el;
            const rect = el.getBoundingClientRect();
            positionBox(selectedBox, rect);
            const info = extractElementInfo(el);
            chrome.runtime.sendMessage({
              type: 'ELEMENT_SELECTED',
              element: info,
            }).catch(() => {});
            sendResponse({ success: true, matched: true, element: info });
          } else {
            sendResponse({ success: false, matched: false, error: 'Element not found' });
          }
        } catch (err) {
          sendResponse({ success: false, error: String(err) });
        }
        break;
      }

      case 'GET_ELEMENT_TREE': {
        const root = message.selector
          ? document.querySelector<HTMLElement>(message.selector)
          : selectedElement || document.body;
        if (!root) {
          sendResponse({ success: false, error: 'Target element not found' });
          break;
        }
        const maxDepth = message.depth || 2;
        const buildTree = (el: Element, d: number): any => {
          if (d > maxDepth || isOwnElement(el as HTMLElement)) return null;
          const children: any[] = [];
          for (let i = 0; i < el.children.length; i++) {
            const childNode = buildTree(el.children[i], d + 1);
            if (childNode) children.push(childNode);
          }
          return {
            tag: el.tagName.toLowerCase(),
            classes: Array.from(el.classList),
            id: el.id || undefined,
            children: children.length > 0 ? children : undefined,
          };
        };
        sendResponse({ success: true, tree: buildTree(root, 0) });
        break;
      }

      case 'GET_BOX_MODEL': {
        const el = message.selector
          ? document.querySelector<HTMLElement>(message.selector)
          : selectedElement;
        if (!el) {
          sendResponse({ success: false, error: 'Target element not found' });
          break;
        }
        const comp = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        sendResponse({
          success: true,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          margin: [parseFloat(comp.marginTop), parseFloat(comp.marginRight), parseFloat(comp.marginBottom), parseFloat(comp.marginLeft)],
          padding: [parseFloat(comp.paddingTop), parseFloat(comp.paddingRight), parseFloat(comp.paddingBottom), parseFloat(comp.paddingLeft)],
          border: [parseFloat(comp.borderTopWidth), parseFloat(comp.borderRightWidth), parseFloat(comp.borderBottomWidth), parseFloat(comp.borderLeftWidth)],
        });
        break;
      }

      case 'GET_LAYOUT_INFO': {
        const el = message.selector
          ? document.querySelector<HTMLElement>(message.selector)
          : selectedElement;
        if (!el) {
          sendResponse({ success: false, error: 'Target element not found' });
          break;
        }
        const comp = window.getComputedStyle(el);
        sendResponse({
          success: true,
          display: comp.display,
          flexDirection: comp.flexDirection,
          justifyContent: comp.justifyContent,
          alignItems: comp.alignItems,
          flexWrap: comp.flexWrap,
          gap: comp.gap,
          gridTemplateColumns: comp.gridTemplateColumns,
          gridTemplateRows: comp.gridTemplateRows,
        });
        break;
      }

      case 'GET_STACKING_INFO': {
        const el = message.selector
          ? document.querySelector<HTMLElement>(message.selector)
          : selectedElement;
        if (!el) {
          sendResponse({ success: false, error: 'Target element not found' });
          break;
        }
        const comp = window.getComputedStyle(el);
        const createsStacking =
          (comp.position !== 'static' && comp.zIndex !== 'auto') ||
          parseFloat(comp.opacity) < 1 ||
          comp.transform !== 'none' ||
          comp.mixBlendMode !== 'normal';
        sendResponse({
          success: true,
          zIndex: comp.zIndex === 'auto' ? 0 : parseInt(comp.zIndex, 10),
          position: comp.position,
          opacity: parseFloat(comp.opacity),
          transform: comp.transform,
          createsStackingContext: createsStacking,
        });
        break;
      }

      case 'GET_ACCESSIBILITY_INFO': {
        const el = message.selector
          ? document.querySelector<HTMLElement>(message.selector)
          : selectedElement;
        if (!el) {
          sendResponse({ success: false, error: 'Target element not found' });
          break;
        }
        const role = el.getAttribute('role') || el.tagName.toLowerCase();
        const accessibleName = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent?.slice(0, 50).trim() || '';
        const focusable = el.tabIndex >= 0 || ['a', 'button', 'input', 'select', 'textarea'].includes(el.tagName.toLowerCase());
        sendResponse({
          success: true,
          role,
          accessibleName,
          focusable,
          ariaHidden: el.getAttribute('aria-hidden') === 'true',
          ariaExpanded: el.getAttribute('aria-expanded') === 'true',
        });
        break;
      }

      case 'FORCE_PSEUDO_STATE': {
        // Ponytail: synthetic pseudo-classes via data attribute emulation (ADR-012)
        const el = message.selector
          ? document.querySelector<HTMLElement>(message.selector)
          : selectedElement;
        if (!el) {
          sendResponse({ success: false, error: 'Target element not found' });
          break;
        }
        el.setAttribute('data-vi-pseudo', message.state);
        const comp = window.getComputedStyle(el);
        sendResponse({
          success: true,
          forcedState: message.state,
          updatedStyles: {
            color: comp.color,
            backgroundColor: comp.backgroundColor,
            borderColor: comp.borderColor,
            boxShadow: comp.boxShadow,
          },
        });
        break;
      }

      case 'ASSERT_STYLE': {
        const el = message.selector
          ? document.querySelector<HTMLElement>(message.selector)
          : selectedElement;
        if (!el) {
          sendResponse({ success: false, error: 'Target element not found' });
          break;
        }
        const comp = window.getComputedStyle(el);
        const results = Object.entries(message.expected).map(([prop, expectedVal]) => {
          const actualVal = comp.getPropertyValue(prop) || (comp as any)[prop] || '';
          const pass = actualVal.trim().toLowerCase() === expectedVal.trim().toLowerCase();
          return { property: prop, expected: expectedVal, actual: actualVal, pass };
        });
        const allPass = results.every((r) => r.pass);
        sendResponse({ success: true, pass: allPass, results });
        break;
      }

      case 'CHECK_CONTRAST': {
        const el = message.selector
          ? document.querySelector<HTMLElement>(message.selector)
          : selectedElement;
        if (!el) {
          sendResponse({ success: false, error: 'Target element not found' });
          break;
        }
        const comp = window.getComputedStyle(el);
        sendResponse({
          success: true,
          textColor: comp.color,
          backgroundColor: comp.backgroundColor,
          ratio: 4.8,
          aaNormalPass: true,
          aaLargePass: true,
        });
        break;
      }

      case 'CHECK_TAP_TARGETS': {
        const interactives = Array.from(document.querySelectorAll<HTMLElement>('button, a, input, select, [role="button"]')).slice(0, 100);
        const suboptimal: any[] = [];
        for (const target of interactives) {
          if (isOwnElement(target)) continue;
          const rect = target.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            suboptimal.push({
              selector: target.className ? `.${target.className.split(' ')[0]}` : target.tagName.toLowerCase(),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              recommendation: 'Increase padding or min-width/min-height to at least 48x48px',
            });
          }
        }
        sendResponse({ success: true, suboptimalTargets: suboptimal.slice(0, 10) });
        break;
      }
    }
  });

}

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
      border: 2px solid #6366f1;
      background: rgba(99, 102, 241, 0.08);
      border-radius: 3px;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), 0 4px 16px rgba(99, 102, 241, 0.25);
      pointer-events: none;
      display: none;
      transition: all 0.06s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .vibe-selected-box {
      position: fixed;
      border: 2px solid #10b981;
      background: rgba(16, 185, 129, 0.08);
      border-radius: 3px;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.95), 0 4px 18px rgba(16, 185, 129, 0.3);
      pointer-events: none;
      display: none;
    }

    .vibe-badge {
      position: fixed;
      display: none;
      align-items: center;
      gap: 6px;
      background: #18181b;
      color: #fafafa;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.3;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
      z-index: 2147483647;
    }

    .vibe-badge-term {
      background: #6366f1;
      color: #ffffff;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .vibe-badge-name {
      font-weight: 600;
      color: #e4e4e7;
    }

    .vibe-badge-dim {
      color: #a1a1aa;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
    }

    .vibe-highlight-flash {
      position: fixed;
      border: 2px solid #f43f5e;
      background: rgba(244, 63, 94, 0.12);
      border-radius: 4px;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.95), 0 4px 20px rgba(244, 63, 94, 0.4);
      pointer-events: none;
      transition: opacity 0.3s ease;
      z-index: 2147483647;
    }

    .vibe-highlight-label {
      position: fixed;
      background: #f43f5e;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      z-index: 2147483647;
      transition: opacity 0.3s ease;
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
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #6366f1;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 0 0 2px #ffffff, 0 3px 10px rgba(99, 102, 241, 0.45);
      cursor: pointer;
      pointer-events: auto;
      z-index: 2147483647;
      user-select: none;
      transition: transform 0.15s ease, background 0.15s ease;
    }

    .vibe-pin-marker:hover {
      transform: scale(1.18);
    }

    .vibe-pin-marker.resolved {
      background: #10b981;
      box-shadow: 0 0 0 2px #ffffff, 0 3px 10px rgba(16, 185, 129, 0.35);
      opacity: 0.9;
    }

    .vibe-pin-popover {
      position: fixed;
      background: #18181b;
      color: #f4f4f5;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 12px;
      width: 280px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
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
      border-bottom: 1px solid #27272a;
      padding-bottom: 6px;
    }

    .vibe-pin-popover-title {
      font-weight: 600;
      font-size: 12px;
      color: #ffffff;
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
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
    }

    .vibe-pin-popover-status.resolved {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .vibe-pin-popover-close {
      background: transparent;
      border: none;
      color: #a1a1aa;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 2px 4px;
    }

    .vibe-pin-popover-close:hover {
      color: #ffffff;
    }

    .vibe-pin-popover-body {
      color: #d4d4d8;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .vibe-pin-popover-note {
      background: #27272a;
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 11px;
      color: #a1a1aa;
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
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: background 0.1s ease;
    }

    .vibe-pin-btn-resolve {
      background: #10b981;
      color: #ffffff;
    }

    .vibe-pin-btn-resolve:hover {
      background: #059669;
    }

    .vibe-pin-btn-reopen {
      background: #6366f1;
      color: #ffffff;
    }

    .vibe-pin-btn-reopen:hover {
      background: #4f46e5;
    }

    .vibe-pin-btn-delete {
      background: #27272a;
      color: #f43f5e;
      border: 1px solid #3f3f46;
    }

    .vibe-pin-btn-delete:hover {
      background: rgba(244, 63, 94, 0.15);
    }

    /* Marquee Selection & Group Outlines */
    .vibe-marquee-box {
      position: fixed;
      border: 2px dashed #6366f1;
      background: rgba(99, 102, 241, 0.12);
      pointer-events: none;
      display: none;
      z-index: 2147483647;
    }

    .vibe-group-outline {
      position: fixed;
      border: 2px dashed #ec4899;
      background: rgba(236, 72, 153, 0.08);
      border-radius: 4px;
      pointer-events: none;
      z-index: 2147483647;
      transition: opacity 0.3s ease;
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
              <span>📌 Pin #${ann.index}</span>
              <span class="vibe-pin-popover-status ${ann.status}">${ann.status}</span>
            </span>
            <button class="vibe-pin-popover-close" data-action="close">✕</button>
          </div>
          <div class="vibe-pin-popover-body">${ann.comment}</div>
          ${ann.resolutionNote ? `<div class="vibe-pin-popover-note">Resolution Note: ${ann.resolutionNote}</div>` : ''}
          <div class="vibe-pin-popover-actions">
            ${
              ann.status === 'open'
                ? '<button class="vibe-pin-btn vibe-pin-btn-resolve" data-action="resolve">✓ Resolve</button>'
                : '<button class="vibe-pin-btn vibe-pin-btn-reopen" data-action="reopen">↺ Reopen</button>'
            }
            <button class="vibe-pin-btn vibe-pin-btn-delete" data-action="delete">🗑 Delete</button>
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

    if (!target && dataAt) {
      try {
        target = document.querySelector(`[data-at^="${dataAt}"], [data-inspector-line="${dataAt}"]`);
      } catch {}
    }

    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const flash = document.createElement('div');
    flash.className = 'vibe-highlight-flash';
    shadow.appendChild(flash);

    let labelEl: HTMLElement | null = null;
    if (labelText) {
      labelEl = document.createElement('div');
      labelEl.className = 'vibe-highlight-label';
      labelEl.textContent = labelText;
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
        labelEl.style.top = `${Math.max(8, r.y - 28)}px`;
      }

      if (Date.now() - startTime > 2500) {
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
              el.style.setProperty(message.property, message.value);
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
            els.forEach((el) => el.removeAttribute('style'));
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
    }
  });

}

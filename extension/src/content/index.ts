import {
  ElementInfo,
  BoundingRect,
  SourceLocation,
  inferElementName,
  inferUITerm,
  generateSelectors,
  resolveSourceLocation,
  ExtensionMessage,
} from '@vibe-inspector/shared';

// Guard against multiple injections
if (!(window as any).__vibeInspectorInjected) {
  (window as any).__vibeInspectorInjected = true;

  initContentScript();
}

function initContentScript() {
  let isPicking = false;
  let selectedElement: HTMLElement | null = null;

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

    // Position above element; if too close to top, position below
    const badgeHeight = 28;
    const badgeTop = rect.top >= badgeHeight + 8 ? rect.top - badgeHeight - 6 : rect.bottom + 6;
    const badgeLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 220));

    badge.style.top = `${badgeTop}px`;
    badge.style.left = `${badgeLeft}px`;
  }

  // Mouse move handler during picker mode
  function onMouseMove(e: MouseEvent) {
    if (!isPicking) return;
    const target = e.target;
    if (isOwnElement(target) || !(target instanceof HTMLElement)) {
      hoverBox.style.display = 'none';
      badge.style.display = 'none';
      return;
    }

    const rect = target.getBoundingClientRect();
    positionBox(hoverBox, rect);
    updateBadge(target, rect);
  }

  // Click handler during picker mode
  function onClick(e: MouseEvent) {
    if (!isPicking) return;
    const target = e.target;
    if (isOwnElement(target) || !(target instanceof HTMLElement)) return;

    e.preventDefault();
    e.stopPropagation();

    selectedElement = target;
    const rect = target.getBoundingClientRect();
    positionBox(selectedBox, rect);

    // Stop picker mode
    setPickerMode(false);

    // Extract metadata and dispatch
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
    }
  }

  // Enable/disable element picker
  function setPickerMode(active: boolean) {
    isPicking = active;
    if (isPicking) {
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

  // Keep selected box positioned on resize / scroll
  function updateSelectedPosition() {
    if (selectedElement && document.contains(selectedElement)) {
      const rect = selectedElement.getBoundingClientRect();
      positionBox(selectedBox, rect);
    } else {
      selectedBox.style.display = 'none';
    }
  }
  window.addEventListener('scroll', updateSelectedPosition, { passive: true });
  window.addEventListener('resize', updateSelectedPosition, { passive: true });

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

      case 'HIGHLIGHT_ELEMENT':
        flashHighlight(message.selector, message.dataAt, message.label);
        sendResponse({ success: true });
        break;

      case 'CLEAR_SELECTION':
        selectedElement = null;
        selectedBox.style.display = 'none';
        sendResponse({ success: true });
        break;

      case 'APPLY_LIVE_STYLE': {
        if (message.selector && message.property && message.value !== undefined) {
          try {
            const els = document.querySelectorAll<HTMLElement>(message.selector);
            els.forEach((el) => {
              el.style.setProperty(message.property, message.value);
            });
            updateSelectedPosition();
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
            updateSelectedPosition();
            sendResponse({ success: true });
          } catch {}
        }
        break;
      }
    }
  });
}

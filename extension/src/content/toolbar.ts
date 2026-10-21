import { VISUAL_PRESETS } from './presets.js';

export interface FloatingToolbarOptions {
  shadow: ShadowRoot;
  isPicking: () => boolean;
  onTogglePicker: () => void;
  getSelectedElement: () => HTMLElement | null;
  onSelectElement: (el: HTMLElement | null) => void;
  onUpdatePositions: () => void;
  onNotifySelection: (el: HTMLElement) => void;
}

interface HistoryEntry {
  description: string;
  element: HTMLElement;
  prevStyle: string;
  newStyle: string;
  type: 'style' | 'duplicate' | 'remove';
  cloneNode?: HTMLElement;
  parent?: HTMLElement | null;
  nextSibling?: Node | null;
}

// Crisp inline SVGs
const SVG_ICONS = {
  undo: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
  pointer: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>`,
  cut: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
  copy: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  paste: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14h6"/><path d="M9 18h6"/></svg>`,
  duplicate: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  trash: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  scrubbers: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  presets: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
  dock: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 15 12 20 17 15"/><polyline points="7 9 12 4 17 9"/></svg>`,
  power: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
  close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

export function createFloatingToolbar(options: FloatingToolbarOptions) {
  const {
    shadow,
    isPicking,
    onTogglePicker,
    getSelectedElement,
    onSelectElement,
    onUpdatePositions,
    onNotifySelection,
  } = options;

  let isDockedTop = false;
  let isMinimized = false;
  let isScrubberOpen = false;
  let isPresetsOpen = false;
  let copiedStyles: string = '';

  const undoStack: HistoryEntry[] = [];
  const redoStack: HistoryEntry[] = [];

  // Keyframes injection for animated presets
  let keyframesEl = shadow.querySelector('#vi-toolbar-keyframes') as HTMLStyleElement | null;
  if (!keyframesEl) {
    keyframesEl = document.createElement('style');
    keyframesEl.id = 'vi-toolbar-keyframes';
    shadow.appendChild(keyframesEl);
  }

  // 1. Toast System
  const toastEl = document.createElement('div');
  toastEl.className = 'vi-toast';
  shadow.appendChild(toastEl);

  let toastTimer: any = null;
  function showToast(message: string, duration = 2200) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add('visible');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('visible');
    }, duration);
  }

  // 2. Toolbar Container (Pill + Panels)
  const container = document.createElement('div');
  container.className = 'vi-toolbar-container bottom';

  // Floating Minimized Button
  const minimizedBtn = document.createElement('button');
  minimizedBtn.className = 'vi-minimized-launcher';
  minimizedBtn.innerHTML = `${SVG_ICONS.pointer} <span>Vibe Inspector</span>`;
  minimizedBtn.title = 'Click to open floating inspector toolbar';
  minimizedBtn.onclick = () => {
    isMinimized = false;
    renderToolbarState();
  };
  shadow.appendChild(minimizedBtn);

  // Panels wrapper
  const panelsWrapper = document.createElement('div');
  panelsWrapper.className = 'vi-panels-wrapper';

  // Scrubber Panel
  const scrubberPanel = document.createElement('div');
  scrubberPanel.className = 'vi-panel vi-scrubber-panel';

  // Presets Panel
  const presetsPanel = document.createElement('div');
  presetsPanel.className = 'vi-panel vi-presets-panel';

  panelsWrapper.appendChild(scrubberPanel);
  panelsWrapper.appendChild(presetsPanel);
  container.appendChild(panelsWrapper);

  // The Main Pill Bar
  const pillBar = document.createElement('div');
  pillBar.className = 'vi-pill-bar';
  container.appendChild(pillBar);

  shadow.appendChild(container);

  // Helper for applying and tracking history
  function pushHistory(entry: HistoryEntry) {
    undoStack.push(entry);
    redoStack.length = 0;
    updateUndoRedoButtons();
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const entry = undoStack.pop()!;
    if (entry.type === 'style') {
      entry.element.setAttribute('style', entry.prevStyle);
      redoStack.push(entry);
      showToast(`Undo: ${entry.description}`);
    } else if (entry.type === 'duplicate' && entry.cloneNode) {
      entry.cloneNode.remove();
      redoStack.push(entry);
      showToast('Undo: Duplicated element removed');
    } else if (entry.type === 'remove' && entry.parent) {
      if (entry.nextSibling) {
        entry.parent.insertBefore(entry.element, entry.nextSibling);
      } else {
        entry.parent.appendChild(entry.element);
      }
      onSelectElement(entry.element);
      redoStack.push(entry);
      showToast('Undo: Restored deleted element');
    }
    updateUndoRedoButtons();
    onUpdatePositions();
    renderScrubbers();
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const entry = redoStack.pop()!;
    if (entry.type === 'style') {
      entry.element.setAttribute('style', entry.newStyle);
      undoStack.push(entry);
      showToast(`Redo: ${entry.description}`);
    } else if (entry.type === 'duplicate' && entry.cloneNode && entry.parent) {
      if (entry.nextSibling) {
        entry.parent.insertBefore(entry.cloneNode, entry.nextSibling);
      } else {
        entry.parent.appendChild(entry.cloneNode);
      }
      undoStack.push(entry);
      showToast('Redo: Restored duplication');
    } else if (entry.type === 'remove') {
      entry.element.remove();
      onSelectElement(null);
      undoStack.push(entry);
      showToast('Redo: Deleted element');
    }
    updateUndoRedoButtons();
    onUpdatePositions();
    renderScrubbers();
  }

  // 3. Render the Pill Bar Buttons
  function renderPillBar() {
    pillBar.innerHTML = '';

    // Group 1: Undo / Redo
    const undoBtn = createButton({
      icon: SVG_ICONS.undo,
      tooltip: 'Undo (Ctrl+Z)',
      disabled: undoStack.length === 0,
      onClick: handleUndo,
    });
    undoBtn.id = 'vi-btn-undo';

    const redoBtn = createButton({
      icon: SVG_ICONS.redo,
      tooltip: 'Redo (Ctrl+Y)',
      disabled: redoStack.length === 0,
      onClick: handleRedo,
    });
    redoBtn.id = 'vi-btn-redo';

    pillBar.appendChild(undoBtn);
    pillBar.appendChild(redoBtn);

    pillBar.appendChild(createDivider());

    // Group 2: Pointer / Select Tool (matches blue pill in screenshot)
    const pointerBtn = createButton({
      icon: SVG_ICONS.pointer,
      tooltip: 'Inspect Element (Alt+I)',
      active: isPicking(),
      isPillPrimary: true,
      onClick: () => {
        onTogglePicker();
        renderPillBar();
      },
    });
    pointerBtn.id = 'vi-btn-pointer';
    pillBar.appendChild(pointerBtn);

    pillBar.appendChild(createDivider());

    // Group 3: Cut / Copy / Paste / Duplicate / Delete
    const cutBtn = createButton({
      icon: SVG_ICONS.cut,
      tooltip: 'Cut Element (Ctrl+X)',
      onClick: () => {
        const el = getSelectedElement();
        if (!el) {
          showToast('Select an element first');
          return;
        }
        navigator.clipboard.writeText(el.outerHTML);
        const parent = el.parentElement;
        const nextSibling = el.nextSibling;
        const prevStyle = el.getAttribute('style') || '';
        pushHistory({
          description: 'Cut Element',
          element: el,
          prevStyle,
          newStyle: '',
          type: 'remove',
          parent,
          nextSibling,
        });
        el.remove();
        onSelectElement(null);
        onUpdatePositions();
        showToast('Element cut to clipboard');
      },
    });

    const copyBtn = createButton({
      icon: SVG_ICONS.copy,
      tooltip: 'Copy CSS / Element',
      onClick: () => {
        const el = getSelectedElement();
        if (!el) {
          showToast('Select an element first');
          return;
        }
        copiedStyles = el.getAttribute('style') || '';
        const computed = window.getComputedStyle(el);
        const snippet = `/* ${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} */\n${copiedStyles || `font-size: ${computed.fontSize};\ncolor: ${computed.color};\nbackground: ${computed.backgroundColor};`}`;
        navigator.clipboard.writeText(snippet);
        showToast('Copied styles to clipboard');
      },
    });

    const pasteBtn = createButton({
      icon: SVG_ICONS.paste,
      tooltip: 'Paste Styles to Selected Element',
      onClick: () => {
        const el = getSelectedElement();
        if (!el) {
          showToast('Select an element first');
          return;
        }
        if (!copiedStyles) {
          showToast('No copied styles in buffer');
          return;
        }
        const prevStyle = el.getAttribute('style') || '';
        el.style.cssText += ';' + copiedStyles;
        const newStyle = el.getAttribute('style') || '';
        pushHistory({
          description: 'Paste Styles',
          element: el,
          prevStyle,
          newStyle,
          type: 'style',
        });
        onUpdatePositions();
        renderScrubbers();
        showToast('Styles pasted!');
      },
    });

    const duplicateBtn = createButton({
      icon: SVG_ICONS.duplicate,
      tooltip: 'Duplicate Element (Ctrl+D)',
      onClick: () => {
        const el = getSelectedElement();
        if (!el || !el.parentElement) {
          showToast('Select an element first');
          return;
        }
        const clone = el.cloneNode(true) as HTMLElement;
        const parent = el.parentElement;
        const nextSibling = el.nextSibling;
        if (nextSibling) {
          parent.insertBefore(clone, nextSibling);
        } else {
          parent.appendChild(clone);
        }
        pushHistory({
          description: 'Duplicate Element',
          element: el,
          cloneNode: clone,
          parent,
          nextSibling,
          prevStyle: '',
          newStyle: '',
          type: 'duplicate',
        });
        onSelectElement(clone);
        onNotifySelection(clone);
        onUpdatePositions();
        showToast('Element duplicated');
      },
    });

    const deleteBtn = createButton({
      icon: SVG_ICONS.trash,
      tooltip: 'Delete Element (Del)',
      onClick: () => {
        const el = getSelectedElement();
        if (!el || !el.parentElement) {
          showToast('Select an element first');
          return;
        }
        const parent = el.parentElement;
        const nextSibling = el.nextSibling;
        const prevStyle = el.getAttribute('style') || '';
        pushHistory({
          description: 'Delete Element',
          element: el,
          prevStyle,
          newStyle: '',
          type: 'remove',
          parent,
          nextSibling,
        });
        el.remove();
        onSelectElement(null);
        onUpdatePositions();
        showToast('Element deleted (Click Undo to restore)');
      },
    });

    pillBar.appendChild(cutBtn);
    pillBar.appendChild(copyBtn);
    pillBar.appendChild(pasteBtn);
    pillBar.appendChild(duplicateBtn);
    pillBar.appendChild(deleteBtn);

    pillBar.appendChild(createDivider());

    // Group 4: Scrubber & Presets Panels
    const scrubberBtn = createButton({
      icon: SVG_ICONS.scrubbers,
      tooltip: 'After Effects Style Value Scrubbers',
      active: isScrubberOpen,
      onClick: () => {
        isScrubberOpen = !isScrubberOpen;
        if (isScrubberOpen) isPresetsOpen = false;
        renderToolbarState();
      },
    });

    const presetsBtn = createButton({
      icon: SVG_ICONS.presets,
      tooltip: '20+ Instant Visual Effects & Presets',
      active: isPresetsOpen,
      onClick: () => {
        isPresetsOpen = !isPresetsOpen;
        if (isPresetsOpen) isScrubberOpen = false;
        renderToolbarState();
      },
    });

    const dockBtn = createButton({
      icon: SVG_ICONS.dock,
      tooltip: isDockedTop ? 'Dock to Bottom' : 'Dock to Top',
      onClick: () => {
        isDockedTop = !isDockedTop;
        container.classList.toggle('top', isDockedTop);
        container.classList.toggle('bottom', !isDockedTop);
        showToast(isDockedTop ? 'Docked to Top' : 'Docked to Bottom');
      },
    });

    pillBar.appendChild(scrubberBtn);
    pillBar.appendChild(presetsBtn);
    pillBar.appendChild(dockBtn);

    pillBar.appendChild(createDivider());

    // Group 5: Power / Toggle Switch (Matching screenshot)
    const powerBtn = createButton({
      icon: SVG_ICONS.power,
      tooltip: 'Minimize / Close Toolbar',
      isPower: true,
      onClick: () => {
        isMinimized = true;
        isScrubberOpen = false;
        isPresetsOpen = false;
        renderToolbarState();
        showToast('Toolbar minimized — Click icon to restore');
      },
    });
    pillBar.appendChild(powerBtn);
  }

  function updateUndoRedoButtons() {
    const undoBtn = pillBar.querySelector('#vi-btn-undo') as HTMLButtonElement | null;
    const redoBtn = pillBar.querySelector('#vi-btn-redo') as HTMLButtonElement | null;
    if (undoBtn) {
      undoBtn.disabled = undoStack.length === 0;
      undoBtn.classList.toggle('disabled', undoStack.length === 0);
    }
    if (redoBtn) {
      redoBtn.disabled = redoStack.length === 0;
      redoBtn.classList.toggle('disabled', redoStack.length === 0);
    }
  }

  // 4. Render the After Effects Style Scrubbers
  function renderScrubbers() {
    const el = getSelectedElement();
    if (!el) {
      scrubberPanel.innerHTML = `
        <div class="vi-panel-header">
          <span class="vi-panel-title">${SVG_ICONS.scrubbers} Realtime Value Scrubbers</span>
          <button class="vi-panel-close" id="vi-scrubber-close">${SVG_ICONS.close}</button>
        </div>
        <div class="vi-panel-empty">
          Click <strong>Inspect (Alt+I)</strong> or select any element on page to scrub properties in real time.
        </div>
      `;
      scrubberPanel.querySelector('#vi-scrubber-close')?.addEventListener('click', () => {
        isScrubberOpen = false;
        renderToolbarState();
      });
      return;
    }

    const computed = window.getComputedStyle(el);

    const properties = [
      { key: 'fontSize', label: 'Font Size', unit: 'px', min: 8, max: 144, step: 1 },
      { key: 'borderRadius', label: 'Radius', unit: 'px', min: 0, max: 100, step: 1 },
      { key: 'padding', label: 'Padding', unit: 'px', min: 0, max: 120, step: 1 },
      { key: 'margin', label: 'Margin', unit: 'px', min: -50, max: 150, step: 1 },
      { key: 'opacity', label: 'Opacity', unit: '%', min: 0, max: 100, step: 1, isPercent: true },
      { key: 'letterSpacing', label: 'Tracking', unit: 'px', min: -5, max: 30, step: 0.5 },
      { key: 'blur', label: 'Blur', unit: 'px', min: 0, max: 50, step: 1, isFilter: true },
      { key: 'rotate', label: 'Rotate', unit: 'deg', min: -360, max: 360, step: 1, isTransform: true },
      { key: 'scale', label: 'Scale', unit: 'x', min: 0.2, max: 3, step: 0.05, isTransform: true },
    ];

    scrubberPanel.innerHTML = `
      <div class="vi-panel-header">
        <span class="vi-panel-title">${SVG_ICONS.scrubbers} ${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} Controls</span>
        <div class="vi-panel-actions">
          <span class="vi-panel-hint">Drag Left/Right or Scroll Wheel</span>
          <button class="vi-panel-close" id="vi-scrubber-close">${SVG_ICONS.close}</button>
        </div>
      </div>
      <div class="vi-scrubber-grid">
        ${properties.map((prop) => `
          <div class="vi-scrubber-item" data-prop="${prop.key}">
            <div class="vi-scrubber-label" title="Click & Drag horizontally to adjust">${prop.label}</div>
            <div class="vi-scrubber-val-wrapper">
              <span class="vi-scrubber-value" id="val-${prop.key}">--</span>
              <span class="vi-scrubber-unit">${prop.unit}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    scrubberPanel.querySelector('#vi-scrubber-close')?.addEventListener('click', () => {
      isScrubberOpen = false;
      renderToolbarState();
    });

    // Attach interactive drag scrubber and scroll events
    properties.forEach((prop) => {
      const itemEl = scrubberPanel.querySelector(`[data-prop="${prop.key}"]`) as HTMLElement;
      const valEl = scrubberPanel.querySelector(`#val-${prop.key}`) as HTMLElement;
      if (!itemEl || !valEl) return;

      // Extract current value
      let currentVal = 0;
      if (prop.isPercent) {
        currentVal = Math.round(parseFloat(computed.opacity || '1') * 100);
      } else if (prop.isFilter) {
        const m = (el.style.filter || '').match(/blur\(([\d.]+)px\)/);
        currentVal = m ? parseFloat(m[1]) : 0;
      } else if (prop.isTransform) {
        if (prop.key === 'rotate') {
          const m = (el.style.transform || '').match(/rotate\(([\d.-]+)deg\)/);
          currentVal = m ? parseFloat(m[1]) : 0;
        } else if (prop.key === 'scale') {
          const m = (el.style.transform || '').match(/scale\(([\d.-]+)\)/);
          currentVal = m ? parseFloat(m[1]) : 1;
        }
      } else {
        const raw = (computed as any)[prop.key] || '0px';
        currentVal = parseFloat(raw) || 0;
      }

      valEl.textContent = prop.step < 1 ? currentVal.toFixed(2) : String(Math.round(currentVal));

      // Pointer Scrubbing (Drag Left/Right like After Effects/Figma)
      itemEl.addEventListener('pointerdown', (e: PointerEvent) => {
        itemEl.setPointerCapture(e.pointerId);
        itemEl.classList.add('scrubbing');
        document.body.style.cursor = 'col-resize';

        const startX = e.clientX;
        const initialVal = currentVal;
        const prevStyle = el.getAttribute('style') || '';

        const onPointerMove = (moveEv: PointerEvent) => {
          const deltaX = moveEv.clientX - startX;
          const multiplier = moveEv.shiftKey ? 10 : moveEv.altKey ? 0.1 : 1;
          const deltaVal = deltaX * prop.step * multiplier * 0.4;
          let nextVal = initialVal + deltaVal;

          if (prop.min !== undefined) nextVal = Math.max(prop.min, nextVal);
          if (prop.max !== undefined) nextVal = Math.min(prop.max, nextVal);

          currentVal = nextVal;
          valEl.textContent = prop.step < 1 ? nextVal.toFixed(2) : String(Math.round(nextVal));

          // Apply in real-time
          if (prop.isPercent) {
            el.style.opacity = (nextVal / 100).toFixed(2);
          } else if (prop.isFilter) {
            el.style.filter = `blur(${nextVal.toFixed(1)}px)`;
          } else if (prop.isTransform) {
            if (prop.key === 'rotate') {
              el.style.transform = `rotate(${nextVal.toFixed(0)}deg)`;
            } else if (prop.key === 'scale') {
              el.style.transform = `scale(${nextVal.toFixed(2)})`;
            }
          } else {
            (el.style as any)[prop.key] = `${nextVal.toFixed(1)}${prop.unit}`;
          }

          onUpdatePositions();
        };

        const onPointerUp = () => {
          itemEl.releasePointerCapture(e.pointerId);
          itemEl.classList.remove('scrubbing');
          document.body.style.cursor = '';
          itemEl.removeEventListener('pointermove', onPointerMove);
          itemEl.removeEventListener('pointerup', onPointerUp);

          const newStyle = el.getAttribute('style') || '';
          if (prevStyle !== newStyle) {
            pushHistory({
              description: `${prop.label} ${valEl.textContent}${prop.unit}`,
              element: el,
              prevStyle,
              newStyle,
              type: 'style',
            });
          }
        };

        itemEl.addEventListener('pointermove', onPointerMove);
        itemEl.addEventListener('pointerup', onPointerUp);
      });

      // Mouse Wheel Real-time Scrubbing
      itemEl.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const prevStyle = el.getAttribute('style') || '';
        const direction = e.deltaY < 0 ? 1 : -1;
        const multiplier = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
        let nextVal = currentVal + direction * prop.step * multiplier;

        if (prop.min !== undefined) nextVal = Math.max(prop.min, nextVal);
        if (prop.max !== undefined) nextVal = Math.min(prop.max, nextVal);

        currentVal = nextVal;
        valEl.textContent = prop.step < 1 ? nextVal.toFixed(2) : String(Math.round(nextVal));

        if (prop.isPercent) {
          el.style.opacity = (nextVal / 100).toFixed(2);
        } else if (prop.isFilter) {
          el.style.filter = `blur(${nextVal.toFixed(1)}px)`;
        } else if (prop.isTransform) {
          if (prop.key === 'rotate') el.style.transform = `rotate(${nextVal.toFixed(0)}deg)`;
          if (prop.key === 'scale') el.style.transform = `scale(${nextVal.toFixed(2)})`;
        } else {
          (el.style as any)[prop.key] = `${nextVal.toFixed(1)}${prop.unit}`;
        }

        onUpdatePositions();
        pushHistory({
          description: `${prop.label} ${valEl.textContent}${prop.unit}`,
          element: el,
          prevStyle,
          newStyle: el.getAttribute('style') || '',
          type: 'style',
        });
      }, { passive: false });
    });
  }

  // 5. Render the 20+ Visual Presets Library
  let selectedCategory = 'All';
  function renderPresets() {
    const categories = ['All', 'Gradients & Text', 'Glass & Shadows', 'Cyber & Glow', 'Borders & Shape', 'Animations'];

    const filtered = selectedCategory === 'All'
      ? VISUAL_PRESETS
      : VISUAL_PRESETS.filter((p) => p.category === selectedCategory);

    presetsPanel.innerHTML = `
      <div class="vi-panel-header">
        <span class="vi-panel-title">${SVG_ICONS.presets} 24+ Instant Visual Effects</span>
        <button class="vi-panel-close" id="vi-presets-close">${SVG_ICONS.close}</button>
      </div>
      <div class="vi-presets-categories">
        ${categories.map((cat) => `
          <button class="vi-cat-chip ${cat === selectedCategory ? 'active' : ''}" data-cat="${cat}">${cat}</button>
        `).join('')}
      </div>
      <div class="vi-presets-grid">
        ${filtered.map((preset) => `
          <div class="vi-preset-card" data-preset-id="${preset.id}">
            <div class="vi-preset-card-header">
              <span class="vi-preset-name">${preset.name}</span>
              <span class="vi-preset-cat">${preset.category}</span>
            </div>
            <p class="vi-preset-desc">${preset.description}</p>
            <button class="vi-preset-apply-btn" data-preset-apply="${preset.id}">Apply Preset</button>
          </div>
        `).join('')}
      </div>
    `;

    presetsPanel.querySelector('#vi-presets-close')?.addEventListener('click', () => {
      isPresetsOpen = false;
      renderToolbarState();
    });

    // Category filtering
    presetsPanel.querySelectorAll('.vi-cat-chip').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        selectedCategory = (e.currentTarget as HTMLElement).getAttribute('data-cat') || 'All';
        renderPresets();
      });
    });

    // Apply Preset button
    presetsPanel.querySelectorAll('[data-preset-apply]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-preset-apply');
        const preset = VISUAL_PRESETS.find((p) => p.id === id);
        if (!preset) return;

        const el = getSelectedElement();
        if (!el) {
          showToast('Select an element first to apply preset');
          return;
        }

        // Inject keyframes if needed
        if (preset.keyframes && keyframesEl && !keyframesEl.textContent?.includes(preset.id)) {
          keyframesEl.textContent += '\n' + preset.keyframes;
        }

        const prevStyle = el.getAttribute('style') || '';

        // Apply styles
        Object.entries(preset.styles).forEach(([prop, val]) => {
          (el.style as any)[prop] = val;
        });

        const newStyle = el.getAttribute('style') || '';
        pushHistory({
          description: `Preset: ${preset.name}`,
          element: el,
          prevStyle,
          newStyle,
          type: 'style',
        });

        onUpdatePositions();
        renderScrubbers();
        showToast(`Applied ${preset.name}!`);
      });
    });
  }

  // 6. Update Overall Toolbar Visibility & State
  function renderToolbarState() {
    container.style.display = isMinimized ? 'none' : 'flex';
    minimizedBtn.style.display = isMinimized ? 'flex' : 'none';

    scrubberPanel.style.display = isScrubberOpen ? 'flex' : 'none';
    presetsPanel.style.display = isPresetsOpen ? 'flex' : 'none';

    if (isScrubberOpen) renderScrubbers();
    if (isPresetsOpen) renderPresets();

    renderPillBar();
  }

  // Helper creators
  function createDivider(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'vi-pill-divider';
    return div;
  }

  function createButton(opts: {
    icon: string;
    tooltip: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    isPillPrimary?: boolean;
    isPower?: boolean;
  }): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'vi-pill-btn';
    btn.innerHTML = opts.icon;
    btn.title = opts.tooltip;

    if (opts.active) btn.classList.add('active');
    if (opts.disabled) {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
    if (opts.isPillPrimary) btn.classList.add('pill-primary');
    if (opts.isPower) btn.classList.add('power-btn');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!btn.disabled) opts.onClick();
    });

    return btn;
  }

  // Keyboard Shortcuts (Undo, Redo, Inspect)
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Ctrl+Z / Cmd+Z => Undo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }
    // Ctrl+Y or Ctrl+Shift+Z => Redo
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
    }
    // Alt+I => Toggle Element Picker
    if (e.altKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      onTogglePicker();
      renderPillBar();
    }
  });

  // Initial render
  renderToolbarState();

  return {
    updateSelection: () => {
      renderPillBar();
      if (isScrubberOpen) renderScrubbers();
    },
    updatePickerState: () => {
      renderPillBar();
    },
    notifyStyleApplied: (element: HTMLElement, prevStyle: string, newStyle: string, desc: string) => {
      pushHistory({
        description: desc,
        element,
        prevStyle,
        newStyle,
        type: 'style',
      });
      if (isScrubberOpen) renderScrubbers();
    },
  };
}

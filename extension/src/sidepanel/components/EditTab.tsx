import React, { useState, useEffect, FC } from 'react';
import { ElementInfo } from '@vibe-inspector/shared';
import { ScrubbableInput } from './ScrubbableInput';
import { SpacingBox } from './SpacingBox';
import { PresetsModal } from './PresetsModal';
import { FONT_LIBRARY } from '../constants/fontLibrary';

interface EditTabProps {
  element: ElementInfo;
  modifiedProps: Record<string, string>;
  onApplyStyle: (property: string, value: string, oldValue?: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetElement: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onHighlight: () => void;
}

const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];

const FONT_WEIGHTS = [
  { label: '100 - Thin', value: '100' },
  { label: '200 - Extra Light', value: '200' },
  { label: '300 - Light', value: '300' },
  { label: '400 - Regular', value: '400' },
  { label: '500 - Medium', value: '500' },
  { label: '600 - SemiBold', value: '600' },
  { label: '700 - Bold', value: '700' },
  { label: '800 - Extra Bold', value: '800' },
  { label: '900 - Black', value: '900' },
];



const SVG_ICONS = {
  up: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  down: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  left: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  right: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  highlight: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  ),
  presets: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  save: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  undo: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
  redo: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  ),
  link: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  unlink: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ),
  eyedropper: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 2 4 4L7 17H3v-4L14 2z" />
      <path d="m13 7 4 4" />
    </svg>
  ),
  shadow: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M8 8l8 8" />
      <path d="M16 8l-8 8" />
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  copy: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  ),
  plus: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  minus: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  upload: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  alignLeft: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
    </svg>
  ),
  alignCenter: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/>
    </svg>
  ),
  alignRight: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>
    </svg>
  ),
  alignJustify: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/>
    </svg>
  ),
};

interface BoxShadowParts {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
  inset: boolean;
}

function parseBoxShadow(raw: string): BoxShadowParts {
  if (!raw || raw === 'none') {
    return { x: '0px', y: '4px', blur: '12px', spread: '0px', color: '#00000026', inset: false };
  }
  const inset = raw.includes('inset');
  let clean = raw.replace('inset', '').trim();
  let color = '#00000026';

  const colorMatch = clean.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8}|[a-z]+$)/i);
  if (colorMatch) {
    color = colorMatch[0];
    clean = clean.replace(color, '').trim();
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  return {
    x: parts[0] || '0px',
    y: parts[1] || '4px',
    blur: parts[2] || '12px',
    spread: parts[3] || '0px',
    color,
    inset,
  };
}

interface TextShadowParts {
  x: string;
  y: string;
  blur: string;
  color: string;
}

function parseTextShadow(raw: string): TextShadowParts {
  if (!raw || raw === 'none') {
    return { x: '0px', y: '2px', blur: '4px', color: '#00000040' };
  }
  let clean = raw.trim();
  let color = '#00000040';

  const colorMatch = clean.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8}|[a-z]+$)/i);
  if (colorMatch) {
    color = colorMatch[0];
    clean = clean.replace(color, '').trim();
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  return {
    x: parts[0] || '0px',
    y: parts[1] || '2px',
    blur: parts[2] || '4px',
    color,
  };
}

export const EditTab: FC<EditTabProps> = ({
  element,
  modifiedProps,
  onApplyStyle,
  onUndo,
  onRedo,
  onResetElement,
  canUndo,
  canRedo,
  onHighlight,
}) => {
  // Navigation & Sensitivity State
  const [sensitivity, setSensitivity] = useState(50);
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [exportScale, setExportScale] = useState<1 | 2 | 3>(2);
  const [exportTransparent, setExportTransparent] = useState(true);
  const [isExportingElement, setIsExportingElement] = useState(false);
  const [isExportingViewport, setIsExportingViewport] = useState(false);

  // Searchable 80+ Font Picker State
  const [fontSearch, setFontSearch] = useState('');
  const [fontCategory, setFontCategory] = useState<string>('All');
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);

  // Link Toggles for Grouped Properties
  const [radiusLinked, setRadiusLinked] = useState(true);
  const [gapLinked, setGapLinked] = useState(true);
  const [borderLinked, setBorderLinked] = useState(true);

  // Collapsible Optional Sections
  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
    image: false,
    background: true,
    spacing: true,
    border: true,
    boxShadow: true,
  });

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    appearance: false,
    typography: false,
    image: false,
    background: false,
    spacing: false,
    border: false,
    boxShadow: false,
    layout: false,
    export: false,
  });

  // Load sensitivity and collapsed states from chrome.storage
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['vibe_sensitivity', 'vibe_sections'], (res) => {
        if (typeof res?.vibe_sensitivity === 'number') {
          setSensitivity(res.vibe_sensitivity);
        }
        if (res?.vibe_sections) {
          setActiveSections((prev) => ({ ...prev, ...res.vibe_sections.active, boxShadow: true }));
          setCollapsedSections((prev) => ({ ...prev, ...res.vibe_sections.collapsed }));
        }
      });
    }
  }, []);

  const handleSensitivityChange = (val: number) => {
    setSensitivity(val);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ vibe_sensitivity: val });
    }
    // Broadcast sensitivity to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'SET_PICKER_SENSITIVITY', sensitivity: val });
      }
    });
  };

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ vibe_sections: { active: activeSections, collapsed: next } });
      }
      return next;
    });
  };

  const toggleOptionalSection = (section: string) => {
    setActiveSections((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ vibe_sections: { active: next, collapsed: collapsedSections } });
      }
      return next;
    });
  };

  const camelToKebab = (s: string) => s.replace(/([A-Z])/g, '-$1').toLowerCase();
  const kebabToCamel = (s: string) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

  // Helper to read effective property value (check modified first with dual casing, then computed)
  const getVal = (prop: string, fallback = '') => {
    const kebab = camelToKebab(prop);
    const camel = kebabToCamel(prop);
    return (
      modifiedProps[prop] ??
      modifiedProps[kebab] ??
      modifiedProps[camel] ??
      element.computedStyles[prop] ??
      element.computedStyles[camel] ??
      element.computedStyles[kebab] ??
      fallback
    );
  };

  // Shadow helpers for real-time dragging & updating
  const currentBoxShadow = getVal('boxShadow', element.computedStyles.boxShadow || 'none');
  const boxShadowParts = parseBoxShadow(currentBoxShadow);

  const updateBoxShadowPart = (key: keyof BoxShadowParts, val: any) => {
    const next = { ...boxShadowParts, [key]: val };
    const insetStr = next.inset ? 'inset ' : '';
    const combined = `${insetStr}${next.x} ${next.y} ${next.blur} ${next.spread} ${next.color}`.trim();
    handlePropertyChange('box-shadow', 'boxShadow', combined);
  };

  const currentTextShadow = getVal('textShadow', element.computedStyles.textShadow || 'none');
  const textShadowParts = parseTextShadow(currentTextShadow);

  const updateTextShadowPart = (key: keyof TextShadowParts, val: any) => {
    const next = { ...textShadowParts, [key]: val };
    const combined = `${next.x} ${next.y} ${next.blur} ${next.color}`.trim();
    handlePropertyChange('text-shadow', 'textShadow', combined);
  };

  const handlePropertyChange = (cssProp: string, jsProp: string, val: string) => {
    const oldVal = element.computedStyles[jsProp] || '';
    onApplyStyle(cssProp, val, oldVal);
  };

  const handleResetProperty = (cssProp: string) => {
    onApplyStyle(cssProp, '');
  };

  // Relative Navigation helper (parent, child, prev, next)
  const handleRelativeSelect = (direction: 'parent' | 'child' | 'prev' | 'next') => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'SELECT_RELATIVE', direction });
      }
    });
  };

  // Copy selector to clipboard
  const handleCopySelector = () => {
    navigator.clipboard.writeText(element.selector);
    setCopiedSelector(true);
    setTimeout(() => setCopiedSelector(false), 1500);
  };

  // Native EyeDropper API (Ponytail: native browser API, zero third-party library)
  const handleEyeDropper = async (cssProp: string, jsProp: string) => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const res = await eyeDropper.open();
        if (res?.sRGBHex) {
          handlePropertyChange(cssProp, jsProp, res.sRGBHex);
        }
      } catch {}
    }
  };

  // Radius Corner Synchronization
  const handleRadiusCornerChange = (cornerCss: string, cornerJs: string, val: string) => {
    if (radiusLinked) {
      handlePropertyChange('border-radius', 'borderRadius', val);
      handlePropertyChange('border-top-left-radius', 'borderTopLeftRadius', val);
      handlePropertyChange('border-top-right-radius', 'borderTopRightRadius', val);
      handlePropertyChange('border-bottom-right-radius', 'borderBottomRightRadius', val);
      handlePropertyChange('border-bottom-left-radius', 'borderBottomLeftRadius', val);
    } else {
      handlePropertyChange(cornerCss, cornerJs, val);
    }
  };

  // Export element snapshot
  const handleExportElement = () => {
    setIsExportingElement(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(
          tabId,
          {
            type: 'EXPORT_ELEMENT_PNG',
            selector: element.selector,
            scale: exportScale,
            transparent: exportTransparent,
          },
          (res) => {
            setIsExportingElement(false);
            if (res?.dataUrl) {
              const a = document.createElement('a');
              a.href = res.dataUrl;
              a.download = `element-${element.tag || 'export'}-${Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          }
        );
      } else {
        setIsExportingElement(false);
      }
    });
  };

  // Export viewport snapshot
  const handleExportViewport = () => {
    setIsExportingViewport(true);
    chrome.runtime.sendMessage({ type: 'CAPTURE_TAB_PNG' }, (res) => {
      setIsExportingViewport(false);
      if (res?.dataUrl) {
        const a = document.createElement('a');
        a.href = res.dataUrl;
        a.download = `viewport-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  // Swap preview image (preview only, never uploaded)
  const handleImageSwap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      handlePropertyChange('src', 'src', previewUrl);
    }
  };

  const hasModifications = Object.keys(modifiedProps).length > 0;

  return (
    <div className="vi-edit-tab">
      {/* 1. Element Header & Hierarchy Navigator */}
      <div className="vi-element-card">
        <div className="vi-element-card-top">
          <div
            className="vi-selector-chip"
            onClick={handleCopySelector}
            title={`${element.selector} (Click to copy)`}
          >
            <span className="vi-selector-text">{element.selector}</span>
            <span className="vi-chip-copy-icon">{copiedSelector ? SVG_ICONS.check : SVG_ICONS.copy}</span>
          </div>

          <div className="vi-nav-group">
            <button
              className="vi-nav-btn"
              onClick={() => handleRelativeSelect('parent')}
              title="Select Parent Element"
            >
              {SVG_ICONS.up}
            </button>
            <button
              className="vi-nav-btn"
              onClick={() => handleRelativeSelect('child')}
              title="Select First Child"
            >
              {SVG_ICONS.down}
            </button>
            <button
              className="vi-nav-btn"
              onClick={() => handleRelativeSelect('prev')}
              title="Select Previous Sibling"
            >
              {SVG_ICONS.left}
            </button>
            <button
              className="vi-nav-btn"
              onClick={() => handleRelativeSelect('next')}
              title="Select Next Sibling"
            >
              {SVG_ICONS.right}
            </button>
          </div>
        </div>

        {/* Quick highlight & tag details */}
        <div className="vi-element-card-bottom">
          <span className="vi-dim-pill">
            {Math.round(element.boundingRect.width)} × {Math.round(element.boundingRect.height)} px
          </span>
          <span className="vi-term-pill">{element.uiTerm}</span>
          <button className="vi-btn-highlight-sm" onClick={onHighlight} title="Flash element in page">
            {SVG_ICONS.highlight} <span>Highlight</span>
          </button>
        </div>
      </div>

      {/* 2. Sensitivity Slider & Presets Toolbar */}
      <div className="vi-toolbar-row">
        <div className="vi-sensitivity-box" title="Controls picker depth: Leaf node vs Semantic Container">
          <span className="vi-toolbar-label">
            Sensitivity: <strong style={{ color: 'var(--vi-accent-base)' }}>{sensitivity}%</strong>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={sensitivity}
            onChange={(e) => handleSensitivityChange(Number(e.target.value))}
            className="vi-slider"
          />
        </div>

        <div className="vi-presets-toolbar-actions">
          <button
            className="vi-btn-presets"
            onClick={() => setIsPresetsOpen(true)}
            title="Browse built-in and saved presets"
          >
            {SVG_ICONS.presets} <span>Browse Presets</span>
          </button>
          <button
            className="vi-btn-icon-save"
            onClick={() => setIsPresetsOpen(true)}
            title="Save current modifications as preset"
            disabled={!hasModifications}
          >
            {SVG_ICONS.save}
          </button>
        </div>
      </div>

      {/* History Controls Bar (Undo / Redo / Reset) */}
      <div className="vi-history-strip">
        <div className="vi-history-buttons">
          <button
            className="vi-btn-history"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo edit (Ctrl+Z)"
          >
            {SVG_ICONS.undo} <span>Undo</span>
          </button>
          <button
            className="vi-btn-history"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo edit (Shift+Ctrl+Z)"
          >
            {SVG_ICONS.redo} <span>Redo</span>
          </button>
        </div>
        {hasModifications && (
          <button className="vi-btn-reset-element" onClick={onResetElement}>
            Reset Element
          </button>
        )}
      </div>

      {/* 3. Appearance Section */}
      <div className="vi-section">
        <div className="vi-section-header" onClick={() => toggleSection('appearance')}>
          <div className="vi-section-title">
            <span className="vi-section-arrow">{collapsedSections.appearance ? SVG_ICONS.right : SVG_ICONS.down}</span>
            <span>Appearance</span>
          </div>
        </div>

        {!collapsedSections.appearance && (
          <div className="vi-section-content">
            <div className="vi-grid-2">
              <ScrubbableInput
                label="Opacity"
                value={getVal('opacity', '1')}
                computedValue={element.computedStyles.opacity}
                onChange={(v) => handlePropertyChange('opacity', 'opacity', v)}
                onReset={() => handleResetProperty('opacity')}
                units={['%']}
                min={0}
                max={100}
                step={1}
              />
              <ScrubbableInput
                label="Rotation"
                value={getVal('rotate', '0deg')}
                computedValue={element.computedStyles.rotate}
                onChange={(v) => handlePropertyChange('rotate', 'rotate', v)}
                onReset={() => handleResetProperty('rotate')}
                units={['deg']}
                step={1}
              />
            </div>

            {/* Border Radius 4 Corners */}
            <div className="vi-corner-box">
              <div className="vi-corner-header">
                <span className="vi-field-label">Border Radius</span>
                <button
                  className={`vi-link-btn ${radiusLinked ? 'is-linked' : ''}`}
                  onClick={() => setRadiusLinked(!radiusLinked)}
                  title={radiusLinked ? 'Corners linked (editing one sets all)' : 'Corners unlinked'}
                >
                  {radiusLinked ? (
                    <>
                      {SVG_ICONS.link} <span>Linked</span>
                    </>
                  ) : (
                    <>
                      {SVG_ICONS.unlink} <span>Unlinked</span>
                    </>
                  )}
                </button>
              </div>

              {radiusLinked ? (
                <ScrubbableInput
                  label="All Corners"
                  value={getVal('borderRadius', getVal('borderTopLeftRadius', '0px'))}
                  computedValue={element.computedStyles.borderRadius || element.computedStyles.borderTopLeftRadius}
                  onChange={(v) => handleRadiusCornerChange('border-radius', 'borderRadius', v)}
                  onReset={() => {
                    handleResetProperty('border-radius');
                    handleResetProperty('border-top-left-radius');
                    handleResetProperty('border-top-right-radius');
                    handleResetProperty('border-bottom-right-radius');
                    handleResetProperty('border-bottom-left-radius');
                  }}
                  units={['px', '%', 'rem']}
                  tooltip="Border radius applied uniformly to all corners"
                />
              ) : (
                <div className="vi-corners-grid">
                  <ScrubbableInput
                    label="TL"
                    value={getVal('borderTopLeftRadius', '0px')}
                    computedValue={element.computedStyles.borderTopLeftRadius}
                    onChange={(v) => handleRadiusCornerChange('border-top-left-radius', 'borderTopLeftRadius', v)}
                    onReset={() => handleResetProperty('border-top-left-radius')}
                    units={['px', '%', 'rem']}
                  />
                  <ScrubbableInput
                    label="TR"
                    value={getVal('borderTopRightRadius', '0px')}
                    computedValue={element.computedStyles.borderTopRightRadius}
                    onChange={(v) => handleRadiusCornerChange('border-top-right-radius', 'borderTopRightRadius', v)}
                    onReset={() => handleResetProperty('border-top-right-radius')}
                    units={['px', '%', 'rem']}
                  />
                  <ScrubbableInput
                    label="BL"
                    value={getVal('borderBottomLeftRadius', '0px')}
                    computedValue={element.computedStyles.borderBottomLeftRadius}
                    onChange={(v) => handleRadiusCornerChange('border-bottom-left-radius', 'borderBottomLeftRadius', v)}
                    onReset={() => handleResetProperty('border-bottom-left-radius')}
                    units={['px', '%', 'rem']}
                  />
                  <ScrubbableInput
                    label="BR"
                    value={getVal('borderBottomRightRadius', '0px')}
                    computedValue={element.computedStyles.borderBottomRightRadius}
                    onChange={(v) => handleRadiusCornerChange('border-bottom-right-radius', 'borderBottomRightRadius', v)}
                    onReset={() => handleResetProperty('border-bottom-right-radius')}
                    units={['px', '%', 'rem']}
                  />
                </div>
              )}
            </div>

            {/* Blend Mode */}
            <div className="vi-field-row">
              <span className="vi-field-label">Blend Mode</span>
              <select
                className="vi-select"
                value={getVal('mixBlendMode', 'normal')}
                onChange={(e) => handlePropertyChange('mix-blend-mode', 'mixBlendMode', e.target.value)}
              >
                {BLEND_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. Typography Section */}
      <div className="vi-section">
        <div className="vi-section-header" onClick={() => toggleSection('typography')}>
          <div className="vi-section-title">
            <span className="vi-section-arrow">{collapsedSections.typography ? SVG_ICONS.right : SVG_ICONS.down}</span>
            <span>Typography</span>
          </div>
        </div>

        {!collapsedSections.typography && (
          <div className="vi-section-content">
            {/* Typeface Autocomplete & Searchable 80+ Font Picker */}
            <div className="vi-field-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="vi-field-label">Font Family</span>
                <button
                  type="button"
                  className={`vi-link-btn ${isFontPickerOpen ? 'is-linked' : ''}`}
                  onClick={() => setIsFontPickerOpen(!isFontPickerOpen)}
                  title="Toggle searchable 80+ fonts library"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>{isFontPickerOpen ? 'Close' : 'Browse 80+ Fonts'}</span>
                </button>
              </div>

              <input
                type="text"
                className="vi-input"
                list="vi-font-list"
                value={getVal('fontFamily', '')}
                placeholder="Font family..."
                onChange={(e) => handlePropertyChange('font-family', 'fontFamily', e.target.value)}
              />
              <datalist id="vi-font-list">
                {FONT_LIBRARY.map((f) => (
                  <option key={f.name} value={f.family}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </datalist>

              {isFontPickerOpen && (
                <div className="vi-font-picker-panel">
                  <input
                    type="text"
                    className="vi-input"
                    placeholder="Search 80+ fonts (e.g. Inter, Playfair, Mono)..."
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="vi-font-category-bar">
                    {['All', 'Sans-Serif', 'Serif', 'Monospace', 'Display', 'Handwriting'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`vi-font-category-btn ${fontCategory === cat ? 'is-active' : ''}`}
                        onClick={() => setFontCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="vi-font-list-scroll">
                    {FONT_LIBRARY.filter((f) => {
                      const matchesCat = fontCategory === 'All' || f.category === fontCategory;
                      const matchesSearch =
                        !fontSearch.trim() ||
                        f.name.toLowerCase().includes(fontSearch.toLowerCase().trim()) ||
                        f.category.toLowerCase().includes(fontSearch.toLowerCase().trim());
                      return matchesCat && matchesSearch;
                    }).map((f) => {
                      const currentVal = getVal('fontFamily', '').toLowerCase();
                      const isSelected = currentVal.includes(f.name.toLowerCase());
                      return (
                        <button
                          key={f.name}
                          type="button"
                          className={`vi-font-option-item ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            handlePropertyChange('font-family', 'fontFamily', f.family);
                            setIsFontPickerOpen(false);
                          }}
                        >
                          <span className="vi-font-option-name" style={{ fontFamily: f.family }}>
                            {f.name}
                          </span>
                          <span className="vi-font-option-badge">{f.category}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Weight Dropdown & Font Size */}
            <div className="vi-grid-2">
              <div className="vi-field-col">
                <span className="vi-field-label">Weight</span>
                <select
                  className="vi-select"
                  value={getVal('fontWeight', '400')}
                  onChange={(e) => handlePropertyChange('font-weight', 'fontWeight', e.target.value)}
                >
                  {FONT_WEIGHTS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              <ScrubbableInput
                label="Size"
                value={getVal('fontSize', '14px')}
                computedValue={element.computedStyles.fontSize}
                onChange={(v) => handlePropertyChange('font-size', 'fontSize', v)}
                onReset={() => handleResetProperty('font-size')}
                units={['px', 'rem', 'em']}
              />
            </div>

            {/* Line Height & Letter Spacing */}
            <div className="vi-grid-2">
              <ScrubbableInput
                label="Line Height"
                value={getVal('lineHeight', 'normal')}
                computedValue={element.computedStyles.lineHeight}
                onChange={(v) => handlePropertyChange('line-height', 'lineHeight', v)}
                onReset={() => handleResetProperty('line-height')}
                units={['px', 'em', 'auto']}
              />
              <ScrubbableInput
                label="Letter Spacing"
                value={getVal('letterSpacing', 'normal')}
                computedValue={element.computedStyles.letterSpacing}
                onChange={(v) => handlePropertyChange('letter-spacing', 'letterSpacing', v)}
                onReset={() => handleResetProperty('letter-spacing')}
                units={['px', 'em']}
              />
            </div>

            {/* Alignment Segmented Control */}
            <div className="vi-field-row">
              <span className="vi-field-label">Text Align</span>
              <div className="vi-segmented-control">
                {(['left', 'center', 'right', 'justify'] as const).map((align) => {
                  const rawAlign = getVal('textAlign', 'left');
                  const activeAlign = rawAlign === 'start' ? 'left' : rawAlign === 'end' ? 'right' : rawAlign;
                  return (
                    <button
                      key={align}
                      type="button"
                      className={`vi-segmented-btn ${activeAlign === align ? 'is-active' : ''}`}
                      onClick={() => handlePropertyChange('text-align', 'textAlign', align)}
                      title={`Align ${align}`}
                    >
                      {align === 'left' && SVG_ICONS.alignLeft}
                      {align === 'center' && SVG_ICONS.alignCenter}
                      {align === 'right' && SVG_ICONS.alignRight}
                      {align === 'justify' && SVG_ICONS.alignJustify}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Color & EyeDropper */}
            <div className="vi-field-row">
              <span className="vi-field-label">Color</span>
              <div className="vi-color-picker-group">
                <input
                  type="color"
                  className="vi-color-swatch"
                  value={getVal('color', '#ffffff').slice(0, 7)}
                  onChange={(e) => handlePropertyChange('color', 'color', e.target.value)}
                />
                <input
                  type="text"
                  className="vi-input-mono"
                  value={getVal('color', '#ffffff')}
                  onChange={(e) => handlePropertyChange('color', 'color', e.target.value)}
                />
                <button
                  className="vi-eyedropper-btn"
                  onClick={() => handleEyeDropper('color', 'color')}
                  title="Sample color from screen (EyeDropper)"
                >
                  {SVG_ICONS.eyedropper}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Optional Image Section */}
      <div className="vi-section">
        <div className="vi-section-header">
          <div className="vi-section-title" onClick={() => toggleSection('image')}>
            <span className="vi-section-arrow">{collapsedSections.image ? SVG_ICONS.right : SVG_ICONS.down}</span>
            <span>Image</span>
          </div>
          <button
            className="vi-section-toggle-btn"
            onClick={() => toggleOptionalSection('image')}
            title={activeSections.image ? 'Remove Image controls' : 'Add Image controls'}
          >
            {activeSections.image ? SVG_ICONS.minus : SVG_ICONS.plus}
          </button>
        </div>

        {activeSections.image && !collapsedSections.image && (
          <div className="vi-section-content">
            <div className="vi-grid-2">
              <div className="vi-field-col">
                <span className="vi-field-label">Object Fit</span>
                <select
                  className="vi-select"
                  value={getVal('objectFit', 'fill')}
                  onChange={(e) => handlePropertyChange('object-fit', 'objectFit', e.target.value)}
                >
                  {['fill', 'contain', 'cover', 'none', 'scale-down'].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="vi-field-col">
                <span className="vi-field-label">Aspect Ratio</span>
                <select
                  className="vi-select"
                  value={getVal('aspectRatio', 'auto')}
                  onChange={(e) => handlePropertyChange('aspect-ratio', 'aspectRatio', e.target.value)}
                >
                  {['auto', '1 / 1', '16 / 9', '4 / 3', '3 / 2'].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Local Preview Swap */}
            <div className="vi-field-row">
              <span className="vi-field-label">Swap Preview</span>
              <label className="vi-btn-ghost-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {SVG_ICONS.upload}
                <span>Choose File...</span>
                <input type="file" accept="image/*" onChange={handleImageSwap} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 6. Optional Background Section */}
      <div className="vi-section">
        <div className="vi-section-header">
          <div className="vi-section-title" onClick={() => toggleSection('background')}>
            <span className="vi-section-arrow">{collapsedSections.background ? SVG_ICONS.right : SVG_ICONS.down}</span>
            <span>Background</span>
          </div>
          <button
            className="vi-section-toggle-btn"
            onClick={() => toggleOptionalSection('background')}
            title={activeSections.background ? 'Remove Background controls' : 'Add Background controls'}
          >
            {activeSections.background ? SVG_ICONS.minus : SVG_ICONS.plus}
          </button>
        </div>

        {activeSections.background && !collapsedSections.background && (
          <div className="vi-section-content">
            <div className="vi-field-row">
              <span className="vi-field-label">Color</span>
              <div className="vi-color-picker-group">
                <input
                  type="color"
                  className="vi-color-swatch"
                  value={getVal('backgroundColor', '#1a1b20').slice(0, 7)}
                  onChange={(e) => handlePropertyChange('background-color', 'backgroundColor', e.target.value)}
                />
                <input
                  type="text"
                  className="vi-input-mono"
                  value={getVal('backgroundColor', '#1a1b20')}
                  onChange={(e) => handlePropertyChange('background-color', 'backgroundColor', e.target.value)}
                />
                <button
                  className="vi-eyedropper-btn"
                  onClick={() => handleEyeDropper('background-color', 'backgroundColor')}
                  title="Sample screen color"
                >
                  {SVG_ICONS.eyedropper}
                </button>
              </div>
            </div>

            <ScrubbableInput
              label="Backdrop Blur"
              value={getVal('backdropFilter', '0px')}
              computedValue={element.computedStyles.backdropFilter}
              onChange={(v) => handlePropertyChange('backdrop-filter', 'backdropFilter', `blur(${v})`)}
              onReset={() => handleResetProperty('backdrop-filter')}
              units={['px']}
            />
          </div>
        )}
      </div>

      {/* 7. Spacing & Box Model Section */}
      <div className="vi-section">
        <div className="vi-section-header">
          <div className="vi-section-title" onClick={() => toggleSection('spacing')}>
            <span className="vi-section-arrow">{collapsedSections.spacing ? SVG_ICONS.right : SVG_ICONS.down}</span>
            <span>Spacing & Box Model</span>
          </div>
          <button
            className="vi-section-toggle-btn"
            onClick={() => toggleOptionalSection('spacing')}
            title={activeSections.spacing ? 'Remove Spacing controls' : 'Add Spacing controls'}
          >
            {activeSections.spacing ? SVG_ICONS.minus : SVG_ICONS.plus}
          </button>
        </div>

        {activeSections.spacing && !collapsedSections.spacing && (
          <div className="vi-section-content">
            <SpacingBox
              marginTop={getVal('marginTop', '0px')}
              marginRight={getVal('marginRight', '0px')}
              marginBottom={getVal('marginBottom', '0px')}
              marginLeft={getVal('marginLeft', '0px')}
              paddingTop={getVal('paddingTop', '0px')}
              paddingRight={getVal('paddingRight', '0px')}
              paddingBottom={getVal('paddingBottom', '0px')}
              paddingLeft={getVal('paddingLeft', '0px')}
              onChange={(prop, val) => {
                const jsProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                handlePropertyChange(prop, jsProp, val);
              }}
            />

            <div className="vi-grid-2" style={{ marginTop: '12px' }}>
              <ScrubbableInput
                label="Width"
                value={getVal('width', 'auto')}
                computedValue={element.computedStyles.width}
                onChange={(v) => handlePropertyChange('width', 'width', v)}
                onReset={() => handleResetProperty('width')}
                units={['px', '%', 'vw', 'auto']}
              />
              <ScrubbableInput
                label="Height"
                value={getVal('height', 'auto')}
                computedValue={element.computedStyles.height}
                onChange={(v) => handlePropertyChange('height', 'height', v)}
                onReset={() => handleResetProperty('height')}
                units={['px', '%', 'vh', 'auto']}
              />
            </div>
          </div>
        )}
      </div>

      {/* 8. Border Section */}
      <div className="vi-section">
        <div className="vi-section-header">
          <div className="vi-section-title" onClick={() => toggleSection('border')}>
            <span className="vi-section-arrow">{collapsedSections.border ? SVG_ICONS.right : SVG_ICONS.down}</span>
            <span>Border</span>
          </div>
          <button
            className="vi-section-toggle-btn"
            onClick={() => toggleOptionalSection('border')}
            title={activeSections.border ? 'Remove Border controls' : 'Add Border controls'}
          >
            {activeSections.border ? SVG_ICONS.minus : SVG_ICONS.plus}
          </button>
        </div>

        {activeSections.border && !collapsedSections.border && (
          <div className="vi-section-content">
            <div className="vi-corner-header" style={{ marginBottom: 4 }}>
              <span className="vi-field-label">Border Sides</span>
              <button
                className={`vi-link-btn ${borderLinked ? 'is-linked' : ''}`}
                onClick={() => setBorderLinked(!borderLinked)}
                title={borderLinked ? 'All sides linked' : 'Sides unlinked'}
              >
                {borderLinked ? (
                  <>
                    {SVG_ICONS.link} <span>All sides</span>
                  </>
                ) : (
                  <>
                    {SVG_ICONS.unlink} <span>Independent</span>
                  </>
                )}
              </button>
            </div>
            <div className="vi-grid-2">
              <ScrubbableInput
                label="Width"
                value={getVal('borderWidth', '0px')}
                computedValue={element.computedStyles.borderWidth}
                onChange={(v) => handlePropertyChange('border-width', 'borderWidth', v)}
                onReset={() => handleResetProperty('border-width')}
                units={['px']}
              />
              <div className="vi-field-col">
                <span className="vi-field-label">Style</span>
                <select
                  className="vi-select"
                  value={getVal('borderStyle', 'none')}
                  onChange={(e) => handlePropertyChange('border-style', 'borderStyle', e.target.value)}
                >
                  {['none', 'solid', 'dashed', 'dotted', 'double'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="vi-field-row">
              <span className="vi-field-label">Color</span>
              <div className="vi-color-picker-group">
                <input
                  type="color"
                  className="vi-color-swatch"
                  value={getVal('borderColor', '#323542').slice(0, 7)}
                  onChange={(e) => handlePropertyChange('border-color', 'borderColor', e.target.value)}
                />
                <input
                  type="text"
                  className="vi-input-mono"
                  value={getVal('borderColor', '#323542')}
                  onChange={(e) => handlePropertyChange('border-color', 'borderColor', e.target.value)}
                />
                <button
                  className="vi-eyedropper-btn"
                  onClick={() => handleEyeDropper('border-color', 'borderColor')}
                  title="Pick border color"
                >
                  {SVG_ICONS.eyedropper}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shadow & Glow Section (With Upward/Downward Drag Scrubbers) */}
      <div className="vi-section">
        <div className="vi-section-header">
          <div className="vi-section-title" onClick={() => toggleSection('boxShadow')}>
            <span className="vi-section-arrow">{collapsedSections.boxShadow ? SVG_ICONS.right : SVG_ICONS.down}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {SVG_ICONS.shadow} Shadow & Effects
            </span>
          </div>
          <button
            className="vi-section-toggle-btn"
            onClick={() => toggleOptionalSection('boxShadow')}
            title={activeSections.boxShadow ? 'Remove Shadow controls' : 'Add Shadow controls'}
          >
            {activeSections.boxShadow ? SVG_ICONS.minus : SVG_ICONS.plus}
          </button>
        </div>

        {activeSections.boxShadow && !collapsedSections.boxShadow && (
          <div className="vi-section-content">
            <div className="vi-corner-header" style={{ marginBottom: 6 }}>
              <span className="vi-field-label">Box Shadow (Drag Up/Down to scrub)</span>
              <button
                className={`vi-link-btn ${boxShadowParts.inset ? 'is-linked' : ''}`}
                onClick={() => updateBoxShadowPart('inset', !boxShadowParts.inset)}
                title={boxShadowParts.inset ? 'Inset Shadow active' : 'Drop Shadow active'}
              >
                {boxShadowParts.inset ? 'Inner Shadow' : 'Drop Shadow'}
              </button>
            </div>

            <div className="vi-grid-2">
              <ScrubbableInput
                label="Offset X"
                value={boxShadowParts.x}
                onChange={(v) => updateBoxShadowPart('x', v)}
                onReset={() => updateBoxShadowPart('x', '0px')}
                units={['px', 'rem']}
                min={-200}
                max={200}
                step={1}
                tooltip="Horizontal shadow displacement (drag up/down)"
              />
              <ScrubbableInput
                label="Offset Y"
                value={boxShadowParts.y}
                onChange={(v) => updateBoxShadowPart('y', v)}
                onReset={() => updateBoxShadowPart('y', '0px')}
                units={['px', 'rem']}
                min={-200}
                max={200}
                step={1}
                tooltip="Vertical shadow displacement (drag up/down)"
              />
            </div>

            <div className="vi-grid-2" style={{ marginTop: 6 }}>
              <ScrubbableInput
                label="Blur"
                value={boxShadowParts.blur}
                onChange={(v) => updateBoxShadowPart('blur', v)}
                onReset={() => updateBoxShadowPart('blur', '0px')}
                units={['px', 'rem']}
                min={0}
                max={200}
                step={1}
                tooltip="Shadow blur softening (drag up/down)"
              />
              <ScrubbableInput
                label="Spread"
                value={boxShadowParts.spread}
                onChange={(v) => updateBoxShadowPart('spread', v)}
                onReset={() => updateBoxShadowPart('spread', '0px')}
                units={['px', 'rem']}
                min={-100}
                max={200}
                step={1}
                tooltip="Shadow expansion/shrink (drag up/down)"
              />
            </div>

            <div className="vi-field-row" style={{ marginTop: 6 }}>
              <span className="vi-field-label">Shadow Color</span>
              <div className="vi-color-picker-group">
                <input
                  type="color"
                  className="vi-color-swatch"
                  value={boxShadowParts.color.startsWith('#') && boxShadowParts.color.length >= 7 ? boxShadowParts.color.slice(0, 7) : '#000000'}
                  onChange={(e) => updateBoxShadowPart('color', e.target.value)}
                />
                <input
                  type="text"
                  className="vi-input-mono"
                  value={boxShadowParts.color}
                  onChange={(e) => updateBoxShadowPart('color', e.target.value)}
                />
                <button
                  className="vi-eyedropper-btn"
                  onClick={() => handleEyeDropper('box-shadow', 'boxShadow')}
                  title="Pick color"
                >
                  {SVG_ICONS.eyedropper}
                </button>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--vi-border-subtle)', margin: '10px 0 6px' }} />

            <div className="vi-corner-header" style={{ marginBottom: 6 }}>
              <span className="vi-field-label">Text Shadow</span>
            </div>

            <div className="vi-grid-2">
              <ScrubbableInput
                label="Text X"
                value={textShadowParts.x}
                onChange={(v) => updateTextShadowPart('x', v)}
                onReset={() => updateTextShadowPart('x', '0px')}
                units={['px']}
                min={-100}
                max={100}
                step={1}
                tooltip="Text shadow X displacement (drag up/down)"
              />
              <ScrubbableInput
                label="Text Y"
                value={textShadowParts.y}
                onChange={(v) => updateTextShadowPart('y', v)}
                onReset={() => updateTextShadowPart('y', '0px')}
                units={['px']}
                min={-100}
                max={100}
                step={1}
                tooltip="Text shadow Y displacement (drag up/down)"
              />
            </div>

            <div className="vi-grid-2" style={{ marginTop: 6 }}>
              <ScrubbableInput
                label="Text Blur"
                value={textShadowParts.blur}
                onChange={(v) => updateTextShadowPart('blur', v)}
                onReset={() => updateTextShadowPart('blur', '0px')}
                units={['px']}
                min={0}
                max={100}
                step={1}
                tooltip="Text shadow blur (drag up/down)"
              />
              <ScrubbableInput
                label="Filter Blur"
                value={getVal('filter', 'none').includes('blur') ? getVal('filter', 'none').replace(/[^0-9.]/g, '') + 'px' : '0px'}
                onChange={(v) => handlePropertyChange('filter', 'filter', `blur(${v})`)}
                onReset={() => handlePropertyChange('filter', 'filter', 'none')}
                units={['px']}
                min={0}
                max={100}
                step={0.5}
                tooltip="Overall optical blur filter (drag up/down)"
              />
            </div>
          </div>
        )}
      </div>

      {/* 9. Layout Section */}
      <div className="vi-section">
        <div className="vi-section-header" onClick={() => toggleSection('layout')}>
          <div className="vi-section-title">
            <span className="vi-section-arrow">{collapsedSections.layout ? SVG_ICONS.right : SVG_ICONS.down}</span>
            <span>Layout</span>
          </div>
        </div>

        {!collapsedSections.layout && (
          <div className="vi-section-content">
            <div className="vi-field-row">
              <span className="vi-field-label">Display</span>
              <select
                className="vi-select"
                value={getVal('display', 'block')}
                onChange={(e) => handlePropertyChange('display', 'display', e.target.value)}
              >
                {['block', 'flex', 'inline-flex', 'grid', 'inline-block', 'inline', 'none'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {getVal('display', 'block').includes('flex') && (
              <>
                <div className="vi-grid-2">
                  <div className="vi-field-col">
                    <span className="vi-field-label">Direction</span>
                    <select
                      className="vi-select"
                      value={getVal('flexDirection', 'row')}
                      onChange={(e) => handlePropertyChange('flex-direction', 'flexDirection', e.target.value)}
                    >
                      {['row', 'column', 'row-reverse', 'column-reverse'].map((dir) => (
                        <option key={dir} value={dir}>
                          {dir}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="vi-field-col">
                    <span className="vi-field-label">Wrap</span>
                    <select
                      className="vi-select"
                      value={getVal('flexWrap', 'nowrap')}
                      onChange={(e) => handlePropertyChange('flex-wrap', 'flexWrap', e.target.value)}
                    >
                      {['nowrap', 'wrap', 'wrap-reverse'].map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="vi-grid-2">
                  <div className="vi-field-col">
                    <span className="vi-field-label">Align Items</span>
                    <select
                      className="vi-select"
                      value={getVal('alignItems', 'stretch')}
                      onChange={(e) => handlePropertyChange('align-items', 'alignItems', e.target.value)}
                    >
                      {[
                        { label: 'Stretch', val: 'stretch' },
                        { label: 'Start', val: 'flex-start' },
                        { label: 'Center', val: 'center' },
                        { label: 'End', val: 'flex-end' },
                        { label: 'Baseline', val: 'baseline' },
                      ].map((item) => (
                        <option key={item.val} value={item.val}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="vi-field-col">
                    <span className="vi-field-label">Justify Content</span>
                    <select
                      className="vi-select"
                      value={getVal('justifyContent', 'flex-start')}
                      onChange={(e) => handlePropertyChange('justify-content', 'justifyContent', e.target.value)}
                    >
                      {[
                        { label: 'Start', val: 'flex-start' },
                        { label: 'Center', val: 'center' },
                        { label: 'End', val: 'flex-end' },
                        { label: 'Between', val: 'space-between' },
                        { label: 'Around', val: 'space-around' },
                      ].map((item) => (
                        <option key={item.val} value={item.val}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="vi-corner-header" style={{ marginTop: 6 }}>
                  <span className="vi-field-label">Gaps</span>
                  <button
                    className={`vi-link-btn ${gapLinked ? 'is-linked' : ''}`}
                    onClick={() => setGapLinked(!gapLinked)}
                    title={gapLinked ? 'Gaps linked' : 'Gaps unlinked'}
                  >
                    {gapLinked ? (
                      <>
                        {SVG_ICONS.link} <span>Linked</span>
                      </>
                    ) : (
                      <>
                        {SVG_ICONS.unlink} <span>Unlinked</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="vi-grid-2">
                  <ScrubbableInput
                    label="Row Gap"
                    value={getVal('rowGap', getVal('gap', '0px'))}
                    computedValue={element.computedStyles.rowGap}
                    onChange={(v) => {
                      if (gapLinked) {
                        handlePropertyChange('gap', 'gap', v);
                      } else {
                        handlePropertyChange('row-gap', 'rowGap', v);
                      }
                    }}
                    onReset={() => handleResetProperty('row-gap')}
                    units={['px', 'rem']}
                  />
                  <ScrubbableInput
                    label="Col Gap"
                    value={getVal('columnGap', getVal('gap', '0px'))}
                    computedValue={element.computedStyles.columnGap}
                    onChange={(v) => {
                      if (gapLinked) {
                        handlePropertyChange('gap', 'gap', v);
                      } else {
                        handlePropertyChange('column-gap', 'columnGap', v);
                      }
                    }}
                    onReset={() => handleResetProperty('column-gap')}
                    units={['px', 'rem']}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 10. Export Section */}
      <div className="vi-section">
        <div className="vi-section-header" onClick={() => toggleSection('export')}>
          <div className="vi-section-title">
            <span className="vi-section-arrow">{collapsedSections.export ? SVG_ICONS.right : SVG_ICONS.down}</span>
            <span>Export</span>
          </div>
        </div>

        {!collapsedSections.export && (
          <div className="vi-section-content">
            <div className="vi-field-row">
              <span className="vi-field-label">Scale</span>
              <div className="vi-segmented-control">
                {([1, 2, 3] as const).map((sc) => (
                  <button
                    key={sc}
                    className={`vi-segmented-btn ${exportScale === sc ? 'is-active' : ''}`}
                    onClick={() => setExportScale(sc)}
                  >
                    {sc}x
                  </button>
                ))}
              </div>
            </div>

            <div className="vi-field-row">
              <label className="vi-checkbox-label">
                <input
                  type="checkbox"
                  checked={exportTransparent}
                  onChange={(e) => setExportTransparent(e.target.checked)}
                />
                <span>Transparent Background</span>
              </label>
            </div>

            <div className="vi-export-buttons-row">
              <button
                className="vi-btn-accent"
                onClick={handleExportElement}
                disabled={isExportingElement}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{isExportingElement ? 'Exporting Element...' : 'Export Element as PNG'}</span>
              </button>
              <button
                className="vi-btn-secondary"
                onClick={handleExportViewport}
                disabled={isExportingViewport}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>{isExportingViewport ? 'Capturing Viewport...' : 'Export Viewport as PNG'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Presets Modal */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        currentModifications={modifiedProps}
        onApplyPreset={(styles) => {
          Object.entries(styles).forEach(([k, v]) => {
            const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
            handlePropertyChange(cssKey, k, v);
          });
        }}
        onPreviewPreset={(styles) => {
          Object.entries(styles).forEach(([k, v]) => {
            const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
            handlePropertyChange(cssKey, k, v);
          });
        }}
        onRevertPreview={() => {
          // Revert to current modified styles
        }}
      />
    </div>
  );
};

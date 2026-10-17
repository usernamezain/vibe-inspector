import React, { useState, useEffect, FC } from 'react';
import { ElementInfo } from '@vibe-inspector/shared';
import { ScrubbableInput } from './ScrubbableInput';
import { SpacingBox } from './SpacingBox';
import { PresetsModal } from './PresetsModal';

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

const COMMON_FONTS = [
  'Inter',
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  'system-ui',
  'ui-sans-serif',
  'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
  'Georgia, serif',
  '"Times New Roman", Times, serif',
  'Arial, Helvetica, sans-serif',
];

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
    boxShadow: false,
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
          setActiveSections((prev) => ({ ...prev, ...res.vibe_sections.active }));
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

  // Helper to read effective property value (check modified first, then computed)
  const getVal = (prop: string, fallback = '') => {
    return modifiedProps[prop] ?? element.computedStyles[prop] ?? fallback;
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
            if (res?.dataUrl) {
              const a = document.createElement('a');
              a.href = res.dataUrl;
              a.download = `element-${element.tag}-${Date.now()}.png`;
              a.click();
            }
          }
        );
      }
    });
  };

  // Export viewport snapshot
  const handleExportViewport = () => {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `viewport-${Date.now()}.png`;
        a.click();
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
            <span className="vi-chip-copy-icon">{copiedSelector ? '✓' : '⧉'}</span>
          </div>

          <div className="vi-nav-group">
            <button
              className="vi-nav-btn"
              onClick={() => handleRelativeSelect('parent')}
              title="Select Parent Element (▲)"
            >
              ▲
            </button>
            <button
              className="vi-nav-btn"
              onClick={() => handleRelativeSelect('child')}
              title="Select First Child (▼)"
            >
              ▼
            </button>
            <button
              className="vi-nav-btn"
              onClick={() => handleRelativeSelect('prev')}
              title="Select Previous Sibling (◀)"
            >
              ◀
            </button>
            <button
              className="vi-nav-btn"
              onClick={() => handleRelativeSelect('next')}
              title="Select Next Sibling (▶)"
            >
              ▶
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
            📍 Highlight
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
            ⚡ Browse Presets...
          </button>
          <button
            className="vi-btn-icon-save"
            onClick={() => setIsPresetsOpen(true)}
            title="Save current modifications as preset"
            disabled={!hasModifications}
          >
            💾
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
            ↩ Undo
          </button>
          <button
            className="vi-btn-history"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo edit (Shift+Ctrl+Z)"
          >
            ↪ Redo
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
            <span className="vi-section-arrow">{collapsedSections.appearance ? '▶' : '▼'}</span>
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
                  {radiusLinked ? '🔗 Linked' : '🔓 Unlinked'}
                </button>
              </div>

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
            <span className="vi-section-arrow">{collapsedSections.typography ? '▶' : '▼'}</span>
            <span>Typography</span>
          </div>
        </div>

        {!collapsedSections.typography && (
          <div className="vi-section-content">
            {/* Typeface Autocomplete */}
            <div className="vi-field-row">
              <span className="vi-field-label">Font Family</span>
              <input
                type="text"
                className="vi-input"
                list="vi-font-list"
                value={getVal('fontFamily', '')}
                placeholder="Font family..."
                onChange={(e) => handlePropertyChange('font-family', 'fontFamily', e.target.value)}
              />
              <datalist id="vi-font-list">
                {COMMON_FONTS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
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
                {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                  <button
                    key={align}
                    className={`vi-segmented-btn ${getVal('textAlign') === align ? 'is-active' : ''}`}
                    onClick={() => handlePropertyChange('text-align', 'textAlign', align)}
                    title={`Align ${align}`}
                  >
                    {align === 'left' && '⫷'}
                    {align === 'center' && '≡'}
                    {align === 'right' && '⫸'}
                    {align === 'justify' && '≣'}
                  </button>
                ))}
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
                  💧
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
            <span className="vi-section-arrow">{collapsedSections.image ? '▶' : '▼'}</span>
            <span>Image</span>
          </div>
          <button
            className="vi-section-toggle-btn"
            onClick={() => toggleOptionalSection('image')}
            title={activeSections.image ? 'Remove Image controls' : 'Add Image controls'}
          >
            {activeSections.image ? '−' : '+'}
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
              <label className="vi-btn-ghost-sm" style={{ cursor: 'pointer' }}>
                📁 Choose File...
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
            <span className="vi-section-arrow">{collapsedSections.background ? '▶' : '▼'}</span>
            <span>Background</span>
          </div>
          <button
            className="vi-section-toggle-btn"
            onClick={() => toggleOptionalSection('background')}
            title={activeSections.background ? 'Remove Background controls' : 'Add Background controls'}
          >
            {activeSections.background ? '−' : '+'}
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
                  💧
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
            <span className="vi-section-arrow">{collapsedSections.spacing ? '▶' : '▼'}</span>
            <span>Spacing & Box Model</span>
          </div>
          <button
            className="vi-section-toggle-btn"
            onClick={() => toggleOptionalSection('spacing')}
            title={activeSections.spacing ? 'Remove Spacing controls' : 'Add Spacing controls'}
          >
            {activeSections.spacing ? '−' : '+'}
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
            <span className="vi-section-arrow">{collapsedSections.border ? '▶' : '▼'}</span>
            <span>Border</span>
          </div>
          <button
            className="vi-section-toggle-btn"
            onClick={() => toggleOptionalSection('border')}
            title={activeSections.border ? 'Remove Border controls' : 'Add Border controls'}
          >
            {activeSections.border ? '−' : '+'}
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
                {borderLinked ? '🔗 All sides' : '🔓 Independent'}
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
                >
                  💧
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9. Layout Section */}
      <div className="vi-section">
        <div className="vi-section-header" onClick={() => toggleSection('layout')}>
          <div className="vi-section-title">
            <span className="vi-section-arrow">{collapsedSections.layout ? '▶' : '▼'}</span>
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
                    {gapLinked ? '🔗 Linked' : '🔓 Unlinked'}
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
            <span className="vi-section-arrow">{collapsedSections.export ? '▶' : '▼'}</span>
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
              <button className="vi-btn-accent" onClick={handleExportElement}>
                Export Element as PNG
              </button>
              <button className="vi-btn-secondary" onClick={handleExportViewport}>
                Export Viewport as PNG
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

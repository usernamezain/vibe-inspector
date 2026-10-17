import type { FC } from 'react';
import { ElementInfo } from '@vibe-inspector/shared';
import { SpacingBox } from './SpacingBox';

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
  // Helper to read current effective value: check modifiedProps first, then computedStyles
  const getVal = (prop: string, fallback = '') => {
    return modifiedProps[prop] ?? element.computedStyles[prop] ?? fallback;
  };

  // Convert rgba(r, g, b, a) or rgb(r, g, b) to hex for HTML5 color input
  const toHex = (colorStr: string) => {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') {
      return '#000000';
    }
    if (colorStr.startsWith('#')) return colorStr.slice(0, 7);
    const match = colorStr.match(/\d+/g);
    if (!match || match.length < 3) return '#000000';
    const [r, g, b] = match.map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const parseNumber = (val: string, fallback = 0) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const handlePropertyChange = (cssProp: string, camelProp: string, val: string) => {
    const oldVal = element.computedStyles[camelProp] || '';
    onApplyStyle(cssProp, val, oldVal);
  };

  const hasModifications = Object.keys(modifiedProps).length > 0;

  return (
    <div className="tab-pane-content">
      {/* Element Header Card */}
      <div className="element-hero-card">
        <div className="element-top-meta">
          <span className="term-badge">{element.uiTerm}</span>
          <span className="dim-badge">
            {Math.round(element.boundingRect.width)} × {Math.round(element.boundingRect.height)} px
          </span>
        </div>
        <div className="element-primary-name">{element.elementName.primary}</div>
        <div className="element-tag-sub">
          &lt;{element.tag}&gt;
          {element.id ? ` #${element.id}` : ''}
          {element.classList.length > 0 ? ` .${element.classList.slice(0, 2).join('.')}` : ''}
        </div>
        <div className="element-actions-row">
          <button className="btn-action-small" onClick={onHighlight}>
            <span>📍</span>
            <span>Highlight in Page</span>
          </button>
        </div>
      </div>

      {/* History Controls Bar */}
      <div className="history-bar">
        <div className="history-buttons">
          <button
            className="btn-history"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <span>↩</span>
            <span>Undo</span>
          </button>
          <button
            className="btn-history"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <span>↪</span>
            <span>Redo</span>
          </button>
        </div>
        {hasModifications && (
          <button className="btn-reset-element" onClick={onResetElement}>
            <span>↺</span>
            <span>Reset Styles</span>
          </button>
        )}
      </div>

      {/* 1. Appearance Section */}
      <div className="property-group-card">
        <div className="group-title">Appearance</div>
        <div className="prop-row">
          <label className="prop-label">Opacity</label>
          <div className="prop-input-wrap">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={parseNumber(getVal('opacity', '1'), 1)}
              onChange={(e) => handlePropertyChange('opacity', 'opacity', e.target.value)}
              className="slider-input"
            />
            <span className="slider-val">
              {Math.round(parseNumber(getVal('opacity', '1'), 1) * 100)}%
            </span>
          </div>
        </div>

        <div className="prop-row">
          <label className="prop-label">Border Radius</label>
          <div className="prop-input-wrap">
            <input
              type="range"
              min="0"
              max="48"
              step="1"
              value={parseNumber(getVal('borderRadius', '0px'), 0)}
              onChange={(e) => handlePropertyChange('border-radius', 'borderRadius', `${e.target.value}px`)}
              className="slider-input"
            />
            <span className="slider-val">{parseNumber(getVal('borderRadius', '0px'), 0)}px</span>
          </div>
        </div>
      </div>

      {/* 2. Typography Section */}
      <div className="property-group-card">
        <div className="group-title">Typography</div>
        <div className="prop-row">
          <label className="prop-label">Font Size</label>
          <div className="prop-input-wrap">
            <input
              type="range"
              min="10"
              max="64"
              step="1"
              value={parseNumber(getVal('fontSize', '14px'), 14)}
              onChange={(e) => handlePropertyChange('font-size', 'fontSize', `${e.target.value}px`)}
              className="slider-input"
            />
            <span className="slider-val">{parseNumber(getVal('fontSize', '14px'), 14)}px</span>
          </div>
        </div>

        <div className="prop-row">
          <label className="prop-label">Font Weight</label>
          <select
            className="select-input"
            value={getVal('fontWeight', '400')}
            onChange={(e) => handlePropertyChange('font-weight', 'fontWeight', e.target.value)}
          >
            <option value="300">300 (Light)</option>
            <option value="400">400 (Regular)</option>
            <option value="500">500 (Medium)</option>
            <option value="600">600 (SemiBold)</option>
            <option value="700">700 (Bold)</option>
            <option value="800">800 (ExtraBold)</option>
          </select>
        </div>

        <div className="prop-row">
          <label className="prop-label">Text Color</label>
          <div className="color-picker-wrap">
            <input
              type="color"
              className="color-input-swatch"
              value={toHex(getVal('color', '#ffffff'))}
              onChange={(e) => handlePropertyChange('color', 'color', e.target.value)}
            />
            <input
              type="text"
              className="color-hex-text"
              value={getVal('color', '#ffffff')}
              onChange={(e) => handlePropertyChange('color', 'color', e.target.value)}
            />
          </div>
        </div>

        <div className="prop-row">
          <label className="prop-label">Text Align</label>
          <div className="segmented-control">
            {['left', 'center', 'right', 'justify'].map((align) => (
              <button
                key={align}
                className={`segment-btn ${getVal('textAlign', 'left') === align ? 'active' : ''}`}
                onClick={() => handlePropertyChange('text-align', 'textAlign', align)}
              >
                {align.charAt(0).toUpperCase() + align.slice(1, 4)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Background Section */}
      <div className="property-group-card">
        <div className="group-title">Background</div>
        <div className="prop-row">
          <label className="prop-label">Color</label>
          <div className="color-picker-wrap">
            <input
              type="color"
              className="color-input-swatch"
              value={toHex(getVal('backgroundColor', '#ffffff'))}
              onChange={(e) => handlePropertyChange('background-color', 'backgroundColor', e.target.value)}
            />
            <input
              type="text"
              className="color-hex-text"
              value={getVal('backgroundColor', 'transparent')}
              onChange={(e) => handlePropertyChange('background-color', 'backgroundColor', e.target.value)}
            />
          </div>
        </div>
        <div className="prop-row" style={{ marginTop: '8px' }}>
          <button
            className="btn-action-small"
            onClick={() => handlePropertyChange('background-color', 'backgroundColor', 'transparent')}
          >
            Set Transparent
          </button>
        </div>
      </div>

      {/* 4. Spacing Box Model Section */}
      <div className="property-group-card">
        <div className="group-title">Spacing (Box Model)</div>
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
            const camel = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            handlePropertyChange(prop, camel, val);
          }}
        />
      </div>

      {/* 5. Border Section */}
      <div className="property-group-card">
        <div className="group-title">Border</div>
        <div className="prop-row">
          <label className="prop-label">Width</label>
          <div className="prop-input-wrap">
            <input
              type="range"
              min="0"
              max="16"
              step="1"
              value={parseNumber(getVal('borderWidth', '0px'), 0)}
              onChange={(e) => handlePropertyChange('border-width', 'borderWidth', `${e.target.value}px`)}
              className="slider-input"
            />
            <span className="slider-val">{parseNumber(getVal('borderWidth', '0px'), 0)}px</span>
          </div>
        </div>

        <div className="prop-row">
          <label className="prop-label">Style</label>
          <select
            className="select-input"
            value={getVal('borderStyle', 'none')}
            onChange={(e) => handlePropertyChange('border-style', 'borderStyle', e.target.value)}
          >
            <option value="none">none</option>
            <option value="solid">solid</option>
            <option value="dashed">dashed</option>
            <option value="dotted">dotted</option>
            <option value="double">double</option>
          </select>
        </div>

        <div className="prop-row">
          <label className="prop-label">Color</label>
          <div className="color-picker-wrap">
            <input
              type="color"
              className="color-input-swatch"
              value={toHex(getVal('borderColor', '#ffffff'))}
              onChange={(e) => handlePropertyChange('border-color', 'borderColor', e.target.value)}
            />
            <input
              type="text"
              className="color-hex-text"
              value={getVal('borderColor', '#334155')}
              onChange={(e) => handlePropertyChange('border-color', 'borderColor', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 6. Layout Section */}
      <div className="property-group-card">
        <div className="group-title">Layout</div>
        <div className="prop-row">
          <label className="prop-label">Display</label>
          <div className="segmented-control">
            {['block', 'flex', 'grid', 'inline-block'].map((d) => (
              <button
                key={d}
                className={`segment-btn ${getVal('display', 'block') === d ? 'active' : ''}`}
                onClick={() => handlePropertyChange('display', 'display', d)}
              >
                {d === 'inline-block' ? 'inline-b' : d}
              </button>
            ))}
          </div>
        </div>

        {getVal('display', 'block') === 'flex' && (
          <>
            <div className="prop-row">
              <label className="prop-label">Direction</label>
              <div className="segmented-control">
                {['row', 'column'].map((dir) => (
                  <button
                    key={dir}
                    className={`segment-btn ${getVal('flexDirection', 'row') === dir ? 'active' : ''}`}
                    onClick={() => handlePropertyChange('flex-direction', 'flexDirection', dir)}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            <div className="prop-row">
              <label className="prop-label">Align Items</label>
              <select
                className="select-input"
                value={getVal('alignItems', 'stretch')}
                onChange={(e) => handlePropertyChange('align-items', 'alignItems', e.target.value)}
              >
                <option value="stretch">stretch</option>
                <option value="flex-start">start</option>
                <option value="center">center</option>
                <option value="flex-end">end</option>
                <option value="baseline">baseline</option>
              </select>
            </div>

            <div className="prop-row">
              <label className="prop-label">Justify Content</label>
              <select
                className="select-input"
                value={getVal('justifyContent', 'flex-start')}
                onChange={(e) => handlePropertyChange('justify-content', 'justifyContent', e.target.value)}
              >
                <option value="flex-start">start</option>
                <option value="center">center</option>
                <option value="flex-end">end</option>
                <option value="space-between">space-between</option>
                <option value="space-around">space-around</option>
                <option value="space-evenly">space-evenly</option>
              </select>
            </div>

            <div className="prop-row">
              <label className="prop-label">Gap</label>
              <div className="prop-input-wrap">
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="2"
                  value={parseNumber(getVal('gap', '0px'), 0)}
                  onChange={(e) => handlePropertyChange('gap', 'gap', `${e.target.value}px`)}
                  className="slider-input"
                />
                <span className="slider-val">{parseNumber(getVal('gap', '0px'), 0)}px</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

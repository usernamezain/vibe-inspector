import { useState, useEffect, type FC, type FormEvent } from 'react';
import { ElementInfo, StylePreset } from '@vibe-inspector/shared';

interface CSSTabProps {
  element: ElementInfo | null;
  modifiedStyles: Record<string, Record<string, string>>;
  onApplyStyle: (property: string, value: string, oldValue?: string) => void;
}

export const CSSTab: FC<CSSTabProps> = ({
  element,
  modifiedStyles,
  onApplyStyle,
}) => {
  const [copiedCSS, setCopiedCSS] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Load presets from chrome.storage.local
  useEffect(() => {
    try {
      chrome.storage.local.get(['vibe_presets'], (res) => {
        if (res?.vibe_presets && Array.isArray(res.vibe_presets)) {
          setPresets(res.vibe_presets);
        }
      });
    } catch {}
  }, []);

  const savePresetsToStorage = (updated: StylePreset[]) => {
    setPresets(updated);
    try {
      chrome.storage.local.set({ vibe_presets: updated });
    } catch {}
  };

  // Generate CSS text for the selected element or all modified elements
  const generateCSSText = () => {
    const entries = Object.entries(modifiedStyles);
    if (entries.length === 0) {
      if (element) {
        return `/* No modifications yet for ${element.selector} */\n/* Tweak properties in the Edit tab to see live CSS diffs */`;
      }
      return '/* No visual style changes made yet */';
    }

    return entries
      .map(([sel, props]) => {
        const propLines = Object.entries(props)
          .map(([k, v]) => `  ${k}: ${v};`)
          .join('\n');
        return `${sel} {\n${propLines}\n}`;
      })
      .join('\n\n');
  };

  // Generate Agent-ready prompt markdown
  const generateAgentPrompt = () => {
    const cssContent = generateCSSText();
    const sourceInfo = element?.sourceLocation
      ? `Source File: \`${element.sourceLocation.file}:${element.sourceLocation.line}\``
      : 'Source File: Unmapped (Please locate the relevant component in the codebase)';

    const elementName = element ? `Element: ${element.elementName.primary} (<${element.tag}>)` : '';
    const selector = element ? `Selector: \`${element.selector}\`` : '';

    return `Please update the styling for the inspected component with the following visual changes:

${elementName}
${selector}
${sourceInfo}

\`\`\`css
${cssContent}
\`\`\`

Ensure changes match the project's styling system (Tailwind classes or CSS/SCSS modules as appropriate).`;
  };

  const handleCopyCSS = () => {
    navigator.clipboard.writeText(generateCSSText());
    setCopiedCSS(true);
    setTimeout(() => setCopiedCSS(false), 1500);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generateAgentPrompt());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1500);
  };

  const handleSavePreset = (e: FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || !element) return;
    const currentProps = modifiedStyles[element.selector] || {};
    if (Object.keys(currentProps).length === 0) return;

    const newPreset: StylePreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      styles: { ...currentProps },
      createdAt: new Date().toISOString(),
    };

    savePresetsToStorage([...presets, newPreset]);
    setNewPresetName('');
    setShowSavePreset(false);
  };

  const handleApplyPreset = (preset: StylePreset) => {
    if (!element) return;
    Object.entries(preset.styles).forEach(([prop, val]) => {
      onApplyStyle(prop, val);
    });
  };

  const handleDeletePreset = (presetId: string) => {
    savePresetsToStorage(presets.filter((p) => p.id !== presetId));
  };

  const hasModifications = Object.keys(modifiedStyles).length > 0;

  return (
    <div className="tab-pane-content">
      {/* Generated CSS Block */}
      <div className="property-group-card">
        <div className="section-header-flex">
          <div className="group-title">Generated CSS Changes</div>
          <button
            className={`btn-copy-code ${copiedCSS ? 'copied' : ''}`}
            onClick={handleCopyCSS}
          >
            {copiedCSS ? 'Copied!' : 'Copy CSS'}
          </button>
        </div>
        <div className="css-code-viewer">
          <pre>
            <code>{generateCSSText()}</code>
          </pre>
        </div>
      </div>

      {/* Copy for AI Agent */}
      <div className="property-group-card">
        <div className="group-title">AI Agent Handoff</div>
        <p className="section-desc">
          Copy structured CSS changes and source references formatted as an actionable prompt for Antigravity, Claude Code, Cursor, or Codex.
        </p>
        <button className="btn-action-primary" onClick={handleCopyPrompt}>
          <span>🤖</span>
          <span>{copiedPrompt ? 'Copied Prompt to Clipboard!' : 'Copy Changes as Agent Prompt'}</span>
        </button>
      </div>

      {/* Style Presets */}
      <div className="property-group-card">
        <div className="section-header-flex">
          <div className="group-title">Style Presets ({presets.length})</div>
          {hasModifications && element && (
            <button
              className="btn-action-small"
              onClick={() => setShowSavePreset((prev) => !prev)}
            >
              + Save Preset
            </button>
          )}
        </div>

        {showSavePreset && (
          <form className="preset-save-form" onSubmit={handleSavePreset}>
            <input
              type="text"
              placeholder="Preset Name (e.g. Glowing Button)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="text-input"
              autoFocus
            />
            <div className="preset-form-actions">
              <button type="submit" className="btn-action-primary">
                Save
              </button>
              <button
                type="button"
                className="btn-clear"
                onClick={() => setShowSavePreset(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {presets.length === 0 ? (
          <div className="empty-subtext">
            No saved presets yet. Tweak styles and click "+ Save Preset" to save recurring design tokens.
          </div>
        ) : (
          <div className="presets-list">
            {presets.map((preset) => (
              <div key={preset.id} className="preset-item">
                <div className="preset-info">
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-count">
                    {Object.keys(preset.styles).length} styles
                  </span>
                </div>
                <div className="preset-actions">
                  <button
                    className="btn-action-small"
                    onClick={() => handleApplyPreset(preset)}
                    disabled={!element}
                    title={element ? 'Apply preset to selected element' : 'Select an element first'}
                  >
                    Apply
                  </button>
                  <button
                    className="btn-item-reset"
                    onClick={() => handleDeletePreset(preset.id)}
                    title="Delete preset"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

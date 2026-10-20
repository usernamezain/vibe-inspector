import React, { useState, useEffect, FC } from 'react';

export interface PresetItem {
  id: string;
  name: string;
  isBuiltIn: boolean;
  styles: Record<string, string>;
}

const BUILT_IN_PRESETS: PresetItem[] = [
  {
    id: 'minimal-button',
    name: 'Minimal Button',
    isBuiltIn: true,
    styles: {
      borderRadius: '4px',
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '8px 16px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #000000',
    },
  },
  {
    id: 'minimal-card',
    name: 'Minimal Card',
    isBuiltIn: true,
    styles: {
      borderRadius: '5px',
      backgroundColor: '#ffffff',
      padding: '16px',
      border: '1px solid #e4e4e7',
      color: '#09090b',
    },
  },
  {
    id: 'clean-border',
    name: 'Clean Border',
    isBuiltIn: true,
    styles: {
      border: '1px solid #000000',
      borderRadius: '4px',
    },
  },
  {
    id: 'inverted-badge',
    name: 'Inverted Badge',
    isBuiltIn: true,
    styles: {
      backgroundColor: '#000000',
      color: '#ffffff',
      borderRadius: '4px',
      padding: '2px 8px',
      fontWeight: '600',
      fontSize: '11px',
    },
  },
  {
    id: 'subtle-surface',
    name: 'Subtle Surface',
    isBuiltIn: true,
    styles: {
      backgroundColor: '#f4f4f5',
      border: '1px solid #e4e4e7',
      borderRadius: '4px',
      padding: '12px',
    },
  },
];

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (styles: Record<string, string>) => void;
  onPreviewPreset: (styles: Record<string, string>) => void;
  onRevertPreview: () => void;
  currentModifications: Record<string, string>;
}

export const PresetsModal: FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
  onPreviewPreset,
  onRevertPreview,
  currentModifications,
}) => {
  const [userPresets, setUserPresets] = useState<PresetItem[]>([]);
  const [newPresetName, setNewPresetName] = useState('');

  // Load user presets from chrome.storage.local
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['vibe_user_presets'], (res) => {
        if (res?.vibe_user_presets && Array.isArray(res.vibe_user_presets)) {
          setUserPresets(res.vibe_user_presets);
        }
      });
    }
  }, [isOpen]);

  const saveUserPresets = (presets: PresetItem[]) => {
    setUserPresets(presets);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ vibe_user_presets: presets });
    }
  };

  const handleSaveCurrent = () => {
    if (!newPresetName.trim() || Object.keys(currentModifications).length === 0) return;
    const newPreset: PresetItem = {
      id: `user-${Date.now()}`,
      name: newPresetName.trim(),
      isBuiltIn: false,
      styles: { ...currentModifications },
    };
    const updated = [...userPresets, newPreset];
    saveUserPresets(updated);
    setNewPresetName('');
  };

  const handleDeleteUserPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = userPresets.filter((p) => p.id !== id);
    saveUserPresets(updated);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userPresets, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'vibe-presets.json');
    dlAnchor.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string);
        if (Array.isArray(imported)) {
          const merged = [...userPresets, ...imported.filter((item) => item.name && item.styles)];
          saveUserPresets(merged);
        }
      } catch (err) {
        alert('Invalid preset JSON file format');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="vi-modal-overlay" onClick={onClose}>
      <div className="vi-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="vi-modal-header">
          <div className="vi-modal-title">
            <span className="vi-modal-icon">⚡</span>
            <span>Style Presets</span>
          </div>
          <button className="vi-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="vi-modal-body">
          {/* Quick Save Current Edits Bar */}
          {Object.keys(currentModifications).length > 0 && (
            <div className="vi-save-preset-card">
              <div className="vi-save-preset-row">
                <input
                  type="text"
                  className="vi-preset-input"
                  placeholder="Name this style preset..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
                <button
                  className="vi-btn-accent"
                  onClick={handleSaveCurrent}
                  disabled={!newPresetName.trim()}
                >
                  Save Preset
                </button>
              </div>
            </div>
          )}

          {/* Built-in Presets */}
          <div className="vi-presets-group">
            <div className="vi-presets-group-label">Built-in Presets (Hover to preview)</div>
            <div className="vi-presets-grid">
              {BUILT_IN_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="vi-preset-card"
                  onMouseEnter={() => onPreviewPreset(preset.styles)}
                  onMouseLeave={onRevertPreview}
                  onClick={() => {
                    onApplyPreset(preset.styles);
                    onClose();
                  }}
                >
                  <div className="vi-preset-name">{preset.name}</div>
                  <div className="vi-preset-props-count">
                    {Object.keys(preset.styles).length} properties
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Presets */}
          <div className="vi-presets-group">
            <div className="vi-presets-group-label">
              <span>Your Presets ({userPresets.length})</span>
              <div className="vi-preset-actions">
                <button className="vi-btn-ghost-sm" onClick={handleExportJSON} title="Export JSON">
                  ⇥ Export
                </button>
                <label className="vi-btn-ghost-sm" style={{ cursor: 'pointer' }} title="Import JSON">
                  ⇤ Import
                  <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {userPresets.length === 0 ? (
              <div className="vi-empty-presets">No user presets saved yet.</div>
            ) : (
              <div className="vi-presets-grid">
                {userPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="vi-preset-card"
                    onMouseEnter={() => onPreviewPreset(preset.styles)}
                    onMouseLeave={onRevertPreview}
                    onClick={() => {
                      onApplyPreset(preset.styles);
                      onClose();
                    }}
                  >
                    <div className="vi-preset-row-top">
                      <div className="vi-preset-name">{preset.name}</div>
                      <button
                        className="vi-preset-del"
                        onClick={(e) => handleDeleteUserPreset(preset.id, e)}
                        title="Delete preset"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="vi-preset-props-count">
                      {Object.keys(preset.styles).length} properties
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

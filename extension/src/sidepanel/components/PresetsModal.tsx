import React, { useState, useEffect, FC } from 'react';

export interface PresetItem {
  id: string;
  name: string;
  isBuiltIn: boolean;
  styles: Record<string, string>;
}

const BUILT_IN_PRESETS: PresetItem[] = [
  {
    id: 'glass-surface',
    name: 'Glass Surface',
    isBuiltIn: true,
    styles: {
      backdropFilter: 'blur(16px)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
    },
  },
  {
    id: 'pill-button',
    name: 'Pill Button',
    isBuiltIn: true,
    styles: {
      borderRadius: '9999px',
      padding: '10px 24px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  {
    id: 'soft-card',
    name: 'Soft Card',
    isBuiltIn: true,
    styles: {
      borderRadius: '12px',
      backgroundColor: '#1a1b20',
      padding: '20px',
      border: '1px solid #2d3039',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
    },
  },
  {
    id: 'soft-shadow',
    name: 'Elevated Float',
    isBuiltIn: true,
    styles: {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      transition: 'transform 180ms ease, box-shadow 180ms ease',
    },
  },
  {
    id: 'muted-border',
    name: 'Clean Border',
    isBuiltIn: true,
    styles: {
      border: '1px solid #323542',
      borderRadius: '8px',
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

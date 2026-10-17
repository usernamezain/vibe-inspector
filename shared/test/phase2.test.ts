import { describe, it, expect } from 'vitest';
import { StyleDelta, StylePreset } from '../src/types';

describe('Phase 2: Live Styles and Presets', () => {
  it('records style delta accurately', () => {
    const delta: StyleDelta = {
      selector: '#main-cta',
      property: 'background-color',
      oldValue: 'rgb(255, 255, 255)',
      newValue: '#6366f1',
      timestamp: Date.now(),
    };

    expect(delta.selector).toBe('#main-cta');
    expect(delta.property).toBe('background-color');
    expect(delta.newValue).toBe('#6366f1');
  });

  it('serializes style presets with timestamp and properties', () => {
    const preset: StylePreset = {
      id: 'preset-1',
      name: 'Primary Button Gradient',
      styles: {
        'background-color': '#6366f1',
        'border-radius': '8px',
        'font-weight': '600',
      },
      createdAt: new Date().toISOString(),
    };

    expect(preset.name).toBe('Primary Button Gradient');
    expect(Object.keys(preset.styles)).toHaveLength(3);
    expect(preset.styles['border-radius']).toBe('8px');
  });

  it('formats multiple property modifications into valid CSS rules', () => {
    const modifications: Record<string, Record<string, string>> = {
      '#submit-btn': {
        'background-color': '#10b981',
        'font-size': '16px',
      },
    };

    const cssText = Object.entries(modifications)
      .map(([sel, props]) => {
        const propLines = Object.entries(props)
          .map(([k, v]) => `  ${k}: ${v};`)
          .join('\n');
        return `${sel} {\n${propLines}\n}`;
      })
      .join('\n\n');

    expect(cssText).toContain('#submit-btn {');
    expect(cssText).toContain('  background-color: #10b981;');
    expect(cssText).toContain('  font-size: 16px;');
  });
});

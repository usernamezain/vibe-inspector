import { describe, it, expect } from 'vitest';
import {
  parseColor,
  getLuminance,
  calculateContrastRatio,
  autoFixColor,
} from '../../extension/src/sidepanel/utils/contrast.js';
import {
  serializeShadowLayers,
  GRADIENT_PRESETS,
  MICRO_INTERACTIONS,
  MULTI_SHADOW_PRESETS,
} from '../../extension/src/sidepanel/constants/microInteractions.js';

describe('Contrast and WCAG Utilities', () => {
  it('parses various color formats accurately', () => {
    expect(parseColor('#000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(parseColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('rgb(255, 0, 128)')).toEqual({ r: 255, g: 0, b: 128, a: 1 });
    expect(parseColor('rgba(10, 20, 30, 0.5)')).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
  });

  it('calculates correct WCAG relative luminance', () => {
    expect(getLuminance({ r: 0, g: 0, b: 0, a: 1 })).toBe(0);
    expect(getLuminance({ r: 255, g: 255, b: 255, a: 1 })).toBe(1);
  });

  it('computes contrast ratio correctly (black on white = 21:1)', () => {
    const result = calculateContrastRatio('#000000', '#ffffff');
    expect(result.ratio).toBe(21);
    expect(result.aaNormal).toBe(true);
    expect(result.aaaNormal).toBe(true);
    expect(result.badgeLevel).toBe('pass');
  });

  it('detects low contrast failing WCAG AA', () => {
    // Light gray text on white background
    const result = calculateContrastRatio('#cccccc', '#ffffff');
    expect(result.aaNormal).toBe(false);
    expect(result.badgeLevel).toBe('fail');
  });

  it('auto-fixes low contrast text to pass WCAG AA (>= 4.5:1)', () => {
    const lowContrastFg = '#cccccc';
    const bg = '#ffffff';
    const initial = calculateContrastRatio(lowContrastFg, bg);
    expect(initial.aaNormal).toBe(false);

    const fixed = autoFixColor(lowContrastFg, bg, 4.5);
    const resolved = calculateContrastRatio(fixed, bg);
    expect(resolved.ratio).toBeGreaterThanOrEqual(4.5);
    expect(resolved.aaNormal).toBe(true);
  });

  it('auto-fixes dark background low contrast by lightening', () => {
    const darkBg = '#0f172a';
    const lowContrastFg = '#1e293b';
    const fixed = autoFixColor(lowContrastFg, darkBg, 4.5);
    const resolved = calculateContrastRatio(fixed, darkBg);
    expect(resolved.ratio).toBeGreaterThanOrEqual(4.5);
    expect(resolved.aaNormal).toBe(true);
  });
});

describe('Micro-Interactions, Shadows, and Gradients Constants', () => {
  it('serializes single and multi-layer shadows', () => {
    expect(serializeShadowLayers([])).toBe('none');

    const single = [{ x: 0, y: 4, blur: 6, spread: 0, color: 'rgba(0, 0, 0, 0.1)', inset: false }];
    expect(serializeShadowLayers(single)).toBe('0px 4px 6px 0px rgba(0, 0, 0, 0.1)');

    const multi = [
      { x: 0, y: 1, blur: 2, spread: 0, color: '#fff', inset: true },
      { x: 0, y: 8, blur: 16, spread: 0, color: '#000', inset: false },
    ];
    expect(serializeShadowLayers(multi)).toBe('inset 0px 1px 2px 0px #fff, 0px 8px 16px 0px #000');
  });

  it('has all required gradient presets with valid CSS', () => {
    expect(GRADIENT_PRESETS.length).toBeGreaterThanOrEqual(6);
    GRADIENT_PRESETS.forEach((preset) => {
      expect(preset.css).toMatch(/(linear|radial)-gradient/);
      expect(preset.stops.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('has all required micro-interaction presets with keyframe animations', () => {
    expect(MICRO_INTERACTIONS.length).toBeGreaterThanOrEqual(5);
    MICRO_INTERACTIONS.forEach((interaction) => {
      expect(interaction.cssAnimation).toBeTruthy();
      expect(interaction.keyframes).toContain('@keyframes');
    });
  });

  it('has curated multi-shadow presets', () => {
    expect(MULTI_SHADOW_PRESETS.length).toBeGreaterThanOrEqual(4);
    MULTI_SHADOW_PRESETS.forEach((preset) => {
      expect(preset.layers.length).toBeGreaterThanOrEqual(1);
    });
  });
});

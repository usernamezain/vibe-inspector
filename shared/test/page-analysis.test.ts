import { describe, it, expect } from 'vitest';
import {
  cleanFontFamily,
  rgbToHex,
  analyzePageDesign,
} from '../src/page-analysis';
import {
  kebabToCamelCase,
  cssPropertiesToReactStyle,
} from '../src/units';

describe('Page-Level Analysis & Style Conversion', () => {
  describe('cleanFontFamily', () => {
    it('normalizes font family names removing quotes and fallbacks', () => {
      expect(cleanFontFamily('"Inter", sans-serif')).toBe('Inter');
      expect(cleanFontFamily("'Roboto Mono', monospace")).toBe('Roboto Mono');
      expect(cleanFontFamily('')).toBe('system-ui');
    });
  });

  describe('rgbToHex', () => {
    it('converts rgb to 6-digit hex format', () => {
      expect(rgbToHex('rgb(255, 0, 0)')).toBe('#ff0000');
      expect(rgbToHex('rgb(16, 185, 129)')).toBe('#10b981');
      expect(rgbToHex('#7c8cf8')).toBe('#7c8cf8');
    });

    it('returns null for transparent or invalid colors', () => {
      expect(rgbToHex('transparent')).toBeNull();
      expect(rgbToHex('rgba(0, 0, 0, 0)')).toBeNull();
      expect(rgbToHex('invalid')).toBeNull();
    });
  });

  describe('kebabToCamelCase & cssPropertiesToReactStyle', () => {
    it('converts kebab-case to camelCase properly', () => {
      expect(kebabToCamelCase('background-color')).toBe('backgroundColor');
      expect(kebabToCamelCase('border-top-left-radius')).toBe('borderTopLeftRadius');
      expect(kebabToCamelCase('z-index')).toBe('zIndex');
      expect(kebabToCamelCase('--primary-color')).toBe('--primary-color');
    });

    it('generates formatted React style object', () => {
      const styles = {
        'background-color': '#10b981',
        'border-radius': '8px',
      };
      const result = cssPropertiesToReactStyle(styles);
      expect(result).toContain("backgroundColor: '#10b981'");
      expect(result).toContain("borderRadius: '8px'");
    });
  });

  describe('analyzePageDesign', () => {
    it('extracts font usage, colors, and spacing metrics', () => {
      const summary = analyzePageDesign();
      expect(summary).toBeDefined();
      expect(Array.isArray(summary.fonts)).toBe(true);
      expect(Array.isArray(summary.colors)).toBe(true);
      expect(typeof summary.spacing.compliancePercent).toBe('number');
      expect(summary.spacing.baseGrid).toBe(4);
    });
  });
});

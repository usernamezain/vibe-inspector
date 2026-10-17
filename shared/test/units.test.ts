import { describe, it, expect } from 'vitest';
import {
  parseUnitValue,
  formatUnitValue,
  stepValue,
  isPropertyModified,
} from '../src/units';

describe('Unit Parsing & Numeric Stepping (units.ts)', () => {
  describe('parseUnitValue', () => {
    it('correctly parses pixels, percentages, rem, and em', () => {
      expect(parseUnitValue('16px')).toEqual({ num: 16, unit: 'px', isUnset: false, raw: '16px' });
      expect(parseUnitValue('100%')).toEqual({ num: 100, unit: '%', isUnset: false, raw: '100%' });
      expect(parseUnitValue('1.5rem')).toEqual({ num: 1.5, unit: 'rem', isUnset: false, raw: '1.5rem' });
      expect(parseUnitValue('2em')).toEqual({ num: 2, unit: 'em', isUnset: false, raw: '2em' });
      expect(parseUnitValue('45deg')).toEqual({ num: 45, unit: 'deg', isUnset: false, raw: '45deg' });
    });

    it('handles negative values and floating point numbers', () => {
      expect(parseUnitValue('-12px')).toEqual({ num: -12, unit: 'px', isUnset: false, raw: '-12px' });
      expect(parseUnitValue('0.25rem')).toEqual({ num: 0.25, unit: 'rem', isUnset: false, raw: '0.25rem' });
    });

    it('correctly identifies unset, hyphen, and auto values', () => {
      expect(parseUnitValue('-')).toEqual({ num: null, unit: 'px', isUnset: true, raw: '-' });
      expect(parseUnitValue('')).toEqual({ num: null, unit: 'px', isUnset: true, raw: '-' });
      expect(parseUnitValue(null)).toEqual({ num: null, unit: 'px', isUnset: true, raw: '-' });
      expect(parseUnitValue('unset')).toEqual({ num: null, unit: 'px', isUnset: true, raw: '-' });
      expect(parseUnitValue('auto')).toEqual({ num: null, unit: 'auto', isUnset: false, raw: 'auto' });
    });
  });

  describe('formatUnitValue', () => {
    it('formats numbers and units into valid CSS strings', () => {
      expect(formatUnitValue(24, 'px')).toBe('24px');
      expect(formatUnitValue(100, '%')).toBe('100%');
      expect(formatUnitValue(1.25, 'rem')).toBe('1.25rem');
      expect(formatUnitValue(null, 'auto')).toBe('auto');
      expect(formatUnitValue(null, 'px')).toBe('');
    });

    it('rounds to 2 decimal places to avoid float precision artifacts', () => {
      expect(formatUnitValue(14.0000001, 'px')).toBe('14px');
      expect(formatUnitValue(16.3333333, 'px')).toBe('16.33px');
    });
  });

  describe('stepValue', () => {
    it('steps by 1 with standard direction', () => {
      expect(stepValue(14, 1)).toBe(15);
      expect(stepValue(14, -1)).toBe(13);
    });

    it('steps by 10x with Shift key pressed', () => {
      expect(stepValue(14, 1, { shift: true })).toBe(24);
      expect(stepValue(20, -1, { shift: true })).toBe(10);
    });

    it('steps by 0.1x with Alt key pressed', () => {
      expect(stepValue(14, 1, { alt: true })).toBe(14.1);
      expect(stepValue(14, -1, { alt: true })).toBe(13.9);
    });
  });

  describe('isPropertyModified', () => {
    it('detects user modifications compared to computed style', () => {
      expect(isPropertyModified('16px', '14px')).toBe(true);
      expect(isPropertyModified('rgb(255, 0, 0)', 'rgb(0, 0, 0)')).toBe(true);
      expect(isPropertyModified('14px', '14px')).toBe(false);
      expect(isPropertyModified('', '14px')).toBe(false);
      expect(isPropertyModified(undefined, '14px')).toBe(false);
      expect(isPropertyModified('20px', undefined)).toBe(true);
    });
  });
});

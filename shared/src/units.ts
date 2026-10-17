/**
 * Unit Parsing and Numeric Scrubbing Utilities
 * Supports px, %, em, rem, vw, vh, deg, ms, s, and unitless values.
 */

export interface ParsedUnitValue {
  num: number | null;
  unit: string;
  isUnset: boolean;
  raw: string;
}

const SUPPORTED_UNITS = ['px', '%', 'em', 'rem', 'vw', 'vh', 'deg', 'ms', 's', 'auto'];

/**
 * Parses a CSS property string into number and unit
 * Handles unset states, '-', 'auto', and unitless values
 */
export function parseUnitValue(val: string | undefined | null): ParsedUnitValue {
  if (val === undefined || val === null || val === '' || val === '-' || val === 'unset' || val === 'initial') {
    return { num: null, unit: 'px', isUnset: true, raw: '-' };
  }

  const trimmed = val.trim();
  if (trimmed === 'auto') {
    return { num: null, unit: 'auto', isUnset: false, raw: 'auto' };
  }

  // Regex to extract numeric part and unit
  const match = trimmed.match(/^([-+]?[0-9]*\.?[0-9]+)\s*([a-z%]*)$/i);
  if (!match) {
    const num = parseFloat(trimmed);
    return {
      num: isNaN(num) ? null : num,
      unit: 'px',
      isUnset: isNaN(num),
      raw: trimmed,
    };
  }

  const num = parseFloat(match[1]);
  let unit = (match[2] || 'px').toLowerCase();
  if (!SUPPORTED_UNITS.includes(unit)) {
    unit = 'px';
  }

  return {
    num: isNaN(num) ? null : num,
    unit,
    isUnset: isNaN(num),
    raw: trimmed,
  };
}

/**
 * Formats a numeric value and unit back into a valid CSS string
 */
export function formatUnitValue(num: number | null, unit: string): string {
  if (num === null) {
    return unit === 'auto' ? 'auto' : '';
  }
  if (unit === 'auto') return 'auto';
  // Round to max 2 decimals to prevent precision float artifacts
  const rounded = Math.round(num * 100) / 100;
  return `${rounded}${unit}`;
}

/**
 * Steps a value using arrow keys or drag scrubbing
 * Shift = 10x step, Alt/Option = 0.1x step
 */
export function stepValue(
  current: number,
  delta: number,
  options: { shift?: boolean; alt?: boolean } = {}
): number {
  let multiplier = 1;
  if (options.shift) {
    multiplier = 10;
  } else if (options.alt) {
    multiplier = 0.1;
  }

  const step = delta * multiplier;
  const result = current + step;
  return Math.round(result * 100) / 100;
}

/**
 * Determines whether a user value is modified relative to computed style
 */
export function isPropertyModified(
  userValue: string | undefined,
  computedValue: string | undefined
): boolean {
  if (userValue === undefined || userValue === '') return false;
  if (computedValue === undefined) return true;
  return userValue.trim() !== computedValue.trim();
}

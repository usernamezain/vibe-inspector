/**
 * WCAG 2.1 Contrast Ratio and Luminance utilities
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ContrastResult {
  ratio: number;
  ratioString: string;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  badgeText: string;
  badgeLevel: 'pass' | 'warning' | 'fail';
}

/**
 * Parses RGB, RGBA, or Hex strings into normalized RGBA components (0-255)
 */
export function parseColor(colorStr: string): RGBA {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit' || colorStr === 'initial') {
    return { r: 255, g: 255, b: 255, a: 0 };
  }

  const str = colorStr.trim().toLowerCase();

  // Hex format: #rgb, #rgba, #rrggbb, #rrggbbaa
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
      return { r, g, b, a };
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    return {
      r: Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10))),
      g: Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10))),
      b: Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10))),
      a: rgbMatch[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(rgbMatch[4]))) : 1,
    };
  }

  // Named fallbacks for common defaults
  if (str === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  if (str === 'white') return { r: 255, g: 255, b: 255, a: 1 };

  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Calculates relative luminance according to WCAG 2.1 specs
 */
export function getLuminance(rgba: RGBA): number {
  const [rs, gs, bs] = [rgba.r, rgba.g, rgba.b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between foreground and background colors
 */
export function calculateContrastRatio(fgStr: string, bgStr: string): ContrastResult {
  let fg = parseColor(fgStr);
  let bg = parseColor(bgStr);

  // If background has alpha < 1, composite it against white
  if (bg.a < 1) {
    bg = {
      r: Math.round(bg.r * bg.a + 255 * (1 - bg.a)),
      g: Math.round(bg.g * bg.a + 255 * (1 - bg.a)),
      b: Math.round(bg.b * bg.a + 255 * (1 - bg.a)),
      a: 1,
    };
  }

  // If foreground has alpha < 1, composite it over the resolved background
  if (fg.a < 1) {
    fg = {
      r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
      g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
      b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
      a: 1,
    };
  }

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  const roundedRatio = Math.round(ratio * 10) / 10;

  const aaNormal = roundedRatio >= 4.5;
  const aaLarge = roundedRatio >= 3.0;
  const aaaNormal = roundedRatio >= 7.0;

  let badgeLevel: 'pass' | 'warning' | 'fail' = 'fail';
  let badgeText = `${roundedRatio}:1 Fail`;

  if (aaaNormal) {
    badgeLevel = 'pass';
    badgeText = `${roundedRatio}:1 AAA`;
  } else if (aaNormal) {
    badgeLevel = 'pass';
    badgeText = `${roundedRatio}:1 AA`;
  } else if (aaLarge) {
    badgeLevel = 'warning';
    badgeText = `${roundedRatio}:1 Large Only`;
  }

  return {
    ratio: roundedRatio,
    ratioString: `${roundedRatio}:1`,
    aaNormal,
    aaLarge,
    aaaNormal,
    badgeText,
    badgeLevel,
  };
}

/**
 * Auto-adjusts foreground color lightness until it satisfies the target ratio (default 4.5:1)
 */
export function autoFixColor(fgStr: string, bgStr: string, targetRatio: number = 4.5): string {
  const fg = parseColor(fgStr);
  const bg = parseColor(bgStr);
  const bgL = getLuminance(bg);

  // If background is light (luminance > 0.4), darken fg towards black
  // If background is dark (luminance <= 0.4), lighten fg towards white
  const shouldLighten = bgL <= 0.4;

  let currentFg = { ...fg };
  for (let step = 0; step <= 25; step++) {
    const factor = step / 25;
    if (shouldLighten) {
      currentFg = {
        r: Math.round(fg.r + (255 - fg.r) * factor),
        g: Math.round(fg.g + (255 - fg.g) * factor),
        b: Math.round(fg.b + (255 - fg.b) * factor),
        a: 1,
      };
    } else {
      currentFg = {
        r: Math.round(fg.r * (1 - factor)),
        g: Math.round(fg.g * (1 - factor)),
        b: Math.round(fg.b * (1 - factor)),
        a: 1,
      };
    }

    const testStr = `rgb(${currentFg.r}, ${currentFg.g}, ${currentFg.b})`;
    const res = calculateContrastRatio(testStr, bgStr);
    if (res.ratio >= targetRatio) {
      return rgbToHex(currentFg.r, currentFg.g, currentFg.b);
    }
  }

  return shouldLighten ? '#ffffff' : '#111827';
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

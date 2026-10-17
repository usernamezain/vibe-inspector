/**
 * Page-Level Design Language Analysis
 * Discovers fonts in use, color palettes, CSS variables, and spacing scale compliance.
 */

export interface FontUsage {
  family: string;
  weights: number[];
  count: number;
}

export interface ColorUsage {
  hex: string;
  count: number;
  sampleSelector: string;
}

export interface SpacingAnalysis {
  baseGrid: number;
  compliancePercent: number;
  outliers: Array<{
    selector: string;
    property: string;
    value: string;
  }>;
}

export interface PageDesignSummary {
  fonts: FontUsage[];
  colors: ColorUsage[];
  cssVariables: Record<string, string>;
  spacing: SpacingAnalysis;
}

/**
 * Normalizes font family names (removes quotes and fallbacks)
 */
export function cleanFontFamily(font: string): string {
  if (!font) return 'system-ui';
  const first = font.split(',')[0].trim().replace(/['"]/g, '');
  return first || 'system-ui';
}

/**
 * Converts rgb/rgba to hex
 */
export function rgbToHex(rgb: string): string | null {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
  if (rgb.startsWith('#')) return rgb.toLowerCase();
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return null;
  const [r, g, b] = match.map(Number);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`.toLowerCase();
}

/**
 * Scans DOM elements to extract design system metrics
 * Safe execution: depth-limited and capped to max 250 elements to prevent perf impact.
 */
export function analyzePageDesign(): PageDesignSummary {
  const fontMap = new Map<string, { weights: Set<number>; count: number }>();
  const colorMap = new Map<string, { count: number; selector: string }>();
  const spacingOutliers: SpacingAnalysis['outliers'] = [];
  let totalSpacingSamples = 0;
  let compliantSamples = 0;

  // 1. Gather CSS custom properties from stylesheets
  const cssVariables: Record<string, string> = {};
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule instanceof CSSStyleRule) {
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              if (prop && prop.startsWith('--') && !cssVariables[prop]) {
                const val = rule.style.getPropertyValue(prop).trim();
                if (val) cssVariables[prop] = val;
              }
            }
          }
        }
      } catch {}
    }
  } catch {}

  // 2. Scan visible elements (capped to 250)
  const elements = Array.from(document.querySelectorAll('body *:not(#vibe-inspector-host *)')).slice(0, 250);

  for (const el of elements) {
    if (!(el instanceof HTMLElement)) continue;
    const computed = window.getComputedStyle(el);
    if (computed.display === 'none' || computed.visibility === 'hidden') continue;

    // Fonts
    const family = cleanFontFamily(computed.fontFamily);
    const weight = parseInt(computed.fontWeight, 10) || 400;
    if (family) {
      const entry = fontMap.get(family) || { weights: new Set(), count: 0 };
      entry.weights.add(weight);
      entry.count += 1;
      fontMap.set(family, entry);
    }

    // Colors
    const textHex = rgbToHex(computed.color);
    if (textHex) {
      const c = colorMap.get(textHex) || { count: 0, selector: el.tagName.toLowerCase() };
      c.count += 1;
      colorMap.set(textHex, c);
    }

    const bgHex = rgbToHex(computed.backgroundColor);
    if (bgHex) {
      const c = colorMap.get(bgHex) || { count: 0, selector: el.tagName.toLowerCase() };
      c.count += 1;
      colorMap.set(bgHex, c);
    }

    // Spacing compliance (4px / 8px grid)
    const spacingProps = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
    for (const prop of spacingProps) {
      const val = parseFloat(computed[prop as any] || '0');
      if (val > 0) {
        totalSpacingSamples += 1;
        if (val % 4 === 0) {
          compliantSamples += 1;
        } else if (spacingOutliers.length < 10) {
          spacingOutliers.push({
            selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(),
            property: prop.replace(/([A-Z])/g, '-$1').toLowerCase(),
            value: `${val}px`,
          });
        }
      }
    }
  }

  // Format fonts
  const fonts: FontUsage[] = Array.from(fontMap.entries())
    .map(([family, data]) => ({
      family,
      weights: Array.from(data.weights).sort((a, b) => a - b),
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  // Format colors
  const colors: ColorUsage[] = Array.from(colorMap.entries())
    .map(([hex, data]) => ({
      hex,
      count: data.count,
      sampleSelector: data.selector,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);

  const compliancePercent = totalSpacingSamples > 0
    ? Math.round((compliantSamples / totalSpacingSamples) * 100)
    : 100;

  return {
    fonts,
    colors,
    cssVariables,
    spacing: {
      baseGrid: 4,
      compliancePercent,
      outliers: spacingOutliers,
    },
  };
}

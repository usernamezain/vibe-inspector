/**
 * Design Token Extractor
 * Discovers and maps CSS custom properties (--color-*, --spacing-*, --radius-*)
 */

export interface DesignToken {
  name: string;
  value: string;
  category: 'color' | 'spacing' | 'radius' | 'font' | 'other';
}

export function categorizeToken(name: string): DesignToken['category'] {
  const n = name.toLowerCase();
  if (n.includes('color') || n.includes('bg') || n.includes('text') || n.includes('primary') || n.includes('secondary')) {
    return 'color';
  }
  if (n.includes('spacing') || n.includes('margin') || n.includes('padding') || n.includes('gap')) {
    return 'spacing';
  }
  if (n.includes('radius') || n.includes('round')) {
    return 'radius';
  }
  if (n.includes('font') || n.includes('text') || n.includes('size')) {
    return 'font';
  }
  return 'other';
}

/**
 * Extracts declared CSS custom properties from an element or document root
 */
export function extractDesignTokens(element: HTMLElement | null = null): DesignToken[] {
  const tokens: DesignToken[] = [];
  const target = element || document.documentElement;
  const computed = window.getComputedStyle(target);

  // Read stylesheets for declared CSS variables on :root or selectors
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            for (let i = 0; i < rule.style.length; i++) {
              const propName = rule.style[i];
              if (propName && propName.startsWith('--') && !tokens.some((t) => t.name === propName)) {
                const val = computed.getPropertyValue(propName).trim();
                if (val) {
                  tokens.push({
                    name: propName,
                    value: val,
                    category: categorizeToken(propName),
                  });
                }
              }
            }
          }
        }
      } catch {
        // Cross-origin stylesheets will throw SecurityError; gracefully ignore
      }
    }
  } catch {}

  return tokens;
}

/**
 * Finds if a given value matches an existing design token
 */
export function findMatchingToken(tokens: DesignToken[], val: string): DesignToken | null {
  if (!val || val === 'transparent') return null;
  const normalized = val.trim().toLowerCase();

  for (const token of tokens) {
    if (token.value.trim().toLowerCase() === normalized) {
      return token;
    }
  }

  return null;
}

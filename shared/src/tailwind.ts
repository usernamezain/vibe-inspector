/**
 * Tailwind CSS utility class synthesizer
 * Converts CSS properties to idiomatic Tailwind classes
 */

const SPACING_MAP: Record<number, string> = {
  0: '0',
  1: '0.5',
  2: '0.5',
  4: '1',
  6: '1.5',
  8: '2',
  10: '2.5',
  12: '3',
  14: '3.5',
  16: '4',
  20: '5',
  24: '6',
  28: '7',
  32: '8',
  36: '9',
  40: '10',
  48: '12',
  56: '14',
  64: '16',
};

const FONT_SIZE_MAP: Record<number, string> = {
  12: 'text-xs',
  14: 'text-sm',
  16: 'text-base',
  18: 'text-lg',
  20: 'text-xl',
  24: 'text-2xl',
  30: 'text-3xl',
  36: 'text-4xl',
  48: 'text-5xl',
};

const BORDER_RADIUS_MAP: Record<number, string> = {
  0: 'rounded-none',
  2: 'rounded-sm',
  4: 'rounded',
  6: 'rounded-md',
  8: 'rounded-lg',
  12: 'rounded-xl',
  16: 'rounded-2xl',
  24: 'rounded-3xl',
};

function parsePixel(val: string): number | null {
  const match = val.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Math.round(parseFloat(match[1])) : null;
}

function mapSpacing(prefix: string, val: string): string {
  const px = parsePixel(val);
  if (px !== null && SPACING_MAP[px] !== undefined) {
    return `${prefix}-${SPACING_MAP[px]}`;
  }
  return `${prefix}-[${val}]`;
}

function mapColor(prefix: string, val: string): string {
  if (val === 'transparent') return `${prefix}-transparent`;
  if (val === '#ffffff' || val === 'rgb(255, 255, 255)') return `${prefix}-white`;
  if (val === '#000000' || val === 'rgb(0, 0, 0)') return `${prefix}-black`;
  return `${prefix}-[${val}]`;
}

/**
 * Translates a single CSS property and value into a Tailwind class
 */
export function cssPropertyToTailwind(prop: string, val: string): string | null {
  const p = prop.toLowerCase().trim();
  const v = val.toLowerCase().trim();

  // 1. Spacing
  if (p === 'margin-top' || p === 'margintop') return mapSpacing('mt', v);
  if (p === 'margin-right' || p === 'marginright') return mapSpacing('mr', v);
  if (p === 'margin-bottom' || p === 'marginbottom') return mapSpacing('mb', v);
  if (p === 'margin-left' || p === 'marginleft') return mapSpacing('ml', v);
  if (p === 'padding-top' || p === 'paddingtop') return mapSpacing('pt', v);
  if (p === 'padding-right' || p === 'paddingright') return mapSpacing('pr', v);
  if (p === 'padding-bottom' || p === 'paddingbottom') return mapSpacing('pb', v);
  if (p === 'padding-left' || p === 'paddingleft') return mapSpacing('pl', v);
  if (p === 'gap') return mapSpacing('gap', v);

  // 2. Display
  if (p === 'display') {
    if (v === 'flex') return 'flex';
    if (v === 'grid') return 'grid';
    if (v === 'block') return 'block';
    if (v === 'inline-block') return 'inline-block';
    if (v === 'inline') return 'inline';
    if (v === 'none') return 'hidden';
  }

  // 3. Flexbox
  if (p === 'flex-direction' || p === 'flexdirection') {
    if (v === 'row') return 'flex-row';
    if (v === 'column') return 'flex-col';
  }
  if (p === 'align-items' || p === 'alignitems') {
    if (v === 'center') return 'items-center';
    if (v === 'flex-start' || v === 'start') return 'items-start';
    if (v === 'flex-end' || v === 'end') return 'items-end';
    if (v === 'stretch') return 'items-stretch';
  }
  if (p === 'justify-content' || p === 'justifycontent') {
    if (v === 'center') return 'justify-center';
    if (v === 'flex-start' || v === 'start') return 'justify-start';
    if (v === 'flex-end' || v === 'end') return 'justify-end';
    if (v === 'space-between') return 'justify-between';
    if (v === 'space-around') return 'justify-around';
    if (v === 'space-evenly') return 'justify-evenly';
  }

  // 4. Typography
  if (p === 'font-size' || p === 'fontsize') {
    const px = parsePixel(v);
    if (px !== null && FONT_SIZE_MAP[px]) return FONT_SIZE_MAP[px];
    return `text-[${v}]`;
  }
  if (p === 'font-weight' || p === 'fontweight') {
    if (v === '300') return 'font-light';
    if (v === '400') return 'font-normal';
    if (v === '500') return 'font-medium';
    if (v === '600') return 'font-semibold';
    if (v === '700') return 'font-bold';
    if (v === '800') return 'font-extrabold';
  }
  if (p === 'text-align' || p === 'textalign') {
    return `text-${v}`;
  }
  if (p === 'color') {
    return mapColor('text', v);
  }

  // 5. Background & Appearance
  if (p === 'background-color' || p === 'backgroundcolor') {
    return mapColor('bg', v);
  }
  if (p === 'opacity') {
    const num = parseFloat(v);
    if (!isNaN(num)) {
      return `opacity-${Math.round(num * 100)}`;
    }
  }
  if (p === 'border-radius' || p === 'borderradius') {
    const px = parsePixel(v);
    if (px !== null && BORDER_RADIUS_MAP[px]) return BORDER_RADIUS_MAP[px];
    if (v === '9999px' || v === '50%') return 'rounded-full';
    return `rounded-[${v}]`;
  }

  // 6. Border
  if (p === 'border-width' || p === 'borderwidth') {
    const px = parsePixel(v);
    if (px === 1) return 'border';
    if (px !== null) return `border-${px}`;
    return `border-[${v}]`;
  }
  if (p === 'border-style' || p === 'borderstyle') {
    return `border-${v}`;
  }
  if (p === 'border-color' || p === 'bordercolor') {
    return mapColor('border', v);
  }

  return null;
}

/**
 * Synthesizes an array/record of CSS property changes into a clean Tailwind class string
 */
export function synthesizeTailwindClasses(properties: Record<string, string>): string {
  const classes: string[] = [];

  for (const [prop, val] of Object.entries(properties)) {
    const cls = cssPropertyToTailwind(prop, val);
    if (cls) {
      classes.push(cls);
    }
  }

  return classes.join(' ');
}

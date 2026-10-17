import { describe, it, expect } from 'vitest';
import { resolveSourceLocation } from '../src/source.js';
import { synthesizeTailwindClasses, cssPropertyToTailwind } from '../src/tailwind.js';
import { categorizeToken, findMatchingToken, DesignToken } from '../src/tokens.js';

describe('Phase 4: Source Location Resolver', () => {
  it('resolves direct data-at attribute on element', () => {
    const el = document.createElement('button');
    el.setAttribute('data-at', 'src/components/Header.tsx:24:5');

    const resolved = resolveSourceLocation(el);
    expect(resolved.isMapped).toBe(true);
    expect(resolved.file).toBe('src/components/Header.tsx');
    expect(resolved.line).toBe(24);
    expect(resolved.column).toBe(5);
    expect(resolved.componentName).toBe('Header');
    expect(resolved.framework).toBe('react');
  });

  it('crawls up ancestor tree to find source markers from enclosing component', () => {
    const parent = document.createElement('div');
    parent.setAttribute('data-locatorjs-id', 'src/views/Dashboard.vue::120');

    const child = document.createElement('span');
    parent.appendChild(child);

    const resolved = resolveSourceLocation(child);
    expect(resolved.isMapped).toBe(true);
    expect(resolved.file).toBe('src/views/Dashboard.vue');
    expect(resolved.line).toBe(120);
    expect(resolved.componentName).toBe('Dashboard');
    expect(resolved.framework).toBe('vue');
  });

  it('resolves code-inspector-plugin attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-inspector-file', 'src/routes/about.svelte');
    el.setAttribute('data-inspector-line', '15');

    const resolved = resolveSourceLocation(el);
    expect(resolved.isMapped).toBe(true);
    expect(resolved.file).toBe('src/routes/about.svelte');
    expect(resolved.line).toBe(15);
    expect(resolved.componentName).toBe('about');
    expect(resolved.framework).toBe('svelte');
  });

  it('returns explicit unmapped state for uninstrumented elements', () => {
    const el = document.createElement('div');
    const resolved = resolveSourceLocation(el);
    expect(resolved.isMapped).toBe(false);
    expect(resolved.unmappedReason).toContain('No build-time source markers');
  });
});

describe('Phase 4: Tailwind Class Synthesizer', () => {
  it('translates individual CSS properties to Tailwind utilities', () => {
    expect(cssPropertyToTailwind('margin-top', '16px')).toBe('mt-4');
    expect(cssPropertyToTailwind('padding-left', '8px')).toBe('pl-2');
    expect(cssPropertyToTailwind('display', 'flex')).toBe('flex');
    expect(cssPropertyToTailwind('gap', '16px')).toBe('gap-4');
    expect(cssPropertyToTailwind('font-size', '14px')).toBe('text-sm');
    expect(cssPropertyToTailwind('font-weight', '700')).toBe('font-bold');
    expect(cssPropertyToTailwind('text-align', 'center')).toBe('text-center');
    expect(cssPropertyToTailwind('border-radius', '8px')).toBe('rounded-lg');
  });

  it('handles arbitrary pixel values via square bracket notation', () => {
    expect(cssPropertyToTailwind('margin-top', '23px')).toBe('mt-[23px]');
    expect(cssPropertyToTailwind('border-radius', '33px')).toBe('rounded-[33px]');
  });

  it('synthesizes multi-property styles into clean class string', () => {
    const props = {
      'margin-top': '16px',
      'display': 'flex',
      'gap': '8px',
      'border-radius': '8px',
      'font-weight': '600',
    };

    const tailwind = synthesizeTailwindClasses(props);
    expect(tailwind).toContain('mt-4');
    expect(tailwind).toContain('flex');
    expect(tailwind).toContain('gap-2');
    expect(tailwind).toContain('rounded-lg');
    expect(tailwind).toContain('font-semibold');
  });
});

describe('Phase 4: Design Tokens', () => {
  it('categorizes custom properties correctly', () => {
    expect(categorizeToken('--color-primary')).toBe('color');
    expect(categorizeToken('--spacing-lg')).toBe('spacing');
    expect(categorizeToken('--radius-md')).toBe('radius');
    expect(categorizeToken('--font-heading')).toBe('font');
  });

  it('finds matching tokens from declared palette', () => {
    const tokens: DesignToken[] = [
      { name: '--brand-primary', value: '#6366f1', category: 'color' },
      { name: '--radius-base', value: '8px', category: 'radius' },
    ];

    const matchColor = findMatchingToken(tokens, '#6366f1');
    expect(matchColor).toBeDefined();
    expect(matchColor?.name).toBe('--brand-primary');

    const matchRadius = findMatchingToken(tokens, '8px');
    expect(matchRadius).toBeDefined();
    expect(matchRadius?.name).toBe('--radius-base');
  });
});

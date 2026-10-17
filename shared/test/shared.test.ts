import { describe, it, expect } from 'vitest';
import { inferElementName } from '../src/naming';
import { inferUITerm } from '../src/terms';
import { generateSelectors } from '../src/selectors';

describe('inferElementName', () => {
  it('prefers data-element-name if no id is present', () => {
    const el = document.createElement('button');
    el.setAttribute('data-element-name', 'custom-submit-btn');
    const result = inferElementName(el);
    expect(result.primary).toBe('custom-submit-btn');
    expect(result.primarySource).toBe('data-testid');
  });

  it('uses aria-label if no id or testid is present', () => {
    const el = document.createElement('button');
    el.setAttribute('aria-label', 'Close dialogue modal');
    const result = inferElementName(el);
    expect(result.primary).toBe('Close dialogue modal');
    expect(result.primarySource).toBe('aria-label');
  });

  it('filters out generated hashed IDs and falls back to tag/class', () => {
    const el = document.createElement('div');
    el.id = ':r1a:';
    el.className = 'profile-header';
    const result = inferElementName(el);
    expect(result.primary).toBe('.profile-header');
    expect(result.primarySource).toBe('class');
  });

  it('uses source location component file name if available', () => {
    const el = document.createElement('div');
    const result = inferElementName(el, { file: 'src/components/UserProfileCard.tsx', line: 42 });
    expect(result.primary).toBe('<UserProfileCard />');
    expect(result.primarySource).toBe('component');
  });
});

describe('inferUITerm', () => {
  it('identifies buttons correctly', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Sign in';
    const { term } = inferUITerm(btn);
    expect(term).toBe('Button');
  });

  it('identifies search inputs', () => {
    const input = document.createElement('input');
    input.type = 'search';
    const { term } = inferUITerm(input);
    expect(term).toBe('Search Input');
  });

  it('identifies headings', () => {
    const h1 = document.createElement('h1');
    h1.textContent = 'Welcome to Vibe Inspector';
    const { term } = inferUITerm(h1);
    expect(term).toBe('Heading 1');
  });

  it('identifies navigation elements', () => {
    const nav = document.createElement('nav');
    const { term } = inferUITerm(nav);
    expect(term).toBe('Navigation');
  });

  it('identifies card containers based on class names', () => {
    const card = document.createElement('div');
    card.className = 'pricing-card-wrapper';
    const { term } = inferUITerm(card);
    expect(term).toBe('Card');
  });
});

describe('generateSelectors', () => {
  it('generates unique ID selector when element has a clean ID', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const btn = document.createElement('button');
    btn.id = 'submit-checkout';
    container.appendChild(btn);

    const { primary } = generateSelectors(btn);
    expect(primary).toBe('#submit-checkout');
    document.body.removeChild(container);
  });

  it('generates unique path selector when element has siblings with classes', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    const item1 = document.createElement('div');
    item1.className = 'menu-item';
    const item2 = document.createElement('div');
    item2.className = 'menu-item active';

    container.appendChild(item1);
    container.appendChild(item2);

    const { primary } = generateSelectors(item2);
    expect(primary).toBe('div.active');
    expect(document.querySelector(primary)).toBe(item2);

    document.body.removeChild(container);
  });
});

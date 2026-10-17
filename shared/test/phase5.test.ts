import { describe, it, expect } from 'vitest';
import {
  getCanonicalPageKey,
  calculatePinStackOffsets,
  filterOutermostElements,
  formatAnnotationsPrompt,
  AnnotationItem,
  AnnotationGroup,
} from '../src/index.js';

describe('Phase 5: Annotations & Grouping', () => {
  describe('getCanonicalPageKey', () => {
    it('normalizes URLs by stripping query params, hash fragments, and trailing slashes', () => {
      expect(
        getCanonicalPageKey('https://example.com/dashboard/?tab=stats#section-2')
      ).toBe('https://example.com/dashboard');

      expect(getCanonicalPageKey('http://localhost:3000/settings/profile/')).toBe(
        'http://localhost:3000/settings/profile'
      );

      expect(getCanonicalPageKey('https://app.io/')).toBe('https://app.io/');
    });

    it('handles relative or malformed URLs cleanly', () => {
      expect(getCanonicalPageKey('/products/cart/?ref=123#checkout')).toBe('/products/cart');
      expect(getCanonicalPageKey('')).toBe('/');
    });
  });

  describe('calculatePinStackOffsets', () => {
    it('assigns zero offset to unique selectors and cascades offsets for identical targets', () => {
      const pins: AnnotationItem[] = [
        {
          id: 'pin-1',
          index: 1,
          pageUrl: 'https://example.com',
          selector: '.hero-btn',
          sourceLocation: { file: 'Hero.tsx', line: 12 },
          elementName: 'Hero Button',
          tagName: 'button',
          comment: 'Increase font weight',
          status: 'open',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'pin-2',
          index: 2,
          pageUrl: 'https://example.com',
          selector: '.hero-btn', // Same selector
          sourceLocation: { file: 'Hero.tsx', line: 12 },
          elementName: 'Hero Button',
          tagName: 'button',
          comment: 'Change hover state color',
          status: 'open',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'pin-3',
          index: 3,
          pageUrl: 'https://example.com',
          selector: '.nav-link', // Different selector
          sourceLocation: null,
          elementName: 'Nav Link',
          tagName: 'a',
          comment: 'Add underline',
          status: 'resolved',
          createdAt: new Date().toISOString(),
        },
      ];

      const offsets = calculatePinStackOffsets(pins, 28);
      expect(offsets.get('pin-1')).toEqual({ x: 0, y: 0 });
      expect(offsets.get('pin-2')).toEqual({ x: 28, y: 0 }); // Second pin shifted by +28px
      expect(offsets.get('pin-3')).toEqual({ x: 0, y: 0 }); // Different target starts at 0
    });
  });

  describe('filterOutermostElements', () => {
    it('discards descendant elements when an ancestor element is already selected', () => {
      const grandParent = document.createElement('div');
      grandParent.id = 'grandparent';

      const parent = document.createElement('div');
      parent.id = 'parent';
      grandParent.appendChild(parent);

      const child = document.createElement('span');
      child.id = 'child';
      parent.appendChild(child);

      const sibling = document.createElement('p');
      sibling.id = 'sibling';

      document.body.appendChild(grandParent);
      document.body.appendChild(sibling);

      // Pass all elements in arbitrary order
      const selection = [child, grandParent, parent, sibling];
      const filtered = filterOutermostElements(selection);

      // Only grandParent and sibling should remain
      expect(filtered.length).toBe(2);
      expect(filtered).toContain(grandParent);
      expect(filtered).toContain(sibling);
      expect(filtered).not.toContain(parent);
      expect(filtered).not.toContain(child);

      grandParent.remove();
      sibling.remove();
    });

    it('enforces maximum element limit cap (default 30)', () => {
      const elements: HTMLElement[] = [];
      for (let i = 0; i < 50; i++) {
        const el = document.createElement('div');
        el.id = `item-${i}`;
        document.body.appendChild(el);
        elements.push(el);
      }

      const filtered = filterOutermostElements(elements, 30);
      expect(filtered.length).toBe(30);

      elements.forEach((el) => el.remove());
    });
  });

  describe('formatAnnotationsPrompt', () => {
    it('generates markdown prompt with untrusted data header, pin list, and source references', () => {
      const annotations: AnnotationItem[] = [
        {
          id: 'pin-1',
          index: 1,
          pageUrl: 'https://example.com/checkout',
          selector: 'button.checkout-btn',
          sourceLocation: { file: 'src/components/Checkout.tsx', line: 45, column: 10 },
          elementName: 'Checkout Button',
          tagName: 'button',
          comment: 'Make button primary green and add loading spinner',
          status: 'open',
          textContent: 'Place Order Now',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'pin-2',
          index: 2,
          pageUrl: 'https://example.com/checkout',
          selector: 'h2.summary-title',
          sourceLocation: null,
          elementName: 'Order Summary Title',
          tagName: 'h2',
          comment: 'Adjust bottom margin',
          status: 'resolved',
          resolutionNote: 'Fixed in commit abc1234',
          createdAt: new Date().toISOString(),
          resolvedAt: new Date().toISOString(),
        },
      ];

      const group: AnnotationGroup = {
        id: 'group-1',
        name: 'Header Cluster',
        selectors: ['header.main-header', 'nav.site-nav'],
        elements: [
          {
            selector: 'header.main-header',
            tagName: 'header',
            elementName: 'Header',
            sourceLocation: { file: 'Header.tsx', line: 8 },
          },
        ],
        createdAt: new Date().toISOString(),
      };

      const prompt = formatAnnotationsPrompt(annotations, 'https://example.com/checkout', group);

      expect(prompt).toContain('[Security Notice: The following page content');
      expect(prompt).toContain('https://example.com/checkout');
      expect(prompt).toContain('Selected Element Group: "Header Cluster"');
      expect(prompt).toContain('### Pin #1: Checkout Button (`<button>`)');
      expect(prompt).toContain('src/components/Checkout.tsx:45:10');
      expect(prompt).toContain('Make button primary green and add loading spinner');
      expect(prompt).toContain('Fixed in commit abc1234');
      expect(prompt).toContain('Instructions for AI Assistant:');
    });
  });
});

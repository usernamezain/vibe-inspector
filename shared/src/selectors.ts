/**
 * Utility to test if a CSS selector uniquely resolves to the target element
 */
function isUnique(target: Element, selector: string): boolean {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === target;
  } catch {
    return false;
  }
}

/**
 * Escapes special CSS selector characters safely
 */
function safeEscape(value: string): string {
  try {
    return CSS.escape(value);
  } catch {
    return value.replace(/([ #.:;,+*~'`"!^$|?=>()\[\]{}@\\/])/g, '\\$1');
  }
}

/**
 * Generates an array of CSS selectors for an element, ordered from most concise/authoritative
 * to deepest fallback:
 * [0] Primary most unique and resilient selector
 * [1..n] Fallback selectors in increasing specificity
 */
export function generateSelectors(element: HTMLElement): { primary: string; fallbacks: string[] } {
  const fallbacks: string[] = [];
  const tag = element.tagName.toLowerCase();

  // Strategy 1: Unique ID
  if (element.id && /^[A-Za-z][\w-]*$/.test(element.id)) {
    const idSel = `#${safeEscape(element.id)}`;
    if (isUnique(element, idSel)) {
      return { primary: idSel, fallbacks: [] };
    }
  }

  // Strategy 2: Unique Test ID attributes
  const testAttrs = ['data-testid', 'data-test', 'data-cy', 'data-qa'];
  for (const attr of testAttrs) {
    const val = element.getAttribute(attr);
    if (val) {
      const testSel = `[${attr}="${safeEscape(val)}"]`;
      if (isUnique(element, testSel)) {
        return { primary: testSel, fallbacks };
      }
      fallbacks.push(testSel);
    }
  }

  // Strategy 3: Unique ARIA or Name attributes
  if (element.getAttribute('aria-label')) {
    const ariaSel = `${tag}[aria-label="${safeEscape(element.getAttribute('aria-label')!)}"]`;
    if (isUnique(element, ariaSel)) {
      return { primary: ariaSel, fallbacks };
    }
    fallbacks.push(ariaSel);
  }

  if (element.getAttribute('name')) {
    const nameSel = `${tag}[name="${safeEscape(element.getAttribute('name')!)}"]`;
    if (isUnique(element, nameSel)) {
      return { primary: nameSel, fallbacks };
    }
    fallbacks.push(nameSel);
  }

  // Strategy 4: Unique Class combinations
  if (typeof element.className === 'string' && element.className.trim()) {
    const classes = element.className
      .trim()
      .split(/\s+/)
      .filter((c) => /^[A-Za-z_-][\w-]*$/.test(c) && !c.startsWith('vibe-'));

    if (classes.length > 0) {
      // Single class test
      for (const cls of classes) {
        const clsSel = `${tag}.${safeEscape(cls)}`;
        if (isUnique(element, clsSel)) {
          return { primary: clsSel, fallbacks };
        }
      }

      // Multi-class combination test
      if (classes.length > 1) {
        const multiCls = `${tag}.${classes.map(safeEscape).join('.')}`;
        if (isUnique(element, multiCls)) {
          return { primary: multiCls, fallbacks };
        }
        fallbacks.push(multiCls);
      }
    }
  }

  // Strategy 5: Hierarchical structural path with nth-of-type indexing
  const pathParts: string[] = [];
  let current: HTMLElement | null = element;
  let depth = 0;

  while (current && current !== document.body && current !== document.documentElement && depth < 6) {
    let part = current.tagName.toLowerCase();

    // If an ancestor has a unique ID, anchor and terminate early
    if (current.id && /^[A-Za-z][\w-]*$/.test(current.id)) {
      const ancId = `#${safeEscape(current.id)}`;
      if (document.querySelectorAll(ancId).length === 1) {
        pathParts.unshift(ancId);
        break;
      }
    }

    // Try attaching first valid class for readability
    if (typeof current.className === 'string' && current.className.trim()) {
      const validCls = current.className
        .trim()
        .split(/\s+/)
        .find((c) => /^[A-Za-z_-][\w-]*$/.test(c) && !c.startsWith('vibe-'));
      if (validCls) {
        part += `.${safeEscape(validCls)}`;
      }
    }

    // Compute nth-of-type among siblings
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const sameTagSiblings = siblings.filter((s) => s.tagName === current!.tagName);
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        part += `:nth-of-type(${index})`;
      }
    }

    pathParts.unshift(part);
    current = current.parentElement;
    depth++;
  }

  const structuralPath = pathParts.join(' > ');
  if (isUnique(element, structuralPath)) {
    return { primary: structuralPath, fallbacks };
  }
  fallbacks.push(structuralPath);

  // Strategy 6: Absolute fallback path
  const absoluteParts: string[] = [];
  let node: HTMLElement | null = element;
  while (node && node !== document.documentElement) {
    let segment = node.tagName.toLowerCase();
    if (node.parentElement) {
      const siblings = Array.from(node.parentElement.children);
      const idx = siblings.indexOf(node) + 1;
      segment += `:nth-child(${idx})`;
    }
    absoluteParts.unshift(segment);
    node = node.parentElement;
  }
  const absolutePath = absoluteParts.join(' > ');

  return {
    primary: fallbacks[0] || structuralPath || absolutePath,
    fallbacks: Array.from(new Set([...fallbacks, absolutePath])),
  };
}

import { ElementNameInfo, ElementNameSource, SourceLocation } from './types.js';

/**
 * Resolves element naming following the 12-tier priority waterfall:
 * 1. id (#id)
 * 2. data-testid / data-test / data-cy / data-qa
 * 3. aria-label
 * 4. aria-labelledby
 * 5. label[for]
 * 6. Component name (from source file or data-component)
 * 7. name attribute
 * 8. alt attribute
 * 9. title attribute
 * 10. placeholder attribute
 * 11. First CSS class (.class)
 * 12. Tag name (<tag>)
 */
export function inferElementName(
  element: HTMLElement,
  sourceLocation: SourceLocation | null = null
): ElementNameInfo {
  const getAttr = (name: string): string => (element.getAttribute(name) || '').trim();

  const tag = element.tagName.toLowerCase();
  const id = (element.id || '').trim();
  const isGeneratedId = Boolean(id && (/^(:r[0-9a-zA-Z_]+:|radix-|headlessui-|__next)/.test(id) || /^[0-9]+$/.test(id)));
  const testId = getAttr('data-element-name') || getAttr('data-testid') || getAttr('data-test') || getAttr('data-cy') || getAttr('data-qa');
  const ariaLabel = getAttr('aria-label');
  const ariaLabelledBy = getAttr('aria-labelledby');
  const nameAttr = getAttr('name');
  const alt = getAttr('alt');
  const title = getAttr('title');
  const placeholder = getAttr('placeholder');
  const dataComponent = getAttr('data-component') || getAttr('data-component-name');

  // Derive component name from source location or data-component attribute
  let componentName = dataComponent;
  if (!componentName && sourceLocation?.file) {
    const match = sourceLocation.file.match(/([^/\\]+?)\.(tsx?|jsx?|vue|svelte|astro)$/i);
    if (match && match[1]) {
      componentName = match[1];
    }
  }

  // First CSS class
  let firstClass = '';
  if (typeof element.className === 'string' && element.className.trim()) {
    const classes = element.className.trim().split(/\s+/).filter(c => !c.startsWith('vibe-'));
    if (classes.length > 0) {
      firstClass = classes[0];
    }
  }

  // Resolve aria-labelledby text
  let ariaLabelledByText = '';
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy.split(/\s+/);
    const resolvedTexts: string[] = [];
    for (const refId of ids) {
      const refEl = document.getElementById(refId);
      if (refEl && refEl.textContent) {
        resolvedTexts.push(refEl.textContent.trim());
      }
    }
    ariaLabelledByText = resolvedTexts.join(' ').slice(0, 120);
  }

  // Resolve label[for] text
  let labelText = '';
  if (id) {
    try {
      const labelEl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (labelEl && labelEl.textContent) {
        labelText = labelEl.textContent.trim().slice(0, 120);
      }
    } catch {
      // In case id has special characters not handled
    }
  }

  // Determine primary name and primary source
  let primary = '';
  let primarySource: ElementNameSource = 'tag';

  if (id && !isGeneratedId) {
    primary = `#${id}`;
    primarySource = 'id';
  } else if (testId) {
    primary = testId;
    primarySource = 'data-testid';
  } else if (ariaLabel) {
    primary = ariaLabel;
    primarySource = 'aria-label';
  } else if (ariaLabelledByText) {
    primary = ariaLabelledByText;
    primarySource = 'aria-labelledby';
  } else if (labelText) {
    primary = labelText;
    primarySource = 'label';
  } else if (componentName) {
    primary = `<${componentName} />`;
    primarySource = 'component';
  } else if (nameAttr) {
    primary = nameAttr;
    primarySource = 'name';
  } else if (alt) {
    primary = alt;
    primarySource = 'alt';
  } else if (title) {
    primary = title;
    primarySource = 'title';
  } else if (placeholder) {
    primary = placeholder;
    primarySource = 'placeholder';
  } else if (firstClass) {
    primary = `.${firstClass}`;
    primarySource = 'class';
  } else {
    primary = `<${tag}>`;
    primarySource = 'tag';
  }

  // Short selector summary
  const selectorParts = [tag];
  if (id) selectorParts.push(`#${id}`);
  else if (firstClass) selectorParts.push(`.${firstClass}`);
  if (testId) selectorParts.push(`[data-testid="${testId}"]`);
  const selector = selectorParts.join('');

  return {
    primary,
    primarySource,
    id,
    testId,
    ariaLabel,
    ariaLabelledBy: ariaLabelledByText,
    labelText,
    componentName,
    nameAttr,
    alt,
    title,
    placeholder,
    firstClass,
    tag,
    selector,
  };
}

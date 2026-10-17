import { SourceLocation } from './types.js';

export interface ResolvedSource {
  file: string;
  line: number;
  column?: number;
  componentName?: string;
  framework?: 'react' | 'vue' | 'svelte' | 'next' | 'vite' | 'generic';
  isMapped: boolean;
  unmappedReason?: string;
}

/**
 * Resolves source file location by inspecting element and its closest ancestors
 * for build-time compiler attributes (Vite, Next.js, code-inspector, LocatorJS).
 */
export function resolveSourceLocation(element: HTMLElement | null): ResolvedSource {
  if (!element) {
    return {
      file: '',
      line: 0,
      isMapped: false,
      unmappedReason: 'No element provided',
    };
  }

  let current: HTMLElement | null = element;
  let depth = 0;

  while (current && current !== document.body && current !== document.documentElement && depth < 8) {
    // 1. data-at or data-loc (UI-Inspector / Vite plugin convention: "path/to/File.tsx:line:col")
    const dataAt = current.getAttribute('data-at') || current.getAttribute('data-loc');
    if (dataAt) {
      const parts = dataAt.split(':');
      if (parts.length >= 2) {
        const file = normalizeFilePath(parts[0]);
        const line = parseInt(parts[1], 10) || 1;
        const column = parts[2] ? parseInt(parts[2], 10) : undefined;
        const componentName = extractComponentName(file);
        return {
          file,
          line,
          column,
          componentName,
          framework: detectFramework(file),
          isMapped: true,
        };
      }
    }

    // 2. code-inspector-plugin attributes
    const fileAttr = current.getAttribute('data-inspector-file') || current.getAttribute('data-file');
    const lineAttr = current.getAttribute('data-inspector-line') || current.getAttribute('data-line');
    const colAttr = current.getAttribute('data-inspector-column') || current.getAttribute('data-column');
    if (fileAttr && lineAttr) {
      const file = normalizeFilePath(fileAttr);
      const line = parseInt(lineAttr, 10) || 1;
      const column = colAttr ? parseInt(colAttr, 10) : undefined;
      const componentName = extractComponentName(file);
      return {
        file,
        line,
        column,
        componentName,
        framework: detectFramework(file),
        isMapped: true,
      };
    }

    // 3. LocatorJS data attribute: "path/to/File.tsx::line::col"
    const dataLocator = current.getAttribute('data-locatorjs-id');
    if (dataLocator) {
      const match = dataLocator.match(/^(.*?)::(\d+)(?:::(\d+))?$/);
      if (match) {
        const file = normalizeFilePath(match[1]);
        const line = parseInt(match[2], 10) || 1;
        const column = match[3] ? parseInt(match[3], 10) : undefined;
        const componentName = extractComponentName(file);
        return {
          file,
          line,
          column,
          componentName,
          framework: detectFramework(file),
          isMapped: true,
        };
      }
    }

    // 4. React __source attribute in development JSX transform
    const sourceProp = (current as any).__source as { fileName?: string; lineNumber?: number; columnNumber?: number } | undefined;
    if (sourceProp?.fileName && sourceProp?.lineNumber) {
      const file = normalizeFilePath(sourceProp.fileName);
      return {
        file,
        line: sourceProp.lineNumber,
        column: sourceProp.columnNumber,
        componentName: extractComponentName(file),
        framework: 'react',
        isMapped: true,
      };
    }

    current = current.parentElement;
    depth++;
  }

  return {
    file: '',
    line: 0,
    isMapped: false,
    unmappedReason: 'No build-time source markers detected. Page may be production or uninstrumented.',
  };
}

function normalizeFilePath(rawPath: string): string {
  // Convert Windows backslashes to forward slashes
  let p = rawPath.replace(/\\/g, '/');
  // Strip common build root prefixes if present
  p = p.replace(/^webpack:\/\/\/?/, '');
  p = p.replace(/^\/@fs\//, '');
  return p;
}

function extractComponentName(filePath: string): string {
  const match = filePath.match(/([^/\\]+?)\.(tsx?|jsx?|vue|svelte|astro)$/i);
  return match && match[1] ? match[1] : '';
}

function detectFramework(filePath: string): 'react' | 'vue' | 'svelte' | 'next' | 'vite' | 'generic' {
  if (filePath.endsWith('.vue')) return 'vue';
  if (filePath.endsWith('.svelte')) return 'svelte';
  if (filePath.includes('/app/') || filePath.includes('/pages/')) return 'next';
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) return 'react';
  return 'generic';
}

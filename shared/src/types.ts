/**
 * Source code location mapped from compiler plugins or source maps
 */
export interface SourceLocation {
  file: string;
  line: number;
  column?: number;
}

/**
 * Screen dimensions and position for an inspected element
 */
export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/**
 * Detailed 12-tier identification waterfall resolution
 */
export type ElementNameSource =
  | 'id'
  | 'data-testid'
  | 'aria-label'
  | 'aria-labelledby'
  | 'label'
  | 'component'
  | 'name'
  | 'alt'
  | 'title'
  | 'placeholder'
  | 'class'
  | 'tag';

export interface ElementNameInfo {
  primary: string;
  primarySource: ElementNameSource;
  id: string;
  testId: string;
  ariaLabel: string;
  ariaLabelledBy: string;
  labelText: string;
  componentName: string;
  nameAttr: string;
  alt: string;
  title: string;
  placeholder: string;
  firstClass: string;
  tag: string;
  selector: string;
}

/**
 * Core metadata extracted from an inspected element
 */
export interface ElementInfo {
  tag: string;
  id: string;
  className: string;
  classList: string[];
  textContent: string; // Truncated to 200 chars
  htmlSnippet: string; // Outer HTML truncated to 400 chars
  boundingRect: BoundingRect;
  computedStyles: Record<string, string>;
  sourceLocation: SourceLocation | null;
  parentChain: string[];
  uiTerm: string;
  uiDescription: string;
  elementName: ElementNameInfo;
  selector: string;
  fallbackSelectors: string[];
  pageUrl: string;
  selectedAt: string;
}

/**
 * Internal message types between Extension Side Panel, Background, and Content Script
 */
export type ExtensionMessage =
  | { type: 'START_PICKING' }
  | { type: 'STOP_PICKING' }
  | { type: 'PICKER_STATUS'; active: boolean }
  | { type: 'ELEMENT_HOVERED'; element: Partial<ElementInfo> }
  | { type: 'ELEMENT_SELECTED'; element: ElementInfo }
  | { type: 'HIGHLIGHT_ELEMENT'; selector?: string; dataAt?: string; label?: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'APPLY_LIVE_STYLE'; selector: string; property: string; value: string }
  | { type: 'RESET_LIVE_STYLES'; selector?: string }
  | { type: 'GET_PICKER_STATUS' };

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
 * A recorded CSS style change on an element
 */
export interface StyleDelta {
  selector: string;
  property: string;
  oldValue: string;
  newValue: string;
  timestamp: number;
}

/**
 * Saved visual style preset
 */
export interface StylePreset {
  id: string;
  name: string;
  styles: Record<string, string>;
  createdAt: string;
}

/**
 * Page level metadata
 */
export interface PageInfo {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  timestamp: string;
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
  | { type: 'GET_PICKER_STATUS' }
  | { type: 'GET_PAGE_INFO' }
  | { type: 'CAPTURE_SCREENSHOT' }
  | { type: 'ADD_ANNOTATION'; annotation: { selector: string; comment: string; elementName?: string; tagName?: string; textContent?: string; sourceLocation?: SourceLocation | null; offset?: { x: number; y: number } } }
  | { type: 'RESOLVE_ANNOTATION'; id?: string; index?: number; note?: string }
  | { type: 'REOPEN_ANNOTATION'; id?: string; index?: number }
  | { type: 'DELETE_ANNOTATION'; id?: string; index?: number }
  | { type: 'CLEAR_ALL_ANNOTATIONS' }
  | { type: 'GET_ANNOTATIONS' }
  | { type: 'ANNOTATIONS_UPDATED'; annotations: any[] }
  | { type: 'START_MARQUEE_SELECT' }
  | { type: 'STOP_MARQUEE_SELECT' }
  | { type: 'GROUP_SELECTED'; group: any }
  | { type: 'RUN_A11Y_AUDIT'; selector?: string }
  | { type: 'GET_WEB_VITALS' };

/**
 * Phase 6: Accessibility Audit types
 */
export interface A11yViolationNode {
  html: string;
  target: string[];
  failureSummary?: string;
}

export interface A11yViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yViolationNode[];
}

export interface A11yAuditResult {
  violationsCount: number;
  passesCount: number;
  violations: A11yViolation[];
  timestamp: string;
}

/**
 * Phase 6: Core Web Vitals & Performance types
 */
export interface WebVitalsSummary {
  fcp?: number; // ms
  lcp?: number; // ms
  cls?: number; // score
  ttfb?: number; // ms
  domContentLoaded?: number; // ms
  loadTime?: number; // ms
  url?: string;
}


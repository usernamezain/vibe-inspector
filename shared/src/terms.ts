/**
 * Glossary of standard UI/UX design components and patterns
 */
export const UI_GLOSSARY: Record<string, string> = {
  // Structure & Page Blocks
  Header: 'Top-level page region containing branding, global navigation, and user actions',
  Footer: 'Bottom page region containing legal, contact, and secondary links',
  'Main Content': 'Primary landmark container holding the central content of the view',
  Sidebar: 'Secondary lateral column providing auxiliary navigation or filtering',
  Section: 'Thematic content block grouping related elements',
  Article: 'Self-contained, independent composition (e.g. blog post, card, news item)',
  Divider: 'Visual horizontal or vertical separator establishing hierarchy',

  // Navigation
  Navigation: 'Landmark region containing navigational links',
  'Navigation Bar': 'Primary persistent horizontal or vertical bar for site navigation',
  'Sticky Header': 'Header pinned to the viewport during page scrolling',
  Breadcrumb: 'Hierarchical path indicators showing current location in the site IA',
  Tabs: 'Interface switching between alternate views within the same surface',
  'Tab List': 'Container for interactive tab triggers',
  'Tab Panel': 'Content pane associated with an active tab trigger',
  Pagination: 'Controls for segmenting large data sets into sequential pages',
  Menu: 'List of actionable options or commands',
  'Menu Bar': 'Horizontal collection of top-level command menus',

  // Containers & Cards
  Card: 'Elevated or bordered surface visually grouping related information',
  'Hero Section': 'Prominent introductory banner conveying core value proposition and primary CTA',
  Panel: 'Distinct framed surface containing focused settings, tools, or details',
  Widget: 'Self-contained modular component displaying summary metrics or controls',
  Dashboard: 'High-level multi-panel view aggregating key performance indicators and widgets',
  'Metric Card': 'Compact card displaying a numerical KPI, label, and trend indicators',

  // Interactive Controls
  Button: 'Interactive control triggering an immediate action or workflow',
  'Call to Action': 'High-prominence button or link guiding the primary desired user action',
  Link: 'Navigational hyperlink referencing an internal or external destination',
  Dropdown: 'Collapsible menu presenting multiple choices upon interaction',
  'Toggle Switch': 'Binary on/off control for immediate state changes',
  Checkbox: 'Interactive box allowing multi-selection within a group',
  'Radio Button': 'Mutually exclusive selection control within a set',
  Slider: 'Draggable thumb for selecting a value along a continuous range',
  Search: 'Input combined with query triggers to find content',
  Filter: 'Facet or control for refining displayed data sets',

  // Forms & Inputs
  Form: 'Structured container managing input collection and validation',
  'Input Field': 'Single-line text or value entry box',
  'Text Area': 'Multi-line editable text area for long-form input',
  'Select Dropdown': 'Menu for picking one or more options from a fixed list',
  'Search Input': 'Specialized input field with search semantics',
  'Password Field': 'Masked text entry for credentials',
  'Email Field': 'Input formatted for valid email addresses',
  'Number Field': 'Input constrained to numeric quantities with stepper controls',
  'Date Picker': 'Calendar-driven date or time selector',
  'Color Picker': 'Interactive palette or canvas for picking CSS colors',
  'File Upload': 'Drop-zone or file selector for uploading attachments',
  'Submit Button': 'Form submission trigger initiating data processing',
  'Reset Button': 'Control restoring form inputs to initial defaults',
  Label: 'Descriptive textual caption explicitly linked to an input control',

  // Overlays & Feedback
  Modal: 'Dialog overlay capturing user focus while disabling background interaction',
  Dialog: 'Pop-up window requesting confirmation or focused input',
  Toast: 'Transient non-disruptive feedback notification at viewport edges',
  Alert: 'High-visibility banner communicating system warnings or critical notices',
  Popover: 'Anchored floating card displayed upon clicking an element',
  Tooltip: 'Hover-activated microcopy explaining an icon or control',
  Drawer: 'Off-canvas sheet sliding in from a viewport boundary',
  Overlay: 'Semi-transparent backdrop dimming background content',
  Loader: 'Visual indicator of asynchronous background activity',
  'Skeleton Loader': 'Placeholder wireframe simulating loaded content structure',

  // Media
  Image: 'Static visual content element',
  Icon: 'Graphic glyph conveying symbolic meaning',
  Avatar: 'User or entity profile representation',
  Logo: 'Brand mark or emblem',
  Carousel: 'Horizontally rotating reel of slides or media cards',
  'Video Player': 'Media playback surface for video streams',
  Canvas: 'Scriptable pixel buffer for custom rendering or charts',

  // Layouts
  Container: 'Constrained layout wrapper controlling max-width and margins',
  'Grid Layout': 'Two-dimensional CSS Grid arrangement of items',
  'Flex Container': 'One-dimensional flexbox flow',
  'Stack Layout': 'Vertical sequence of elements with consistent gap spacing',
  'Scrollable Area': 'Overflow-scrollable viewport boundary',
  Block: 'Standard block-level layout element',
};

const TAG_MAP: Record<string, string> = {
  nav: 'Navigation',
  header: 'Header',
  footer: 'Footer',
  main: 'Main Content',
  aside: 'Sidebar',
  section: 'Section',
  article: 'Article',
  form: 'Form',
  table: 'Data Table',
  button: 'Button',
  a: 'Link',
  img: 'Image',
  svg: 'Icon',
  video: 'Video Player',
  canvas: 'Canvas',
  ul: 'List',
  ol: 'Ordered List',
  li: 'List Item',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  p: 'Paragraph',
  label: 'Label',
  dialog: 'Dialog',
  details: 'Accordion',
  progress: 'Progress Bar',
  select: 'Select Dropdown',
  textarea: 'Text Area',
  input: 'Input Field',
};

const ROLE_MAP: Record<string, string> = {
  navigation: 'Navigation',
  banner: 'Header',
  contentinfo: 'Footer',
  search: 'Search',
  dialog: 'Dialog',
  alert: 'Alert',
  tablist: 'Tab List',
  tab: 'Tabs',
  tabpanel: 'Tab Panel',
  menu: 'Menu',
  menubar: 'Menu Bar',
  toolbar: 'Toolbar',
  tooltip: 'Tooltip',
  progressbar: 'Progress Bar',
  slider: 'Slider',
  switch: 'Toggle Switch',
  checkbox: 'Checkbox',
  radio: 'Radio Button',
};

const CLASS_PATTERNS: [RegExp, string][] = [
  [/\bhero\b/i, 'Hero Section'],
  [/\bcard\b/i, 'Card'],
  [/\bmodal\b/i, 'Modal'],
  [/\bdrawer\b/i, 'Drawer'],
  [/\bsidebar\b/i, 'Sidebar'],
  [/\btoolbar\b/i, 'Toolbar'],
  [/\bbadge\b/i, 'Badge'],
  [/\bavatar\b/i, 'Avatar'],
  [/\bchip\b/i, 'Chip'],
  [/\bbreadcrumb\b/i, 'Breadcrumb'],
  [/\bpagination\b/i, 'Pagination'],
  [/\balert\b/i, 'Alert'],
  [/\btoast\b/i, 'Toast'],
  [/\bspinner\b|\bloading\b/i, 'Loader'],
  [/\baccordion\b/i, 'Accordion'],
  [/\btabs?\b/i, 'Tabs'],
  [/\bdropdown\b/i, 'Dropdown'],
  [/\bpopover\b/i, 'Popover'],
  [/\btooltip\b/i, 'Tooltip'],
  [/\bcarousel\b/i, 'Carousel'],
  [/\bnavbar?\b/i, 'Navigation Bar'],
  [/\bcta\b/i, 'Call to Action'],
  [/\bicon\b/i, 'Icon'],
  [/\bbtn\b|\bbutton\b/i, 'Button'],
  [/\bgrid\b/i, 'Grid Layout'],
  [/\bmetric\b|\bkpi\b|\bstat\b/i, 'Metric Card'],
  [/\bchart\b|\bgraph\b/i, 'Chart'],
  [/\bsearch\b/i, 'Search'],
  [/\bfilter\b/i, 'Filter'],
  [/\bpanel\b/i, 'Panel'],
  [/\bdashboard\b/i, 'Dashboard'],
  [/\blogo\b/i, 'Logo'],
];

/**
 * Inactive inference helper determining the UX component term and description
 */
export function inferUITerm(element: HTMLElement): { term: string; description: string } {
  const tag = element.tagName.toLowerCase();
  const cls = (typeof element.className === 'string' ? element.className : '').toLowerCase();
  const role = (element.getAttribute('role') || '').toLowerCase();

  const resolve = (term: string) => ({
    term,
    description: UI_GLOSSARY[term] || `UI component categorized as ${term}`,
  });

  // 1. Specialized input types
  if (tag === 'input') {
    const type = (element.getAttribute('type') || 'text').toLowerCase();
    if (type === 'checkbox') return resolve('Checkbox');
    if (type === 'radio') return resolve('Radio Button');
    if (type === 'range') return resolve('Slider');
    if (type === 'search') return resolve('Search Input');
    if (type === 'password') return resolve('Password Field');
    if (type === 'submit') return resolve('Submit Button');
    if (type === 'file') return resolve('File Upload');
    return resolve('Input Field');
  }

  // 2. Explicit ARIA role
  if (role && ROLE_MAP[role]) {
    return resolve(ROLE_MAP[role]);
  }

  // 3. Class patterns
  for (const [pattern, term] of CLASS_PATTERNS) {
    if (pattern.test(cls)) {
      return resolve(term);
    }
  }

  // 4. Semantic HTML tags
  if (TAG_MAP[tag] && tag !== 'div' && tag !== 'span') {
    return resolve(TAG_MAP[tag]);
  }

  // 5. Layout and computed styles heuristics
  if (tag === 'div' || tag === 'span' || tag === 'section') {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const childCount = element.children.length;
    const borderRadius = parseFloat(computed.borderRadius) || 0;
    const hasShadow = computed.boxShadow && computed.boxShadow !== 'none';

    if ((computed.position === 'sticky' || computed.position === 'fixed') && rect.top < 100) {
      return resolve('Sticky Header');
    }
    if (borderRadius >= 6 && hasShadow) {
      return resolve('Card');
    }
    if (computed.display === 'grid' && childCount > 1) {
      return resolve('Grid Layout');
    }
    if (computed.display === 'flex') {
      if (computed.flexDirection === 'column' && childCount > 2) {
        return resolve('Stack Layout');
      }
      if (childCount > 1) {
        return resolve('Flex Container');
      }
    }
    if (computed.overflowY === 'auto' || computed.overflowY === 'scroll') {
      return resolve('Scrollable Area');
    }
    if (childCount > 0) {
      return resolve('Container');
    }
  }

  return resolve(TAG_MAP[tag] || tag.toUpperCase());
}

/**
 * Renderer-neutral icon names. Headless code (stage meta, panel-kind meta,
 * badges) refers to icons by name; each renderer maps the name to its icon
 * set — the web renderer to `@ant-design/icons`, a native renderer to
 * whatever it ships. The union grows as wave migrations surface more icons.
 */
export type IconName =
  // training-stage badges
  | 'database'
  | 'table'
  | 'arrowRight'
  | 'aim'
  | 'rollback'
  | 'sync'
  | 'partition'
  // panel-kind filter chips
  | 'appstore'
  | 'code'
  | 'dashboard'
  | 'message'
  // update-cycle phase markers
  | 'history'
  | 'checkCircle'
  // live-badge dots (the pulse animation is renderer-owned)
  | 'dotPulse'
  | 'dotHollow'
  // the classic JS square (math-console row buttons)
  | 'js';

# responsive-layout

## ADDED Requirements

### Requirement: Single mobile breakpoint convention
The system SHALL treat viewports at or below 991px wide as mobile, driven by the shared `MOBILE_MAX` token for all JavaScript/TypeScript viewport checks, and SHALL use the same 991px value in CSS media queries that implement mobile behavior.

#### Scenario: JS viewport checks use the shared token
- **WHEN** a component needs to branch on mobile vs desktop in JS/TS
- **THEN** it derives the check from `MOBILE_MAX` (directly or via `useIsMobile()`), not a hard-coded pixel literal

#### Scenario: No off-convention breakpoints
- **WHEN** a stylesheet defines mobile-specific layout rules
- **THEN** the media query threshold is 991px (intermediate desktop steps above 991px are permitted)

### Requirement: No page-level horizontal scroll on mobile
On a mobile viewport (≥320px wide), every route SHALL render without horizontal scrolling of the page body; content wider than the viewport SHALL scroll inside its own container.

#### Scenario: Flow pages fit the viewport
- **WHEN** a training or inference flow page is viewed at 375px width
- **THEN** the page body has no horizontal overflow and any panel wider than the viewport scrolls within the panel

#### Scenario: Compare table scrolls internally
- **WHEN** the `/compare` page is viewed at 375px width
- **THEN** the comparison table scrolls horizontally inside the table container while the rest of the page stays fixed

### Requirement: Mobile navigation drawer
On mobile viewports the navigation menu SHALL render as an overlay drawer that does not displace page content; on desktop viewports the existing collapsible sidebar behavior SHALL be preserved.

#### Scenario: Opening nav on a phone
- **WHEN** the user taps the menu button at ≤991px width
- **THEN** the navigation opens as an overlay above the content, and the content does not reflow

#### Scenario: Drawer closes on navigation
- **WHEN** the user selects a nav item or taps outside the open drawer on mobile
- **THEN** the drawer closes and the selected route (if any) is shown

#### Scenario: Desktop sidebar unchanged
- **WHEN** the viewport is wider than 991px
- **THEN** the sidebar renders inline at 240px, toggling via the menu button or Ctrl+H exactly as before

### Requirement: Viewport-reactive view-setting defaults
When the user has not explicitly chosen a flow arrangement or panel size, the defaults SHALL track the live viewport: `vertical` arrangement and `xs` panel size at ≤991px, `collapsed` arrangement and `m` panel size above. An explicit user choice SHALL persist and override the viewport-derived default.

#### Scenario: Default on a phone
- **WHEN** a user with no saved view-settings preference loads a flow page at ≤991px width
- **THEN** panels render one per row (`vertical`) at `xs` size

#### Scenario: Rotation or resize across the breakpoint
- **WHEN** a user with no saved preference resizes or rotates the viewport across 991px
- **THEN** the arrangement and panel size defaults update to match the new viewport without a reload

#### Scenario: Explicit choice wins
- **WHEN** the user has explicitly selected an arrangement or panel size
- **THEN** that choice is used regardless of viewport width and persists across sessions

### Requirement: Responsive charts
Plotly charts SHALL size themselves to their container width (capped at their configured desktop size) and resize with the viewport, rather than rendering at fixed pixel dimensions.

#### Scenario: Embedding scatter on a phone
- **WHEN** an embedding scatter plot renders in a container narrower than its configured size
- **THEN** the chart fills the container width, remains fully visible without clipping, and re-renders on container resize

#### Scenario: Desktop rendering preserved
- **WHEN** the container is at least as wide as the configured size
- **THEN** the chart renders at its configured size, matching current desktop behavior

### Requirement: Mobile-friendly controls and spacing
On mobile viewports, interactive controls and page padding SHALL adapt to the available width: fixed control widths (selects, sliders, row-heading minimums) SHALL be allowed to shrink or fill the available line, and page-level padding SHALL step down from desktop values.

#### Scenario: Inference controls at phone width
- **WHEN** an inference page's control row renders at 375px width
- **THEN** the controls wrap or shrink to fit without forcing horizontal overflow

#### Scenario: Reduced page padding
- **WHEN** any page renders at ≤991px width
- **THEN** horizontal page padding uses the reduced mobile spacing rather than desktop spacing

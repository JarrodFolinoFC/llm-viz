# Design — Fix Mobile/Responsive Design

## Context

The app is a Vite + React 18 + antd SPA whose layout engine lives in two vendored packages under `lib/` (`mlblocks`, `shared-ui`), aliased in `vite.config.ts`. A responsive foundation already exists:

- Shared breakpoint token `MOBILE_MAX = 991` (`lib/shared-ui/theme/tokens.ts:37`) and hooks `useMediaQuery` / `useIsMobile` (`lib/shared-ui/theme/useMediaQuery.ts`).
- Flow arrangements `stage` / `collapsed` / `vertical`; `ViewSettings.tsx:106-134` already defaults panel size to `xs` and arrangement to `vertical` when `matchMedia('(max-width: 991px)')` matches — but only once, when the cookie is first parsed at mount.
- Phone rules at 991px already exist in `flow.module.css`, `MatrixTable.module.css`, `Panel.module.css`, and the chrome components (`JsNote`, `FloatingDock`, `MathConsole`).
- Viewport meta tag is present in `index.html`.

What was never given a mobile pass: the app shell (sticky header + `Layout.Sider width={240}` that pushes content when open on a phone), the Plotly embedding scatter (fixed px `width`/`height`), the ComparePage antd table (7 columns, no `scroll.x`), the TrigramFlow slices grid (one-off 700px query), and assorted fixed `min-width`/`width` values in inference controls and inline page paddings.

## Goals / Non-Goals

**Goals:**
- Every route is usable on a ~375px-wide phone viewport: no page-level horizontal scroll, tappable nav, readable panels.
- Wide data (matrix tables, compare table, flows in non-vertical arrangements) scrolls inside its own container, never the page body.
- One breakpoint convention (991px, driven by the shared token) across app and libs.
- Desktop behavior is unchanged.

**Non-Goals:**
- No redesign of the visualizations themselves (panel content, chart types, math rendering).
- No touch-gesture work (pinch-zoom on plots, swipe nav).
- No tablet-specific intermediate layouts beyond what the existing 1500px trigram step provides.
- No dependency additions.

## Decisions

### D1: Sidebar becomes an overlay on mobile, keeping `Layout.Sider` on desktop
On viewports ≤991px the nav renders as an antd `Drawer` (left placement, closes on route selection and mask tap); on desktop the existing `Layout.Sider` toggle behavior is kept untouched. Chosen over a single `Sider` with `breakpoint`/`collapsedWidth={0}` props because an open 240px sider on a 375px screen pushes content into a 135px column — an overlay is the only usable open-state on phones. `useIsMobile()` (already exported from `src/theme/index.ts`) selects between the two renders; the `Menu` element is shared so nav items stay defined once in `navigation.tsx`.

### D2: Viewport-reactive view-setting defaults, cookie still wins
`ViewSettings.tsx` currently evaluates `matchMedia` only inside the cookie parser (first mount, no saved cookie). Change: when no explicit user preference cookie exists, arrangement/panel-size track the live media query (via the existing `useMediaQuery` subscription pattern); once the user explicitly sets a value, the cookie is written and the default logic no longer applies. Alternative considered — leaving mount-only evaluation — rejected because rotation and window-resize across the breakpoint are common on tablets/phones, and the current behavior strands users in the wrong arrangement. The `(max-width: 991px)` literal in `ViewSettings.tsx` should be derived from `MOBILE_MAX` rather than repeated.

### D3: Plotly sizes from its container, not props
`EmbeddingScatterPlotly.tsx` drops fixed `width`/`height` in favor of `layout.autosize: true` + `useResizeHandler` + `style={{width:'100%', maxWidth:size, aspectRatio:'1'}}`. The existing `size` prop becomes the desktop cap (preserving current desktop rendering) instead of a hard dimension. Chosen over a ResizeObserver-driven explicit size because react-plotly.js has this built in and it keeps the component simple. The SVG fallback variant already uses `maxWidth` and needs only a width:100% audit.

### D4: Wide tables scroll internally
ComparePage's antd `Table` gets `scroll={{ x: 'max-content' }}`. Matrix panels already scroll internally via the 991px rules in `MatrixTable.module.css`/`flow.module.css`; the audit only verifies and extends those rules where a panel still forces page overflow. No column-hiding or responsive column collapse — the data is the product; scrolling a table is acceptable, scrolling the page is not.

### D5: Standardize on the shared breakpoint, keep CSS media queries in CSS
TrigramFlow's 700px query moves to 991px (the 1500px intermediate step stays). CSS modules keep plain `@media (max-width: 991px)` literals — CSS custom properties can't be used in media conditions, and introducing a build-time preprocessor just for this is not worth it. Instead, the convention is documented in `tokens.ts` next to `MOBILE_MAX`, which remains the single source for all JS/TS checks. Fixed `min-width`/`width` rem values on inference controls (`.select`, `.temperatureSlider`, row-heading min widths) get 991px overrides letting them shrink to content/100%; inline page paddings (`ComparePage`, `LandingPage`) move to token-based values that step down on mobile.

### D6: Storybook mobile viewports as the visual harness
Existing Storybook + `@storybook/addon-vitest` (chromium) is the regression net. Add a mobile viewport (375×667) globalType/parameter and mobile-viewport stories for: the app shell (drawer open/closed), one representative flow page, ComparePage, and the embedding scatter. Arrangement-default logic in `ViewSettings` gets jsdom unit tests with mocked `matchMedia`. No new e2e framework.

## Risks / Trade-offs

- [Plotly `autosize` can render at 0 width when the container is display:none or mid-layout] → keep an explicit `minHeight`, and rely on `useResizeHandler` to correct after first paint; verify in the lazy-loaded path where the fallback swaps in.
- [Making defaults viewport-reactive could surprise a desktop user who narrows their window — flow re-arranges under them] → only applies when no cookie preference exists; any explicit choice pins the arrangement permanently.
- [Drawer + Sider dual-render risks nav drift if items are duplicated] → render one shared `<Menu>` element from the existing `NAV` list; only the container differs.
- [991px is a large "mobile" cutoff — small laptops (e.g. 1024px-wide splits) sit just above it and get desktop layout] → acceptable; it matches the convention already baked into six lib CSS files, and changing the token later is a one-line edit for JS plus a grep for CSS.
- [Vendored `lib/` edits diverge from the upstream monorepo] → per repo convention the libs are vendored-as-source and edited in place; note the change in commit message for future re-syncs.

## Migration Plan

Pure front-end, additive CSS/JSX; ship as one PR. Rollback = revert. The only persisted-state surface is the existing `arrangement`/`panelSize` cookies, whose format does not change.

## Open Questions

- Should the desktop header keep the hamburger toggling the Sider, while mobile hamburger opens the Drawer, with the same Ctrl+H shortcut mapping to whichever is active? (Assumed yes.)
- TrigramFlow at 992–1500px currently shows a 2-column slice grid — keep as-is or align to panel-size steps? (Assumed keep as-is.)

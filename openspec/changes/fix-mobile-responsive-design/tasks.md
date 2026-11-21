# Tasks — Fix Mobile/Responsive Design

## 1. Foundations

- [ ] 1.1 In `lib/mlblocks/web/theme/ViewSettings.tsx`, derive the two inline `(max-width: 991px)` literals from the shared `MOBILE_MAX` token instead of hard-coding
- [ ] 1.2 Make arrangement and panel-size defaults viewport-reactive: when no cookie preference exists, subscribe to the mobile media query so crossing 991px (resize/rotation) flips `vertical`/`xs` ↔ `collapsed`/`m` without a reload; an explicit user choice writes the cookie and pins the value
- [ ] 1.3 Add jsdom unit tests for the default logic with mocked `matchMedia`: phone default, desktop default, resize across the breakpoint, explicit-choice-wins

## 2. App shell (header + navigation)

- [ ] 2.1 In `src/App.tsx`, use `useIsMobile()` to render the nav `Menu` inside an antd `Drawer` (left placement, overlay) on mobile, keeping the existing `Layout.Sider` on desktop; share one `Menu` element built from `NAV`
- [ ] 2.2 Close the drawer on nav item selection and mask tap; keep the header hamburger and Ctrl+H toggling whichever container is active
- [ ] 2.3 Step down header and `Layout.Content` padding at ≤991px in `src/App.module.css`

## 3. Charts

- [ ] 3.1 In `src/components/stages/vector/EmbeddingScatter/EmbeddingScatterPlotly.tsx`, replace fixed `width`/`height` with `layout.autosize` + `useResizeHandler` + `style={{width:'100%', maxWidth:size, aspectRatio:'1'}}`; keep a `minHeight` so the lazy-load swap can't collapse to 0
- [ ] 3.2 Audit the SVG variant and lazy fallback in `EmbeddingScatter/index.tsx` for `width:100%` within the same `maxWidth` cap

## 4. Wide content and controls

- [ ] 4.1 Add `scroll={{ x: 'max-content' }}` to the comparison table in `src/pages/ComparePage.tsx`
- [ ] 4.2 Move `src/components/stages/trigram/TrigramFlow.module.css` off the one-off 700px query onto 991px (keep the 1500px intermediate step)
- [ ] 4.3 Add 991px overrides in `src/components/stages/*/inference.module.css` (and `WeightUpdateWorking` row-heading min width) letting `.select`, `.temperatureSlider`, and similar fixed-width controls shrink or fill the line
- [ ] 4.4 Replace fixed inline paddings/max-widths on `ComparePage.tsx`, `LandingPage.tsx`, and `WhyTwoWeightsPage` with token-based values that step down on mobile

## 5. Page-by-page audit

- [ ] 5.1 Sweep every route in `src/navigation.tsx` at 375px width (dev server + device emulation): verify no page-body horizontal scroll and that wide panels scroll internally; fix stragglers in the relevant `*.module.css` / lib phone rules
- [ ] 5.2 Re-check desktop (≥1200px) on the same routes to confirm no regressions

## 6. Storybook coverage

- [ ] 6.1 Add a 375×667 mobile viewport configuration to `.storybook/preview.tsx`
- [ ] 6.2 Add mobile-viewport stories: app shell (drawer closed/open), one representative flow page, ComparePage, and the embedding scatter
- [ ] 6.3 Run `npm run test`, `npm run lint`, and `npm run typecheck`; fix fallout

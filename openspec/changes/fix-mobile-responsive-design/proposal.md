# Fix Mobile/Responsive Design

## Why

The app is rough on phones: Plotly scatter plots render at fixed pixel sizes, the compare table overflows the viewport, the 240px sidebar pushes content instead of overlaying, several controls have fixed widths that crowd narrow screens, and the trigram page uses a one-off 700px breakpoint instead of the shared 991px `MOBILE_MAX` convention. The flow-arrangement side is already mobile-aware (flows default to `vertical` on phones at first load via `ViewSettings.tsx`), but it only evaluates once at mount and the surrounding shell and page chrome were never given a mobile pass.

## What Changes

- Make the flow arrangement respond to viewport changes after mount (rotation, resize across the 991px line) instead of only at first cookie parse, while preserving any explicit user arrangement choice.
- Make the app shell mobile-friendly: the sidebar becomes an overlay/drawer on mobile (auto-closed by default, closes on navigation) instead of pushing content; header and content padding scale down on small screens.
- Make Plotly embedding scatter plots responsive: replace fixed `width`/`height` px with container-driven sizing (`autosize` + `useResizeHandler`), capped by the current size on desktop.
- Make wide tabular content scrollable rather than overflowing: add horizontal scroll to the ComparePage antd table and audit matrix panels for internal scroll on phones.
- Standardize breakpoints: move the TrigramFlow slices grid off its one-off 700px query onto the shared 991px convention (keeping the intermediate 1500px step if useful) and drive it from the shared token.
- Audit and relax fixed `min-width`/`width` values that crowd narrow screens (inference controls, temperature slider, row-heading min widths, fixed inline paddings on Landing/Compare/WhyTwoWeights pages).

## Capabilities

### New Capabilities
- `responsive-layout`: How the app behaves on small viewports — the mobile breakpoint contract (≤991px), app shell (header, drawer-style sidebar, content padding), flow arrangement defaulting to vertical on mobile, responsive charts, and horizontally scrollable wide content across all pages.

### Modified Capabilities

<!-- none — openspec/specs/ is empty; no existing specs to modify -->

## Impact

- **App shell**: `src/App.tsx`, `src/App.module.css` (sidebar/drawer behavior, header, padding).
- **Vendored libs** (`lib/`, aliased in `vite.config.ts`):
  - `lib/mlblocks/web/theme/ViewSettings.tsx` — arrangement/panel-size defaults react to viewport changes after mount.
  - `lib/mlblocks/web/primitives/*.module.css`, `lib/shared-ui/Panel/Panel.module.css` — existing 991px rules may need extension.
- **Pages/components**: `src/pages/ComparePage.tsx` (table scroll, padding), `src/pages/LandingPage.tsx`, `src/pages/WhyTwoWeightsPage*`, `src/components/stages/trigram/TrigramFlow.module.css` (breakpoint standardization), `src/components/stages/vector/EmbeddingScatter/EmbeddingScatterPlotly.tsx` and `index.tsx` (responsive sizing), `src/components/stages/*/inference.module.css` (fixed widths).
- **Tests/tooling**: Storybook stories (39 existing) are the visual harness — add mobile-viewport coverage for the app shell and one representative flow; vitest jsdom tests for arrangement-selection logic.
- **No dependency changes**; no breaking changes — desktop behavior is preserved.

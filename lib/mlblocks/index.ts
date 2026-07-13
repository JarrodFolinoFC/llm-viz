// mlblocks (root) — the web renderer adapter, built on shared-ui/antd/DOM.
// Re-exports the headless layer so web consumers import one name; the
// platform-free entries stay importable directly as `mlblocks/core` and
// `mlblocks/react`. A future `mlblocks/native` entry will provide the same
// primitives contract over React Native views.
// './react/index' (not './react'): the emitted dist/index.d.ts sits beside the
// react.js ENTRY FILE, and TS resolves a relative './react' to that file (then
// finds no react.d.ts and silently drops the whole subtree as untyped) instead
// of falling through to react/index.d.ts. The explicit path sidesteps the trap.
export * from './react/index';
export * from './web/MLBlocksProvider';
export * from './web/primitives';
export * from './web/primitives/resolveSty';
export * from './web/theme/ViewSettings';
export * from './web/lib/cookie';
export * from './web/lib/useCookieState';
export * from './web/lib/urlState';
export * from './web/lib/useCorpusTrainer';
export * from './web/lib/jsSandbox';
export * from './web/lib/prism';
export * from './web/pinnedPanels';
export * from './web/flow/FlowRenderer';
export * from './web/flow/StageSelect';
export * from './web/flow/useStageFilter';
export * from './web/flow/stageFilterCookie';
export * from './web/flow/pageSetFilter';
export * from './web/flow/paramFilter';
export * from './web/flow/kindFilter';
export * from './web/stepBinding';
export * from './web/webOnly/MathConsole';
export * from './web/webOnly/FloatingDock';
export * from './web/webOnly/JsNote';
export * from './web/webOnly/MermaidDiagram';
export * from './web/webOnly/FlowWithChart';
export * from './web/webOnly/FlowChartPanel';
export * from './web/webOnly/StageShell';
export * from './web/webOnly/JsIcon';
export * from './web/ViewSettingsSection';
export * from './web/TokenChipColors';

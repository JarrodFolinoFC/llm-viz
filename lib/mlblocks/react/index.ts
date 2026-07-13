// mlblocks/react — the renderer-agnostic React layer: hooks, headless
// components, and the primitives contract. No react-dom, no DOM globals, no
// antd/shared-ui — a React Native renderer must be able to consume this entry
// unchanged.
// The stage vocabulary rides along: flow specs (the layer's main artifact)
// are written against it, so the react entry re-exports it from core.
export { TrainingStage } from '../core/stage';
export * from './settings';
export * from './viewOptions';
export * from './useStepTrainer';
export * from './viewModel';
export * from './primitives/tokens';
export * from './primitives/icons';
export * from './primitives/types';
export * from './primitives/context';
export * from './components/textStyles';
export * from './components/FormulaDisplay';
export * from './components/NumericCell';
export * from './components/Term';
export * from './components/PhaseTag';
export * from './components/SymbolTitle';
export * from './components/TokenChip';
export * from './components/LiveBadge';
export * from './components/WeightSparkline';
export * from './primitives/matrixTable';
export * from './components/Grid';
export * from './components/Panel';
export * from './components/StackedCell';
export * from './components/VectorCell';
export * from './flow/stageMeta';
export * from './flow/panelKinds';
export * from './flow/paramTensor';
export * from './flow/lossSlot';
export * from './flow/flowChart';
export * from './flow/spec';
export * from './flow/specJson';
export * from './flow/mathConsole';
export * from './lib/snippets';
export * from './lib/cssVars';
export * from './lib/flashStyles';
export * from './flow/signedCell';
export * from './components/JsRowButton';
export * from './components/MatrixPanel';
export * from './components/VectorPanel';
export * from './components/PreviousSoftmax';
export * from './components/EmbeddingMatrix';
export * from './components/GradientColumn';
export * from './components/ColumnGrid';
export * from './components/ParamLegend';
export * from './components/TrainingCorpus';
export * from './components/ConceptNote';
export * from './components/DialsNote';
export * from './flow/dialsBind';
export * from './components/OneStepTrainer';
export * from './components/TrainingLoss';
export * from './flow/stageMetrics';
export * from './components/RowSoftmax';
export * from './components/HiddenPreActivation';
export * from './components/FlowBody';
export * from './flow/packRows';
export * from './flow/panelProps';

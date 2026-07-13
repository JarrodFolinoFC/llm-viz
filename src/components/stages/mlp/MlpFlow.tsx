import { space } from '../../../theme';
import { ConceptNote } from 'mlblocks';
import { JsNote } from 'mlblocks';
import { DialsNote } from 'mlblocks';
import { MLP_CONCEPT_NOTES, type ConceptNoteSpec } from './mlpConceptNotes';
import { MLP_JS_NOTES, type JsNoteSpec } from './mlpJsNotes';
import { MLP_DIAL_NOTES, type DialsSpec } from './mlpDialNotes';
import { W1Matrix } from './W1Matrix';
import styles from './MlpFlow.module.css';
import { EmbeddingMatrix } from 'mlblocks';
import { EmbUpdateWorking } from './EmbUpdateWorking';
import { WeightUpdateWorking } from './WeightUpdateWorking';
import { BiasUpdateWorking } from './BiasUpdateWorking';
import { GradientColumn } from 'mlblocks';
import { HiddenPreActivation } from 'mlblocks';
import { MatrixPanel } from 'mlblocks';
import { TrainingStage } from 'mlblocks';
import { RowSoftmax } from 'mlblocks';
import { TrainingCorpus } from 'mlblocks';
import { VectorPanel } from 'mlblocks';
import { flow, specFromJson, type FlowNode, type FlowSpec } from 'mlblocks';
import { type ParamTensor } from 'mlblocks';
import { ParamLegend } from 'mlblocks';
import { FlowWithChart } from 'mlblocks';
import { buildMlpFlowChart } from './mlpFlowChart';
import type { MlpViewModel } from './MlpViewModel';
import defaultLayout from './mlpFlow.spec.json';
import scalarLayout from './mlpScalarFlow.spec.json';

const { flex, panel } = flow<MlpViewModel>();

// ── The panels, one const each, shared by both layouts below ──
// Every bind is a view-model getter (see MlpViewModel); the spec only names
// panels, tags them and arranges them.

const corpusPanel = panel(TrainingStage.Data, TrainingCorpus, (vm) => vm.corpusPanel);
const ePanel = panel(TrainingStage.Parameters, EmbeddingMatrix, (vm) => vm.ePanel, { tensors: ['E'] });
// W₁ renders through its own wrapper: the "W₁ rows" view setting switches it
// between the raw slot rows and the derived every-word view (E[w]·W₁ per slot).
const w1Panel = panel(TrainingStage.Parameters, W1Matrix, (vm) => vm.w1Panel, { tensors: ['W1'] });
const b1Panel = panel(TrainingStage.Parameters, VectorPanel, (vm) => vm.b1Panel, { tensors: ['b1'] });
const w2Panel = panel(TrainingStage.Parameters, MatrixPanel, (vm) => vm.w2Panel, { tensors: ['W2'] });
const b2Panel = panel(TrainingStage.Parameters, VectorPanel, (vm) => vm.b2Panel, { tensors: ['b2'] });

const preActivationPanel = panel(TrainingStage.Forward, HiddenPreActivation, (vm) => vm.preActivationPanel,
  { tensors: ['E', 'W1', 'b1'] });
const softmaxPanel = panel(TrainingStage.Forward, RowSoftmax, (vm) => vm.softmaxPanel,
  { tensors: ['W2', 'b2'] });

const gradientPanel = panel(TrainingStage.Backprop, GradientColumn, (vm) => vm.gradientPanel,
  { tensors: ['W2', 'b2'] });
const dW2Panel = panel(TrainingStage.Backprop, MatrixPanel, (vm) => vm.dW2Panel, { tensors: ['W2'] });
const dz1Panel = panel(TrainingStage.Backprop, VectorPanel, (vm) => vm.dz1Panel, { tensors: ['W1', 'b1'] });
const dW1Panel = panel(TrainingStage.Backprop, MatrixPanel, (vm) => vm.dW1Panel, { tensors: ['W1'] });
const dEPanel = panel(TrainingStage.Backprop, EmbeddingMatrix, (vm) => vm.dEPanel, { tensors: ['E'] });

const w1AfterPanel = panel(TrainingStage.Update, MatrixPanel, (vm) => vm.w1AfterPanel, { tensors: ['W1'] });
const b1AfterPanel = panel(TrainingStage.Update, VectorPanel, (vm) => vm.b1AfterPanel, { tensors: ['b1'] });
const w2AfterPanel = panel(TrainingStage.Update, MatrixPanel, (vm) => vm.w2AfterPanel, { tensors: ['W2'] });
const b2AfterPanel = panel(TrainingStage.Update, VectorPanel, (vm) => vm.b2AfterPanel, { tensors: ['b2'] });
const eAfterPanel = panel(TrainingStage.Update, EmbeddingMatrix, (vm) => vm.eAfterPanel, { tensors: ['E'] });
// The update panels, worked out — scalar stage only, so they ride their own
// spanRow in buildMlpScalarFlowSpec.
const embWorkingPanel = panel(TrainingStage.Update, EmbUpdateWorking, (vm) => vm.embWorkingPanel, { tensors: ['E'] });
const w1WorkingPanel = panel(TrainingStage.Update, WeightUpdateWorking, (vm) => vm.w1WorkingPanel, { tensors: ['W1'] });
const b1WorkingPanel = panel(TrainingStage.Update, BiasUpdateWorking, (vm) => vm.b1WorkingPanel, { tensors: ['b1'] });
const w2WorkingPanel = panel(TrainingStage.Update, WeightUpdateWorking, (vm) => vm.w2WorkingPanel, { tensors: ['W2'] });
const b2WorkingPanel = panel(TrainingStage.Update, BiasUpdateWorking, (vm) => vm.b2WorkingPanel, { tensors: ['b2'] });

// ── Companion panels (scalar stage only, gated by the page's Panels filter) ──
// Each companion is a panel node tagged with the stage of the panel it explains
// (so it rides that panel's accent and the same StageSelect filter) plus a
// panel *kind* ('plainEnglish' / 'js') that the Panels group of the page filter
// keys off — only the standard panels are shown by default. Their bodies read
// the live view, so each note narrates the exact numbers beside it.
const notePanel = (note: ConceptNoteSpec, tensors: readonly string[] = []) =>
  panel(note.stage, ConceptNote, (vm) => ({ title: note.title, text: note.text(vm) }), { kind: 'plainEnglish', tensors });
const jsPanel = (note: JsNoteSpec, tensors: readonly string[] = []) =>
  panel(note.stage, JsNote, (vm) => ({ title: note.title, code: note.code(vm) }), { kind: 'js', tensors });
const dialsPanel = (spec: DialsSpec, tensors: readonly string[] = []) =>
  panel(spec.stage, DialsNote, (vm) => ({ symbol: spec.symbol, stage: spec.stage, step: vm.step, dimmed: vm.dimmed, ...spec.data(vm) }), { kind: 'dials', tensors });

/**
 * Stack a data panel with its companions in one column — plain English on top,
 * then the panel, then the JS — as one cell / column track, so the grouping
 * survives both the flex rows and the column-aligned grid rows. When the Panels
 * filter leaves more than one of them visible, the stack frames itself with a
 * subtle border (a `:has` rule on {@link styles.companionStack}); a lone panel
 * renders unframed, exactly as before.
 */
const stacked = (...children: FlowSpec<MlpViewModel>[]) =>
  flex({ vertical: true, gap: 'sm', align: 'stretch', className: styles.companionStack }, ...children);

/**
 * The JSON specs' annotate builder: wrap a panel with its note companions by
 * key — the same key indexes MLP_CONCEPT_NOTES, MLP_JS_NOTES and (with
 * `dials`) MLP_DIAL_NOTES. The companions inherit the target panel's parameter
 * tensors, so the parameter filter drops a panel and its notes together.
 * Unknown keys throw at module load (spec typos fail tests, not renders).
 */
const annotate = (target: FlowNode<MlpViewModel>, key: string, dials?: boolean) => {
  const note = (MLP_CONCEPT_NOTES as Record<string, ConceptNoteSpec>)[key];
  const js = (MLP_JS_NOTES as Record<string, JsNoteSpec>)[key];
  if (!note || !js) throw new Error(`mlp spec: unknown note key "${key}"`);
  const tensors = target.kind === 'panel' ? target.tensors : [];
  const parts = [notePanel(note, tensors), target, jsPanel(js, tensors)];
  if (dials) {
    const d = (MLP_DIAL_NOTES as Record<string, DialsSpec>)[key];
    if (!d) throw new Error(`mlp spec: no dials note for key "${key}"`);
    parts.push(dialsPanel(d, tensors));
  }
  return stacked(...parts);
};

const registry = {
  nodes: {
    corpusPanel, ePanel, w1Panel, b1Panel, w2Panel, b2Panel,
    preActivationPanel, softmaxPanel,
    gradientPanel, dW2Panel, dz1Panel, dW1Panel, dEPanel,
    eAfterPanel, w1AfterPanel, b1AfterPanel, w2AfterPanel, b2AfterPanel,
    embWorkingPanel, w1WorkingPanel, b1WorkingPanel, w2WorkingPanel, b2WorkingPanel,
  },
  annotate,
  spaces: { lg: space.lg, sm: space.sm },
};

/** The Bengio MLP pipeline's ARRANGEMENT lives in mlpFlow.spec.json:
 *  weights → forward → backprop → update. */
export const mlpFlowSpec: FlowSpec<MlpViewModel> = specFromJson(defaultLayout, registry);

/**
 * The scalar-stage layout lives in mlpScalarFlow.spec.json: the corpus + loss
 * row, then the pre-update weights, the forward pass, the backprop chain, the
 * worked updates, and the post-step weights. The weights and update rows are
 * grid rows sharing one column track per tensor — each post-step panel sits
 * exactly under its pre-update counterpart — and every key panel is wrapped in
 * `annotate` companions (plain-English + JS + dials), hidden or shown by the
 * page filter's Panels group. Built once — the Panels filter does the hiding.
 */
export const mlpScalarFlowSpec: FlowSpec<MlpViewModel> = specFromJson(scalarLayout, registry);

export type MlpFlowLayout = 'default' | 'stacked';

/** The model's learnable parameters, in pipeline order — named in the scalar
 *  stage's sub-heading legend. */
const MLP_PARAMS: ParamTensor[] = ['E', 'W1', 'b1', 'W2', 'b2'];

export function MlpFlow({ trainer, layout = 'default' }: { trainer: MlpViewModel; layout?: MlpFlowLayout }) {
  const spec = layout === 'stacked' ? mlpScalarFlowSpec : mlpFlowSpec;
  return (
    <>
      {layout === 'stacked' && <ParamLegend tensors={MLP_PARAMS} />}
      <FlowWithChart spec={spec} view={trainer} buildChart={buildMlpFlowChart} />
    </>
  );
}

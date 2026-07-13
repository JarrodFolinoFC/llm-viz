import { useMemo } from 'react';

import { TrainingStage } from '../../core/stage';
import { FlowBody } from '../../react/components/FlowBody';
import { useLossSlot } from '../../react/flow/lossSlot';
import {
  panelKindsInSpec,
  stagesInSpec,
  tensorsInSpec,
  type FlowSpec,
} from '../../react/flow/spec';
import { DEFAULT_HIDDEN_KINDS, type PanelKind } from '../../react/flow/panelKinds';
import { StageSelect } from './StageSelect';
import { useStageFilter } from './useStageFilter';
import { usePanelKindFilter } from './kindFilter';
import { usePanelTensorFilter } from './paramFilter';

/** Shared empty tensor set for the filter-inactive default. */
const EMPTY_TENSORS: ReadonlySet<string> = new Set();

export interface FlowRendererProps<V> {
  spec: FlowSpec<V>;
  view: V;
  /**
   * Controlled hidden-stage set — passed by FlowWithChart, which owns the
   * filter (and its StageSelect UI) so the chart shares it. Omit to let the
   * renderer own a per-page persisted filter with its own StageSelect — the
   * mode for flows without an overview chart (e.g. the vector stage).
   */
  hidden?: ReadonlySet<TrainingStage>;
  /** Controlled hidden-kind set, paired with `hidden`. */
  hiddenKinds?: ReadonlySet<PanelKind>;
  /** Controlled hidden-tensor set, paired with `hidden`. */
  hiddenTensors?: ReadonlySet<string>;
}

/**
 * The web flow renderer. Controlled (`hidden` passed) it delegates straight to
 * the headless {@link FlowBody}; uncontrolled it owns the per-page persisted
 * filters (cookie + ?hide= URL) and tops the flow with its StageSelect —
 * filter persistence and UI are web chrome, which is why this wrapper lives in
 * the web layer while the renderer itself is headless.
 */
export function FlowRenderer<V>({ spec, view, hidden, hiddenKinds, hiddenTensors }: FlowRendererProps<V>) {
  return hidden ? (
    <FlowBody
      spec={spec}
      view={view}
      hidden={hidden}
      hiddenKinds={hiddenKinds ?? DEFAULT_HIDDEN_KINDS}
      hiddenTensors={hiddenTensors ?? EMPTY_TENSORS}
    />
  ) : (
    <SelfFilteredFlow spec={spec} view={view} />
  );
}

/** Uncontrolled mode: the renderer owns a per-page persisted stage filter. */
export function SelfFilteredFlow<V>({ spec, view }: { spec: FlowSpec<V>; view: V }) {
  const loss = useLossSlot();
  // The Training-loss panel (if any) joins the spec's stages in the filter. A
  // spec may position it itself with a lossSlot node; otherwise it's the flow's
  // bottom stage, rendered after the pipeline.
  const stages = useMemo(() => {
    const s = stagesInSpec(spec);
    if (!loss) return s.filter((st) => st !== TrainingStage.Loss);
    return s.includes(TrainingStage.Loss) ? s : [...s, TrainingStage.Loss];
  }, [spec, loss]);
  const { hidden, toggle, showAll, hideAll } = useStageFilter(stages);
  const kinds = useMemo(() => panelKindsInSpec(spec), [spec]);
  const { hiddenKinds, toggleKind } = usePanelKindFilter();
  const tensors = useMemo(() => tensorsInSpec(spec), [spec]);
  const { hiddenTensors, toggleTensor, showAllTensors, hideAllTensors } = usePanelTensorFilter(tensors);

  return (
    <>
      <StageSelect
        stages={stages}
        hidden={hidden}
        onToggle={toggle}
        onShowAll={showAll}
        onHideAll={hideAll}
        kinds={kinds}
        hiddenKinds={hiddenKinds}
        onToggleKind={toggleKind}
        tensors={tensors}
        hiddenTensors={hiddenTensors}
        onToggleTensor={toggleTensor}
        onShowAllTensors={showAllTensors}
        onHideAllTensors={hideAllTensors}
      />
      <FlowBody spec={spec} view={view} hidden={hidden} hiddenKinds={hiddenKinds} hiddenTensors={hiddenTensors} />
    </>
  );
}

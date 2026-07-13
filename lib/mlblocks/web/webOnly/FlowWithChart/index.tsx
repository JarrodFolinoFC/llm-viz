import { useMemo } from 'react';

import { useViewSettings } from '../../theme/ViewSettings';
import { TrainingStage } from '../../../core/stage';
import { FlowRenderer } from '../../flow/FlowRenderer';
import { panelKindsInSpec, stagesInSpec, tensorsInSpec, type FlowSpec } from '../../../react/flow/spec';
import { FlowChartPanel } from '../FlowChartPanel';
import { StageSelect } from '../../flow/StageSelect';
import { useLossSlot } from '../../../react/flow/lossSlot';
import { useStageFilter } from '../../flow/useStageFilter';
import { usePanelKindFilter } from '../../flow/kindFilter';
import { usePanelTensorFilter } from '../../flow/paramFilter';

interface FlowWithChartProps<V extends { step: number }> {
  spec: FlowSpec<V>;
  view: V;
  /** Build this flow's mermaid chart from the current view + the hidden-stage filter. */
  buildChart: (view: V, hidden: ReadonlySet<TrainingStage>, precision: number) => string;
}

/**
 * A flow rendered with a mermaid overview chart. The StageSelect sits on top of
 * the chart and drives both it and the FlowRenderer panels (one shared filter,
 * including an Overview toggle for the chart itself). The hidden-stage set is
 * remembered per page in a cookie.
 */
export function FlowWithChart<V extends { step: number }>({ spec, view, buildChart }: FlowWithChartProps<V>) {
  const { precision } = useViewSettings();
  const loss = useLossSlot();

  // Overview (the chart) plus the stages this spec contains. The Training loss
  // joins as the pipeline's bottom stage unless the spec already places it via
  // a lossSlot node (stagesInSpec then includes it) — same rule as FlowRenderer.
  const stages = useMemo(() => {
    const s = [TrainingStage.Overview, ...stagesInSpec(spec)];
    if (!loss) return s.filter((st) => st !== TrainingStage.Loss);
    return s.includes(TrainingStage.Loss) ? s : [...s, TrainingStage.Loss];
  }, [spec, loss]);
  const { hidden, toggle, showAll, hideAll } = useStageFilter(stages);
  const kinds = useMemo(() => panelKindsInSpec(spec), [spec]);
  const { hiddenKinds, toggleKind } = usePanelKindFilter();
  const tensors = useMemo(() => tensorsInSpec(spec), [spec]);
  const { hiddenTensors, toggleTensor, showAllTensors, hideAllTensors } = usePanelTensorFilter(tensors);

  const chart = useMemo(() => buildChart(view, hidden, precision), [buildChart, view, hidden, precision]);

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
      {/* The overview chart is shared context (no single tensor), so it hides
          once any parameter is deselected — same rule as the corpus/loss. */}
      {!hidden.has(TrainingStage.Overview) && hiddenTensors.size === 0 && (
        <FlowChartPanel chart={chart} step={view.step} />
      )}
      <FlowRenderer spec={spec} view={view} hidden={hidden} hiddenKinds={hiddenKinds} hiddenTensors={hiddenTensors} />
    </>
  );
}

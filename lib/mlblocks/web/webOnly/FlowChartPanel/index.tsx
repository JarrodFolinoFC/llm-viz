import { TrainingStage } from '../../../core/stage';
import { Panel } from '../../../react/components/Panel';
import { textStyles } from '../../../react/components/textStyles';
import { webPrimitives } from '../../primitives';
import { MermaidDiagram } from '../MermaidDiagram';

const { Text } = webPrimitives;

/**
 * The "Overview" panel: a mermaid flow chart of a whole pipeline. Badged as the
 * Overview stage; shows a hint instead of the diagram when every stage is hidden.
 */
export function FlowChartPanel({ chart, step }: { chart: string; step: number }) {
  return (
    <Panel title="Flow chart" stage={TrainingStage.Overview} step={step} dimmed={false} size="l">
      {chart ? (
        <MermaidDiagram chart={chart} />
      ) : (
        <Text sty={textStyles.hint}>All stages hidden — enable one to see the flow.</Text>
      )}
    </Panel>
  );
}

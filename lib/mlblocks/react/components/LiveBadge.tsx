import type { TrainingStage } from '../../core/stage';
import { useP } from '../primitives/context';
import { STAGE_META } from '../flow/stageMeta';

export interface LiveBadgeProps {
  step?: number;
  /** The panel's values are still the untouched random init — e.g. the weight
   *  panels at step 1, which replay the step on the pre-update weights. Turns
   *  the live dot purple so "live" isn't mistaken for "trained". */
  randomInit?: boolean;
  /** The training phase this panel belongs to — shown as its stage icon. */
  stage?: TrainingStage;
}

export function LiveBadge({ step, randomInit = false, stage }: LiveBadgeProps = {}) {
  const P = useP();
  const meta = stage ? STAGE_META[stage] : null;
  const stageIcon = meta ? (
    <P.Tip content={`${meta.label} stage`}>
      <P.View inline align="center">
        <P.Icon name={meta.icon} color={{ raw: meta.color }} />
      </P.View>
    </P.Tip>
  ) : null;

  if (step === 0) {
    return (
      <P.Tip content="Not trained yet — take a step">
        <P.View inline align="center" gap={5} sty={{ mr: 7 }}>
          <P.Icon name="dotHollow" />
          {stageIcon}
        </P.View>
      </P.Tip>
    );
  }

  return (
    <P.Tip
      content={
        randomInit
          ? 'Updates live each training step — but these values are still the random init (the step replays on the pre-update weights)'
          : 'Updates live each training step'
      }
    >
      <P.View
        inline
        align="center"
        gap={5}
        sty={{ mr: 7, fontRem: 0.7, color: randomInit ? 'randomInit' : 'positive' }}
      >
        <P.Icon name="dotPulse" />
        <P.Text>{step}</P.Text>
        {stageIcon}
      </P.View>
    </P.Tip>
  );
}

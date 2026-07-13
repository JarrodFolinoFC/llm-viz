import { Panel } from 'shared-ui';

import { useViewSettings } from '../../../../theme';
import { TokenChip } from 'mlblocks';
import styles from '../inference.module.css';

interface PredictionProps {
  vocab: readonly string[];
  current: number;
  predicted: number;
  /** Probability of the predicted token (the argmax's softmax value). */
  prob: number;
}

/**
 * The decode step: greedy decoding takes the argmax of the probability column —
 * the single most likely next token — and emits it.
 */
export function Prediction({ vocab, current, predicted, prob }: PredictionProps) {
  const { precision } = useViewSettings();
  return (
    <Panel title="argmax → next token">
      <div className={styles.result}>
        <TokenChip text={vocab[current]} isPrev />
        <span className={styles.arrow}>→</span>
        <TokenChip text={vocab[predicted]} />
        <span className={styles.prob}>p = {prob.toFixed(precision)}</span>
      </div>
      <p className={styles.caption}>
        Greedy decoding always takes the highest-probability token. Real models sample from the
        distribution instead, for variety.
      </p>
    </Panel>
  );
}

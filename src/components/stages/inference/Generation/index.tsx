import { Panel } from 'shared-ui';

import { TokenChip } from 'mlblocks';
import type { DecodeMode } from '../decoding';
import styles from '../inference.module.css';

interface GenerationProps {
  vocab: readonly string[];
  /** The decoded sequence of token ids, starting from the chosen context. */
  seq: number[];
  /** How each next token was chosen — names the panel honestly. */
  mode?: DecodeMode;
}

/**
 * Autoregressive generation: feed each prediction back in as the next current
 * token and repeat, from the chosen token until a period (or the cap).
 */
export function Generation({ vocab, seq, mode = 'greedy' }: GenerationProps) {
  return (
    <Panel title={mode === 'greedy' ? 'Greedy generation' : 'Sampled generation'}>
      <div className={styles.chain}>
        {seq.map((t, i) => (
          <span key={i} className={styles.item}>
            {i > 0 && <span className={styles.arrow}>→</span>}
            <TokenChip text={vocab[t]} isPrev={i === 0} />
          </span>
        ))}
      </div>
      <p className={styles.caption}>
        {mode === 'greedy'
          ? 'Greedy decoding always takes the highest-probability token, so short models settle into loops. Switch to sampling (and raise the temperature) for variety.'
          : 'Each next token is drawn from the temperature-scaled distribution — hit resample to re-roll the chain. This is what nanoGPT’s sample.py does.'}
      </p>
    </Panel>
  );
}

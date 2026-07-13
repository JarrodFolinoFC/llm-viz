import { useMemo, useState, type ReactNode } from 'react';
import { Flex, Select } from 'antd';

import { Softmax } from './Softmax';
import { Prediction } from './Prediction';
import { Generation } from './Generation';
import { DecodingControls } from './DecodingControls';
import { type Decoding } from './decoding';
import { InferenceViewModel } from './InferenceViewModel';
import { useDecoding } from './useDecoding';
import styles from './inference.module.css';

type SetDecoding = ReturnType<typeof useDecoding>[1];

/** The read-only inference pass every stage shares: the decode state, the
 *  temperature→softmax→argmax readout, and the generation chain. */
export interface InferenceState {
  /** The N-token context (a single token for the bigram/vector stages, N=1). */
  context: number[];
  setContext: (ctx: number[]) => void;
  /** The current (last-context) token — what the panels highlight. */
  current: number;
  /** The greedy next-token pick. */
  predicted: number;
  /** Temperature-scaled next-token distribution. */
  probs: number[];
  /** `[logit, eˣ, prob]` per next-token slot — for the shared Softmax panel. */
  softmaxRows: number[][];
  /** The generated continuation (greedy or sampled). */
  seq: number[];
  decoding: Decoding;
  setDecoding: SetDecoding;
}

/**
 * The shared inference pass, parameterised only by the (memoised) model and a
 * pure `logitsFor(model, context)`. Owns the context + decoding state — the
 * interaction half — and hands the derivation to an {@link InferenceViewModel}
 * (one immutable instance per (model, context, decoding)), so each stage's
 * screen only builds its model and its own panels, never re-derives the
 * decode path.
 *
 * Keep `logitsFor` a module-level (stable) function: the view-model memo keys
 * on `model`, so a fresh checkpoint re-generates while a mere re-render doesn't.
 */
export function useInference<M>(
  vocab: readonly string[],
  model: M,
  logitsFor: (model: M, context: number[]) => number[],
  initialContext: number[],
): InferenceState {
  const [context, setContext] = useState(() => initialContext);
  const [decoding, setDecoding] = useDecoding();

  const vm = useMemo(
    () => new InferenceViewModel(vocab, model, logitsFor, context, decoding),
    [vocab, model, logitsFor, context, decoding],
  );

  return {
    context, setContext,
    current: vm.current, predicted: vm.predicted, probs: vm.probs,
    softmaxRows: vm.softmaxRows, seq: vm.seq,
    decoding, setDecoding,
  };
}

interface InferenceShellProps {
  vocab: readonly string[];
  inference: InferenceState;
  /** The context-selector label — "Current token" (single) or "Context" (N). */
  contextLabel?: string;
  /** Softmax panel's logit-column label; string form of the score expression. */
  logitLabel: string;
  /** Optional Softmax panel subtitle. */
  softmaxSubtitle?: ReactNode;
  /** The stage's own panels, rendered left of the shared Softmax → Prediction. */
  children: ReactNode;
}

/**
 * The layout every inference screen shares: the context selector + decoding
 * controls, the pipeline ending in the common Softmax → Prediction pair, and the
 * generation strip. Each stage supplies only its own upstream panels (`children`)
 * and its logit label — everything downstream of the logits is identical, so it
 * lives here once.
 */
export function InferenceShell({
  vocab,
  inference,
  contextLabel,
  logitLabel,
  softmaxSubtitle,
  children,
}: InferenceShellProps) {
  const { context, setContext, current, predicted, probs, softmaxRows, seq, decoding, setDecoding } =
    inference;
  const label = contextLabel ?? (context.length > 1 ? 'Context' : 'Current token');
  const setPos = (i: number, v: number) => setContext(context.map((x, k) => (k === i ? v : x)));

  return (
    <div className={styles.page}>
        <Flex className={styles.controls} align="center" gap="middle" wrap>
          <Flex align="center" gap="small">
            <span className={styles.label}>{label}</span>
            {context.map((c, i) => (
              <Select<number>
                key={i}
                size="small"
                value={c}
                onChange={(v) => setPos(i, v)}
                options={vocab.map((t, j) => ({ value: j, label: t }))}
                className={styles.select}
              />
            ))}
          </Flex>
          <DecodingControls value={decoding} onChange={setDecoding} />
        </Flex>

        <Flex className={styles.pipeline} align="stretch" gap="middle" wrap>
          {children}
          <span className={styles.connector} aria-hidden>→</span>
          <Softmax
            vocab={vocab}
            matrix={softmaxRows}
            current={current}
            predicted={predicted}
            logitLabel={logitLabel}
            subtitle={softmaxSubtitle}
          />
          <span className={styles.connector} aria-hidden>→</span>
          <Prediction vocab={vocab} current={current} predicted={predicted} prob={probs[predicted]} />
        </Flex>

        <Generation vocab={vocab} seq={seq} mode={decoding.mode} />
    </div>
  );
}

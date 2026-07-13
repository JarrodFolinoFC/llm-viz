import type { Example } from './stepTrainer';

/**
 * One fixed-width n-gram training example: the N previous tokens predict the
 * next. Model-neutral — shared by every sequence model (the MLP, the RNN, and
 * whatever comes next), so no single strategy owns the type.
 */
export interface Block extends Example {
  /** The N context token ids (oldest → newest). */
  context: number[];
  target: number;
}

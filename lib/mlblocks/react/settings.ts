import { createContext, useContext } from 'react';

import { PRECISION, type Precision } from '../core/precision';

/**
 * The platform-free slice of the view settings that the display components
 * (NumericCell, VectorCell, TrainingLoss) read. The web renderer's
 * ViewSettingsProvider bridges its cookie-backed precision into this context;
 * a native app provides its own. Default-bearing (rather than throwing) so the
 * components work unprovided in tests and stories. The trainer itself does NOT
 * read this: precision is part of a run's identity (like `seed`), so
 * useStepTrainer takes it as a constructor argument instead.
 */
export interface TrainerSettings {
  /** Decimal places for numeric readouts. */
  precision: Precision;
}

const Ctx = createContext<TrainerSettings>({ precision: PRECISION });

export const TrainerSettingsProvider = Ctx.Provider;

export const useTrainerSettings = (): TrainerSettings => useContext(Ctx);

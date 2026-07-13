import type { Example, StepContext } from './stepTrainer';

/** The slice of a strategy this helper needs: how to apply SGD updates. */
interface Updatable<TModel, TExample extends Example> {
  applyUpdates(model: TModel, n: number, lr: number, ctx: StepContext<TExample>): TModel;
}

/**
 * Train a model to (near) convergence in one shot — the "load a checkpoint" stand-in
 * the inference pages start from. Runs `epochs` full passes over the examples by
 * driving the same `applyUpdates` the live trainer uses, with a minimal cyclic
 * {@link StepContext}. Model-agnostic: works for any {@link TrainerStrategy}.
 */
export function pretrain<TModel, TExample extends Example>(
  strategy: Updatable<TModel, TExample>,
  model: TModel,
  examples: TExample[],
  lr: number,
  epochs: number,
): TModel {
  if (examples.length === 0) return model;
  const ctx: StepContext<TExample> = {
    examples,
    exampleAt: (k) => examples[k % examples.length],
  };
  return strategy.applyUpdates(model, epochs * examples.length, lr, ctx);
}

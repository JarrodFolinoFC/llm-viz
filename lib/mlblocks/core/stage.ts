/**
 * The phases of a single training step, plus a meta {@link TrainingStage.Overview}
 * for whole-flow views. Every panel belongs to one, and shows the matching
 * colour-coded icon in its badge so a pipeline reads at a glance: load the
 * **Data**, read the **Parameters** (embeddings, weights and biases), run the
 * **Forward** pass, score the **Loss**, **Back-propagate** the gradients, then
 * **Update** the parameters.
 *
 * The enum is framework vocabulary — the fixed skeleton of one SGD step — so it
 * lives in `mlblocks/core` (platform-free). The presentation half (label, icon,
 * colour per stage) is UI and lives with the renderers.
 */
export enum TrainingStage {
  Data = 'data',
  Parameters = 'weights',
  Forward = 'forward',
  Loss = 'loss',
  Backprop = 'backprop',
  Update = 'update',
  Overview = 'overview',
}

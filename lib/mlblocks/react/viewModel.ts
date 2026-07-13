/**
 * Base for per-step flow view-models — the layer between the trainer and the
 * flow spec. A view-model is constructed once per training step from the
 * trainer's output plus the run's statics, and every piece of derived UI state
 * (shared intermediates and per-panel props alike) is a getter on it. The
 * instance is a pure function of its constructor arguments: no hooks, no
 * context reads, no mutation — which is what makes it constructible in plain
 * tests (no render needed) and safe to cache against.
 *
 * `memo` gives getters lazy, compute-once semantics: a panel filtered out of
 * the flow never pays for its props, intermediates shared by several panels
 * compute once, and each panel sees a stable props identity for the lifetime
 * of the step (so `React.memo` works). The cache never invalidates because the
 * instance never changes — a new step means a new view-model.
 *
 * Interaction state (hover, stage filters, pinned panels) does NOT belong
 * here: it changes many times within a step and lives in contexts read by the
 * leaf components. The boundary is the same one the trainer draws — the
 * view-model holds what's derived from the run, not from the pointer.
 */
export abstract class StepViewModel {
  private readonly cache = new Map<string, unknown>();

  /** Compute `key` once per instance, then replay the cached value. */
  protected memo<T>(key: string, compute: () => T): T {
    if (!this.cache.has(key)) this.cache.set(key, compute());
    return this.cache.get(key) as T;
  }
}

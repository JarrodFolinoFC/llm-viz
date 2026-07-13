# LLM Trainer

An interactive visualizer that teaches how language models are trained — a ladder from a lookup table to a GPT, one idea per rung.

Every stage shows the **whole** computation: every weight, logit, probability, gradient and SGD update is on screen, with nothing hidden, so each number can be recomputed from the others. Step the trainer one update at a time and watch softmax, cross-entropy, the `p − y` gradient and the weight nudge happen in front of you. A built-in math console runs any panel row as real JavaScript and shows the PyTorch line you'd write in [nanoGPT](https://github.com/karpathy/nanoGPT).

## The curriculum

Each stage adds exactly one idea over the previous:

| Stage | Adds | What you see |
| --- | --- | --- |
| 1 · Bigram (scalar) | the training loop | A free V×V logit table. The entire mechanics of training with no model in the way. |
| 2 · Trigram (scalar) | one more context token | A V×V×V logit tensor — the exponential blow-up that motivates embeddings. |
| 3 · Bigram (vector) | embeddings | The table factorised into vectors: `logit = eₐ·u_b`. The seed of attention's QKᵀ. |
| 4 · Log-bilinear (scalar) | sharing structure across contexts | The Bengio MLP with its hidden layer deleted: embed the context tokens, concatenate, project straight to logits. |
| 5 · MLP for NLP | context + a hidden layer | The Bengio language model: embed, concatenate, tanh, project. Backprop chains through layers. |
| 6 · RNN | recurrence (unbounded context) | A running hidden state folded over the sequence with shared weights, trained by backprop through time. |
| 7 · Attention | content-based context | Coming next — from there you're reading nanoGPT's `model.py`. |

Most stages come in a **scalar** flavour (raw logit tables, so the arithmetic is legible) and a **vector** flavour (embeddings, so the geometry is legible), plus matching **inference** pages that run the trained model forward. The corpora are tiny (8–22 unique tokens) on purpose: small enough that every matrix fits on screen, ambiguous enough that the loss has a visible entropy floor.

## Running it

Requires Node.js ≥ 24 (or use [devbox](https://www.jetify.com/devbox): `devbox shell`).

```bash
git clone https://github.com/JarrodFolinoFC/llm-viz.git
cd llm-viz
npm install
npm run dev          # Vite dev server
```

Other useful scripts:

```bash
npm test             # vitest, single run
npm run test:watch   # vitest, watch mode
npm run storybook    # component stories on :6006
npm run lint         # eslint
npm run typecheck    # tsc -b
npm run build        # production build
```

## Deploying

Pushing to `main` builds the app and publishes it to GitHub Pages at [jarrodfolinofc.github.io/llm-viz](https://jarrodfolinofc.github.io/llm-viz/) via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**. The workflow builds with `--base=/<repo-name>/` so the site works under the repo's path on `github.io`, and serves `index.html` as the 404 page so deep links into the router still load.

## How it's put together

```
lib/mlblocks/          The visualization + training engine (vendored library)
  core/                Pure math & the step engine: StepTrainer, TrainerStrategy,
                       softmax/SGD helpers, corpus tokenization
  react/               Panels (MatrixPanel, RowSoftmax, GradientColumn, …),
                       FlowRenderer, StageShell, useCorpusTrainer
lib/shared-ui/         Small shared React components
src/
  training/strategies/ One TrainerStrategy per model (bigram, trigram, lbl, mlp, rnn, …)
  components/stages/   One folder per model: Flow (layout), ViewModel (derived
                       state), FlowContainer (wiring), <name>Flow.spec.json (arrangement)
  pages/               One thin page per route
  navigation.tsx       Single source of truth for the sidebar and the router
  lib/corpora.ts       The training corpora, named by vocabulary size
tests/                 Vitest suites, one per trainer plus UI/behaviour tests
```

Every stage follows the same three-layer pattern:

1. **Strategy** (`src/training/strategies/*.ts`) — the model's math, implementing the `TrainerStrategy` interface from `mlblocks/core`: `forward`, `applyUpdates`, `loss`, and the "flash" snapshot that lets the UI show the worked before/after of a single step. Pure functions, no React.
2. **ViewModel** (`src/components/stages/*/‑ViewModel.ts`) — one pure, memoised object that turns a step result into panel props. Every getter is typed against the component it feeds, so the wiring is checked by the compiler.
3. **Flow** (`*Flow.tsx` + `*Flow.spec.json`) — declares the panels (which component, which view-model getter, which tensors it displays) and arranges them from the JSON layout spec. The `FlowContainer` wires it all to `useCorpusTrainer` inside the shared `StageShell` (training controls, loss chart, param counts).

## Adding a new model

The trigram stage (`src/training/strategies/trigram.ts` + `src/components/stages/trigram/`) is the smallest complete example — copy its shape. Say your model is called `foo`:

### 1. Write the strategy — `src/training/strategies/foo.ts`

Define your model type (whatever holds the weights) and implement `TrainerStrategy` from `mlblocks/core`:

```ts
export class FooStrategy implements TrainerStrategy<FooModel, Block, FooFlash, FooStepResult> {
  forward(model, block)        // logits for one training example
  applyUpdates(model, n, lr, ctx) // n SGD steps → new model (never mutate)
  loss(model, blocks)          // mean cross-entropy over the corpus
  flashFor(model, step, ctx)   // pre-step snapshot for the worked single-step view
  toPair(block)                // project an example to {prev, target, pos} for shared panels
  touchedRows(block)           // which rows this example trains (for highlighting)
  prevLogitsFrom(flash)        // pre-step logits, recovered from the flash
  assemble(before, after, core)// pack the step result
  modelOf(result)              // extract the model from a result
}

export const fooStrategy = new FooStrategy();
export function initFoo(seed: number, V: number): FooModel { /* seeded random init */ }
```

If your model introduces new tensors (beyond the registered `W`, `E`, `W₁`, …), register their labels and colours in `src/training/params.ts`.

### 2. Build the stage — `src/components/stages/foo/`

Four files, mirroring the trigram folder:

- **`FooViewModel.ts`** — extends `StepViewModel`; one getter per panel, each returning `ComponentProps<typeof SomePanel>` and wrapped in `this.memo(...)`. Also expose `meanLoss`, `misclassified`, and `scope` (the math-console variables).
- **`FooFlow.tsx`** — declare each panel with `panel(TrainingStage.X, Component, (vm) => vm.somePanel, { tensors: ['W'] })`, then build the spec with `specFromJson(layout, { nodes: {...} })` and render it: `<FlowRenderer spec={fooFlowSpec} view={trainer} />`.
- **`fooFlow.spec.json`** — the arrangement only: rows/columns of the panel names you registered, plus the `{ "lossSlot": true }` placeholder for the loss chart.
- **`FooFlowContainer.tsx`** — wire it together with `useCorpusTrainer` and wrap in `StageShell`:

```tsx
const { controller, vm, prep, floors } = useCorpusTrainer({
  corpus, vocab,
  prepare: (c, v) => ({ examples: trainingBlocks(c, v, contextLen) }),
  contextLen,
  strategy: fooStrategy,
  init: (seed) => initFoo(seed, vocab.length),
  defaults: { seed: 1, lr: 0.5 },
  viewModel: ({ prep, result }) => new FooViewModel({ vocab, corpus, blocks: prep.examples }, result),
});
```

### 3. Add the page and route

- **`src/pages/FooScalarPage.tsx`** — a thin wrapper that picks a corpus from `src/lib/corpora.ts` and renders the container.
- **`src/navigation.tsx`** — add the model to the `ModelKind` union, give it an icon in `MODEL_ICON`, and add a `NavItem` under the right group. That one entry drives both the sidebar and the router — there is no separate routes list.
- Optionally add a card for it in `src/pages/LandingPage.tsx`.

### 4. Test it — `tests/fooTrainer.test.ts`

Drive `StepTrainer` directly (see `tests/trigramTrainer.test.ts`) and assert the invariants that make the visualization trustworthy:

- one step updates exactly the rows `touchedRows` claims, and nothing else;
- `after − before` equals `−η·(p − y)` on the trained row;
- loss starts near `ln V` and decreases toward the corpus's entropy floor;
- the view model's panel props are consistent with the step result.

Then run `npm test`, `npm run typecheck` and `npm run lint`.

## Contributing

Issues and pull requests are welcome. The bar for a new stage is pedagogical: it should add **one** idea over the previous stage, and every number it renders should be recomputable from the others on screen.

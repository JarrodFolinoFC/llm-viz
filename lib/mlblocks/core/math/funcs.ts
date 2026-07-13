// Barrel for the numeric/training primitives, split by concern into:
//   linalg  — matrix/vector ops, the seeded RNG, activations
//   softmax — softmax + its cross-entropy gradient
//   corpus  — tokenization + bigram extraction
//   sgd     — the V×V logit-table update rule and corpus scoring
// Importers can keep pulling from './funcs', or reach for a specific module.
export * from './linalg.ts';
export * from './softmax.ts';
export * from './corpus.ts';
export * from './sgd.ts';

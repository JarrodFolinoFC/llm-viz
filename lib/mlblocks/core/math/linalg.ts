// Numeric primitives: matrix/vector ops, the seeded RNG, and the activation
// functions the flows are built from. Pure and dependency-free — every higher
// layer (softmax, sgd, the trainers) composes these.

export function randomMatrix(
  seed: number,
  rows: number,
  cols: number,
  scale = 1
) {
  const rand = mulberry32(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rand() - 0.5) * 2 * scale)
  );
}

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function rowNormalize(M: number[][]) {
  return M.map((row) => {
    const sum = row.reduce((a, b) => a + b, 0);
    return sum > 0 ? row.map((v) => v / sum) : row.slice();
  });
}

export function matMul(A: number[][], B: number[][]) {
  const rows = A.length;
  const inner = B.length;
  const cols = B[0].length;
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      let acc = 0;
      for (let k = 0; k < inner; k++) acc += A[i][k] * B[k][j];
      return acc;
    })
  );
}

// Dot product of two equal-length vectors. Tolerant of a short `b` (treats
// missing entries as 0) so it can be reused across the embedding panels.
export const dot = (a: number[], b: number[]) =>
  a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);

// Elementwise A − B for two same-shaped matrices (e.g. post − pre weights).
export const subtractMatrix = (A: number[][], B: number[][]) =>
  A.map((row, i) => row.map((v, j) => v - B[i][j]));

// Elementwise a − b for two equal-length vectors (e.g. post − pre biases).
export const subtractVec = (a: number[], b: number[]) => a.map((x, i) => x - b[i]);

export function addVec(a: number[], b: number[]) {
  return a.map((x, i) => x + b[i]);
}

export function scaleVec(a: number[], s: number) {
  return a.map((x) => x * s);
}

// ReLU nonlinearity and its derivative. Not used by the bigram stage (which is
// purely linear), but it's the activation the Stage-2 MLP needs between layers.
export function relu(a: number[]) {
  return a.map((x) => Math.max(0, x));
}

export function reluPrime(a: number[]) {
  return a.map((x) => (x > 0 ? 1 : 0));
}

// tanh nonlinearity and its derivative. The Stage-2 MLP hidden layer uses tanh;
// its derivative is conveniently expressed from the *output* h = tanh(z) as
// 1 − h², so backprop never needs the pre-activation z.
export function tanhVec(a: number[]) {
  return a.map((x) => Math.tanh(x));
}

export function dtanhFromOutput(h: number[]) {
  return h.map((y) => 1 - y * y);
}

export function zeros(n: number) {
  return Array<number>(n).fill(0);
}

// W^T · v + b : right-multiply a (rows × cols) matrix's columns by vector v.
// This is one dense/linear layer. A Stage-2 MLP hidden layer is just:
//   const hidden = relu(matVecRight(W1, embed, b1));
//   const logits = matVecRight(W2, hidden, b2);
export function matVecRight(W: number[][], v: number[], b: number[]) {
  const cols = W[0].length;
  return Array.from(
    { length: cols },
    (_, j) => v.reduce((acc, vk, k) => acc + vk * W[k][j], 0) + b[j]
  );
}

// W · v over the *rows* of W (out[k] = Σ_j W[k][j]·v[j]; length = rows). This is
// the transpose of matVecRight and is what backprop needs to push a gradient
// from a layer's outputs back to its inputs: dInput = W · dPreActivation.
export function matVecLeft(W: number[][], v: number[]) {
  return W.map((row) => row.reduce((acc, w, j) => acc + w * v[j], 0));
}

// Outer product a ⊗ b → (a.length × b.length). A linear layer's weight gradient
// is the outer product of its input and its output-side gradient: dW = x ⊗ dz.
export function outer(a: number[], b: number[]) {
  return a.map((ai) => b.map((bj) => ai * bj));
}

// One SGD step on a parameter: move it down its gradient by `lr` (W ← W − η·∇W).
// Shared by every strategy's `sgdStep` so the update rule has one definition,
// whatever the parameter bundle's shape.
export const stepMatrix = (W: number[][], dW: number[][], lr: number) =>
  W.map((row, i) => row.map((v, j) => v - lr * dW[i][j]));

export const stepVec = (v: number[], dv: number[], lr: number) =>
  v.map((x, i) => x - lr * dv[i]);

export function maxAbs(matrix: number[][]) {
  return Math.max(...matrix.flat().map((v) => Math.abs(v)), 1e-9);
}

// Index of the (first) largest entry — the model's greedy next-token pick. Shared
// by the decoding loop, the flow charts' predicted-token readout, and the
// misclassified-count metric, so "argmax" has one definition.
export const argmax = (a: number[]) => a.reduce((best, v, i) => (v > a[best] ? i : best), 0);

// Deterministic Fisher–Yates driven by the seeded RNG. The trainer's shuffle
// toggle uses this so "shuffled" runs are still reproducible per seed.
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

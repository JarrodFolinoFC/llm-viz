// Corpus tokenization and bigram extraction: turning the raw training text into
// the (prev → next) index pairs and counts the stages consume.

// word → vocab-index lookup. One definition for every caller that needs to map
// tokens back to their row/column position.
export function vocabIndex(vocab: readonly string[]) {
  return new Map(vocab.map((w, i) => [w, i] as const));
}

export function tokenize(corpus: string) {
  return corpus.split(/\s+/).filter(Boolean);
}

/** The corpus's unique tokens, in first-appearance order — the page-side vocab.
 *  Built on {@link tokenize} so stray whitespace can never mint a phantom token. */
export function vocabOf(corpus: string): string[] {
  return [...new Set(tokenize(corpus))];
}

export function tokenIds(tokens: string[], vocab: readonly string[]) {
  const idx = vocabIndex(vocab);
  return tokens.map((tok) => idx.get(tok) ?? -1);
}

// Walk every adjacent (prev, next) token pair in the corpus, mapped to vocab
// indices. Out-of-vocab tokens are skipped. Single definition shared by the
// count matrix and the training-pair list below.
function forEachBigram(
  corpus: string,
  vocab: readonly string[],
  cb: (prev: number, target: number, pos: number) => void
) {
  const idx = vocabIndex(vocab);
  const tokens = tokenize(corpus);
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = idx.get(tokens[i]);
    const b = idx.get(tokens[i + 1]);
    if (a === undefined || b === undefined) continue;
    cb(a, b, i);
  }
}

export function bigramCounts(corpus: string, vocab: readonly string[]) {
  const V = vocab.length;
  const counts = Array.from({ length: V }, () => Array<number>(V).fill(0));
  forEachBigram(corpus, vocab, (a, b) => {
    counts[a][b] += 1;
  });
  return { counts, total: tokenize(corpus).length };
}

export function trainingPairs(corpus: string, vocab: readonly string[]) {
  const pairs: { prev: number; target: number; pos: number }[] = [];
  // pos = the prev token's corpus position, so the corpus-highlight panels can
  // mark the right tokens even when the training order is shuffled.
  forEachBigram(corpus, vocab, (prev, target, pos) => {
    pairs.push({ prev, target, pos });
  });
  return pairs;
}

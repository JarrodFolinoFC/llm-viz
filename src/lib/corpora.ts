// Corpora are named by their unique-vocabulary size (the dimension of W and of
// every matrix the visualizer renders), not by token count.

// 8 unique tokens (29 tokens total). Drives the Stage-1 bigram flow.
export const CORPUS_8 =
  'the cat on the sofa . the dog in the hat . the cat in the hat . the dog on the sofa . the cat on the sofa';

// 22 unique tokens, categorically structured (determiners → nouns → verbs →
// prepositions → …) so the learned embeddings group by part-of-speech. Drives
// the vector stage. Punctuation and "and" are tokens.
export const CORPUS_22 = [
  'the cat sat on the mat .',
  'the dog sat on the rug .',
  'a sloth slept under the sofa .',
  'the puppy hid near the hat .',
  'the cat jumped onto the sofa .',
  'a dog sat on the mat .',
  'the sloth slept under the rug .',
  'the puppy slept near the hat .',
  'a cat slept on the rug and a dog ran under the sofa .',
  'the sloth slept near the sofa and the puppy hid in the hat .',
  'the dog slept on the mat .',
  'a sloth slept on the sofa .',
].join(' ');

// 16 unique tokens — the mid-size corpus the vector (embedding) stage trains on.
export const CORPUS_16 = [
  'the cat sat on the mat .',
  'the dog sat on the rug .',
  'a dog sat on the mat .',
  'the sloth slept under the rug .',
  'the dog and the sofa and the cat in the hat .',
  'the dog on the mat .',
].join(' ');

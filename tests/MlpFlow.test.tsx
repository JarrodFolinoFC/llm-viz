import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MlpFlow } from '../src/components/stages/mlp/MlpFlow';
import { paramTex } from 'mlblocks';
import { ViewSettingsProvider } from '../src/theme';
import { MLP_CONCEPT_NOTES } from '../src/components/stages/mlp/mlpConceptNotes';
import { MLP_JS_NOTES } from '../src/components/stages/mlp/mlpJsNotes';
import { jsNoteClasses as jsNoteStyles } from 'mlblocks';
import { initMlp, forwardPass, backwardPass } from '../src/training/strategies/mlp';
import { buildMlpView, MLP_TEST_VOCAB } from './mlpView';

const vocab = MLP_TEST_VOCAB;

describe('MlpFlow (render)', () => {
  it('mounts the full forward → softmax → backprop → update flow without throwing', () => {
    const { container } = render(
      <ViewSettingsProvider>
        <MlpFlow trainer={buildMlpView()} />
      </ViewSettingsProvider>,
    );
    const text = container.textContent ?? '';
    // The four pipeline stages all produced panels.
    expect(text).toContain('tanh');     // hidden-layer arrow label
    expect(text).toContain('after step'); // update-row panels
    expect(container.querySelectorAll('table').length).toBeGreaterThan(5);
  });

  it('forward intermediates have the expected shapes', () => {
    const model = initMlp(1, vocab.length, 3, 3, 8);
    const fwd = forwardPass(model, [0, 1, 2]);
    expect(fwd.x).toHaveLength(9); // N·d = 3·3
    expect(fwd.hidden).toHaveLength(8); // H
    expect(fwd.logits).toHaveLength(vocab.length);
    const grads = backwardPass(model, { context: [0, 1, 2], target: 4 }, fwd);
    expect(grads.dW1).toHaveLength(9);
    expect(grads.dW2).toHaveLength(8);
    expect(grads.dE).toHaveLength(vocab.length);
  });
});

describe('MlpFlow — W₁ every-word view (the "W₁ rows" setting)', () => {
  afterEach(cleanup);
  const setFlag = (v: string) => (document.cookie = `w1AllWords=${v}; path=/`);
  const tableRowCounts = (container: HTMLElement) =>
    [...container.querySelectorAll('table')].map((t) => t.querySelectorAll('tbody tr').length);
  const renderFlow = () =>
    render(
      <ViewSettingsProvider>
        <MlpFlow trainer={buildMlpView()} />
      </ViewSettingsProvider>,
    );

  it('shows the raw positional slot rows by default', () => {
    setFlag('0');
    const { container } = renderFlow();
    expect(container.textContent ?? '').toContain('pos0·d0');
    // No table holds the derived every-word rows (N context slots × V words).
    expect(tableRowCounts(container)).not.toContain(3 * vocab.length);
  });

  it('shows every word in every slot when toggled on, live context highlighted', () => {
    setFlag('1');
    const { container } = renderFlow();
    // The derived E·W₁ table: one row per (slot, word).
    expect(tableRowCounts(container)).toContain(3 * vocab.length);
    // Its title flags the derivation and the new dims. (The ∇W₁ / after-step
    // panels keep their raw slot rows — only the weights panel switches.) The
    // E and W₁ tokens carry their parameter-identity colour (see paramTex).
    const text = container.textContent ?? '';
    expect(text).toContain(`${paramTex('E', 'E')} \\cdot ${paramTex('W1', 'W_1')}`);
    expect(text).toContain('(N·V)×H');
    setFlag('0');
  });
});

describe('MlpFlow — companion panels (plain-English + JS) via the page filter', () => {
  afterEach(cleanup);
  // The panelFilter cookie maps route → *shown* panel kinds (jsdom's route is '/').
  const setShownKinds = (kinds: string[]) =>
    (document.cookie = `panelFilter=${encodeURIComponent(JSON.stringify({ '/': kinds }))}; path=/`);
  const resetKinds = () => setShownKinds(['standard']);

  const renderScalar = () =>
    render(
      <ViewSettingsProvider>
        <MlpFlow trainer={buildMlpView()} layout="stacked" />
      </ViewSettingsProvider>,
    );

  it('shows only the standard panels by default', () => {
    resetKinds();
    const { container } = renderScalar();
    expect(container.textContent ?? '').not.toContain('🗣');
    expect(container.querySelector(`.${jsNoteStyles.note}`)).toBeNull();
    expect(container.textContent ?? '').not.toContain('secret number');
    // the data panels still render
    expect(container.querySelectorAll('table').length).toBeGreaterThan(5);
  });

  it('offers the Panels group in the page filter bar', () => {
    resetKinds();
    const { getByRole } = renderScalar();
    // One toggle per kind, alongside the stage toggles; companions start hidden.
    expect(getByRole('button', { name: /Hide Standard panels/ })).toBeTruthy();
    expect(getByRole('button', { name: /Show Plain English panels/ })).toBeTruthy();
    expect(getByRole('button', { name: /Show JS panels/ })).toBeTruthy();
  });

  it('shows a plain-English note on every panel when its kind is toggled on', () => {
    setShownKinds(['standard', 'plainEnglish']);
    const { container } = renderScalar();
    const notes = (container.textContent ?? '').match(/🗣/g) ?? [];
    // One note per entry in the concept-notes table (every panel + the loss readout).
    expect(notes.length).toBe(Object.keys(MLP_CONCEPT_NOTES).length);
    // …but no JS notes: each kind toggles independently.
    expect(container.querySelector(`.${jsNoteStyles.note}`)).toBeNull();
    const text = container.textContent ?? '';
    // Static titles (one per stage) are all present.
    expect(text).toContain('E — embeddings');
    expect(text).toContain('Softmax');
    expect(text).toContain('How wrong were we?');
    expect(text).toContain('blame for W₂');
    expect(text).toContain('b₂ — nudged');
    // …and the copy is dynamic: it names the live example and shows live numbers.
    expect(text).toContain('flashcard'); // corpus note narrates the current block
    expect(text).toContain(vocab[0]); // the notes reference actual vocab words
    expect(text).toMatch(/\d%/); // softmax/loss render live percentages
    resetKinds();
  });

  it('shows a JS note on every panel when its kind is toggled on', () => {
    setShownKinds(['standard', 'js']);
    const { container } = renderScalar();
    const notes = container.querySelectorAll(`.${jsNoteStyles.note}`);
    expect(notes.length).toBe(Object.keys(MLP_JS_NOTES).length);
    expect(container.textContent ?? '').not.toContain('🗣');
    const text = container.textContent ?? '';
    // The snippets are pure JS…
    expect(text).toContain('Math.tanh');
    expect(text).toContain('logits.map(Math.exp)');
    expect(text).toContain('-Math.log(p[target])');
    // …with the live example's dims/words baked into the comments.
    expect(text).toContain(`length: ${vocab.length}`);
    resetKinds();
  });

  it('can show the companions alone, with the standard panels hidden', () => {
    setShownKinds(['plainEnglish', 'js']);
    const { container } = renderScalar();
    expect(((container.textContent ?? '').match(/🗣/g) ?? []).length).toBe(
      Object.keys(MLP_CONCEPT_NOTES).length,
    );
    expect(container.querySelectorAll(`.${jsNoteStyles.note}`).length).toBe(
      Object.keys(MLP_JS_NOTES).length,
    );
    // The standard data panels are gone.
    expect(container.querySelectorAll('table').length).toBe(0);
    resetKinds();
  });

  it('never shows the companions on the non-scalar (default) layout', () => {
    setShownKinds(['standard', 'plainEnglish', 'js']);
    const { container } = render(
      <ViewSettingsProvider>
        <MlpFlow trainer={buildMlpView()} layout="default" />
      </ViewSettingsProvider>,
    );
    expect(container.textContent ?? '').not.toContain('🗣');
    expect(container.querySelector(`.${jsNoteStyles.note}`)).toBeNull();
    resetKinds();
  });
});

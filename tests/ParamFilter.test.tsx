import { render, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';

import { MlpFlow } from '../src/components/stages/mlp/MlpFlow';
import { ViewSettingsProvider } from '../src/theme';
import { loadHiddenTensors, saveHiddenTensors } from 'mlblocks';
import { buildMlpView } from './mlpView';

function clearCookies() {
  for (const c of document.cookie.split(';')) {
    document.cookie = `${c.split('=')[0].trim()}=; max-age=0; path=/`;
  }
}
beforeEach(clearCookies);
afterEach(cleanup);

// jsdom's route is '/', so the per-page cookie is keyed there.
const setHidden = (tensors: string[]) =>
  (document.cookie = `paramFilter=${encodeURIComponent(JSON.stringify({ '/': tensors }))}; path=/`);

const renderScalar = () =>
  render(
    <ViewSettingsProvider>
      <MlpFlow trainer={buildMlpView()} layout="stacked" />
    </ViewSettingsProvider>,
  );

const tableCount = () => {
  const { container } = renderScalar();
  const n = container.querySelectorAll('table').length;
  cleanup();
  return n;
};

describe('param filter cookie', () => {
  it("round-trips a page's hidden tensors", () => {
    expect(loadHiddenTensors('/mlp/training/scalar').size).toBe(0);
    saveHiddenTensors('/mlp/training/scalar', new Set(['W2', 'b2']));
    const restored = loadHiddenTensors('/mlp/training/scalar');
    expect(restored.has('W2')).toBe(true);
    expect(restored.has('b2')).toBe(true);
    expect(restored.size).toBe(2);
  });

  it('keeps pages independent and clears an emptied entry', () => {
    saveHiddenTensors('/mlp/training', new Set(['E']));
    saveHiddenTensors('/mlp/training/scalar', new Set(['W1']));
    expect([...loadHiddenTensors('/mlp/training')]).toEqual(['E']);
    saveHiddenTensors('/mlp/training', new Set());
    expect(loadHiddenTensors('/mlp/training').size).toBe(0);
    // the other page is untouched
    expect([...loadHiddenTensors('/mlp/training/scalar')]).toEqual(['W1']);
  });

  it('ignores unknown tensor keys from a stale cookie', () => {
    saveHiddenTensors('/x', new Set(['W1', 'bogus']));
    expect([...loadHiddenTensors('/x')]).toEqual(['W1']);
  });
});

describe('parameter filter — bar', () => {
  it('offers a toggle per tensor plus All / None', () => {
    const { getByRole, getAllByRole } = renderScalar();
    for (const label of ['E', 'W₁', 'b₁', 'W₂', 'b₂']) {
      expect(getByRole('button', { name: new RegExp(`Hide ${label} panels`) })).toBeTruthy();
    }
    // Two All / None pairs now: the Stages group and the Parameters group.
    expect(getAllByRole('button', { name: 'All' }).length).toBe(2);
    expect(getAllByRole('button', { name: 'None' }).length).toBe(2);
  });
});

describe('parameter filter — All / None', () => {
  it('None hides every parameter (and the context), All restores them', () => {
    const { getAllByRole, container } = renderScalar();
    // Second All/None pair belongs to the Parameters group (first is Stages).
    fireEvent.click(getAllByRole('button', { name: 'None' })[1]);
    expect(container.querySelectorAll('table').length).toBe(0);
    fireEvent.click(getAllByRole('button', { name: 'All' })[1]);
    expect(container.querySelectorAll('table').length).toBeGreaterThan(5);
  });
});

describe('parameter filter — panels shown/hidden', () => {
  it('hides only the tensor-owned panels, keeping the shared forward/backprop ones', () => {
    const all = tableCount();
    setHidden(['W2']);
    const { container } = renderScalar();
    // W₂ owns exactly four standard panels: the param, ∇W₂, W₂-after, W₂-working.
    expect(all - container.querySelectorAll('table').length).toBe(4);
    // The softmax (Term "p(next | context)") and gradient (Term "why p − y?")
    // are tagged {W₂, b₂}, so with b₂ still shown they remain.
    const text = container.textContent ?? '';
    expect(text).toContain('p(next | context)');
    expect(text).toContain('why p − y?');
  });

  it('drops the context panels (corpus, loss) once any parameter is deselected', () => {
    const { container: shown } = renderScalar();
    expect(shown.textContent ?? '').toContain('Training corpus');
    cleanup();
    setHidden(['b2']);
    const { container } = renderScalar();
    expect(container.textContent ?? '').not.toContain('Training corpus');
  });

  it('hides everything — panels and context — when no parameter is selected', () => {
    setHidden(['E', 'W1', 'b1', 'W2', 'b2']);
    const { container } = renderScalar();
    expect(container.querySelectorAll('table').length).toBe(0);
  });
});

describe('arrangement (view option)', () => {
  it('defaults to the collapsed wrapping flow on desktop', () => {
    const { container } = renderScalar();
    expect(container.querySelector('[data-arrangement="collapsed"]')).toBeTruthy();
  });

  it('respects a saved stage / vertical arrangement', () => {
    document.cookie = 'arrangement=stage; path=/';
    const { container } = renderScalar();
    expect(container.querySelector('[data-arrangement="stage"]')).toBeTruthy();
    cleanup();
    document.cookie = 'arrangement=vertical; path=/';
    const { container: v } = renderScalar();
    expect(v.querySelector('[data-arrangement="vertical"]')).toBeTruthy();
  });
});

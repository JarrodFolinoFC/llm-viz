import { render, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';

import { ViewSettingsProvider } from '../src/theme';
import { WeightUpdateWorking } from '../src/components/stages/mlp/WeightUpdateWorking';
import { BiasUpdateWorking } from '../src/components/stages/mlp/BiasUpdateWorking';
import { EmbUpdateWorking } from '../src/components/stages/mlp/EmbUpdateWorking';

// Pin decimals so the rendered numbers are deterministic.
beforeEach(() => (document.cookie = 'precision=2; path=/'));
afterEach(cleanup);

const wrap = (node: React.ReactNode) => render(<ViewSettingsProvider>{node}</ViewSettingsProvider>);

describe('WeightUpdateWorking — ∇W = a ⊗ g', () => {
  it('renders each cell as the outer product of its two factors', () => {
    const { container } = wrap(
      <WeightUpdateWorking
        title="\\nabla W"
        rowFactor={[2, 3]}
        rowLabels={['r0', 'r1']}
        colFactor={[5, 7]}
        colLabels={['c0', 'c1']}
        deltas={[[-0.1, -0.2], [-0.3, -0.4]]}
        lr={0.5}
        step={1}
      />,
    );
    const text = container.textContent ?? '';
    // 2·5, 2·7, 3·5, 3·7
    for (const p of ['10.00', '14.00', '15.00', '21.00']) expect(text).toContain(p);
    // the learning rate rides in the subtitle
    expect(text).toContain('η=0.50');
  });
});

describe('BiasUpdateWorking — ∇b → Δ → before → after', () => {
  it('lays the gradient, the update and the before/after side by side', () => {
    const { container } = wrap(
      <BiasUpdateWorking
        title="\\Delta b"
        rowLabels={['h0', 'h1']}
        decomposition={[{ label: 'g', values: [0.5, -0.5] }]}
        deltas={[-0.25, 0.25]}
        before={[1, 2]}
        after={[0.75, 2.25]}
        lr={0.5}
        step={1}
      />,
    );
    const text = container.textContent ?? '';
    expect(text).toContain('+0.50'); // ∇b[0]
    expect(text).toContain('Δ -0.25'); // update
    expect(text).toContain('+0.75'); // b after[0] = 1 − 0.25
    expect(text).toContain('+2.25'); // b after[1]
  });
});

describe('EmbUpdateWorking — Σ(W₁·∇z₁) = ∇E → ΔE', () => {
  it('sums the products to ∇E and chains it to the update', () => {
    const { container } = wrap(
      <EmbUpdateWorking
        vocab={['a', 'b']}
        context={[0]}
        E={[[1], [2]]}
        W1={[[2, 4]]} // one input slot, two hidden units
        dz1={[3, 5]}
        deltaE={[[-0.9], [0]]}
        Eafter={[[0.1], [2]]}
        lr={0.3}
        step={1}
      />,
    );
    const text = container.textContent ?? '';
    expect(text).toContain('6.00'); // W₁[0][0]·∇z₁[0] = 2·3
    expect(text).toContain('20.00'); // W₁[0][1]·∇z₁[1] = 4·5
    expect(text).toContain('26.00'); // Σ = ∇E
    expect(text).toContain('Δ -0.90'); // ΔE
    expect(text).toContain('+0.10'); // E after
  });
});

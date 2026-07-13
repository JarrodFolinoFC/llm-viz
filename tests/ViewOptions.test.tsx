import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Panel } from 'mlblocks';
import { flow, FlowRenderer, type FlowSpec } from 'mlblocks';

import { VectorPanel } from 'mlblocks';
import { TrainingStage } from 'mlblocks';
import { ViewSettingsProvider, useViewSettings } from '../src/theme';

interface DemoView {
  x: number[];
  step: number;
}
const { flex, panel, arrow } = flow<DemoView>();
const spec: FlowSpec<DemoView> = flex(
  { gap: 8, align: 'stretch' },
  panel(TrainingStage.Forward, VectorPanel, (v) => ({ symbol: 'x', values: v.x, step: v.step })),
  arrow('next'),
  panel(TrainingStage.Forward, VectorPanel, (v) => ({ symbol: 'y', values: v.x, step: v.step }))
);
// Two panels in different stages, so one stage can be hidden independently.
const mixedSpec: FlowSpec<DemoView> = flex(
  { gap: 8, align: 'stretch' },
  panel(TrainingStage.Forward, VectorPanel, (v) => ({ symbol: 'x', values: v.x, step: v.step })),
  arrow('next'),
  panel(TrainingStage.Backprop, VectorPanel, (v) => ({ symbol: 'gx', values: v.x, step: v.step }))
);
const view: DemoView = { x: [0.1, -0.2], step: 1 };

function setCookie(kv: string) {
  document.cookie = `${kv}; path=/`;
}

afterEach(cleanup);

describe('panel sizes', () => {
  it('applies the xxs and xs size classes', () => {
    const { container, rerender } = render(
      <ViewSettingsProvider>
        <Panel title="t" step={1} dimmed={false} size="xxs">
          <div>body</div>
        </Panel>
      </ViewSettingsProvider>
    );
    expect(container.querySelector('[data-size="xxs"]')).not.toBeNull();
    rerender(
      <ViewSettingsProvider>
        <Panel title="t" step={1} dimmed={false} size="xs">
          <div>body</div>
        </Panel>
      </ViewSettingsProvider>
    );
    expect(container.querySelector('[data-size="xs"]')).not.toBeNull();
  });
});

describe('hide-arrows option', () => {
  it('renders arrows by default', () => {
    setCookie('hideArrows=0');
    const { container } = render(
      <ViewSettingsProvider>
        <FlowRenderer spec={spec} view={view} />
      </ViewSettingsProvider>
    );
    expect(container.textContent).toContain('→');
  });

  it('omits arrows when the setting is on', () => {
    setCookie('hideArrows=1');
    const { container } = render(
      <ViewSettingsProvider>
        <FlowRenderer spec={spec} view={view} />
      </ViewSettingsProvider>
    );
    expect(container.textContent).not.toContain('→');
    // the panels themselves still render
    expect(container.querySelectorAll('table').length).toBeGreaterThan(0);
    setCookie('hideArrows=0'); // reset for other tests
  });
});

describe('per-stage show/hide', () => {
  // The self-filtered FlowRenderer persists its filter per page (the
  // stageFilter cookie); reset it so one test's toggles don't leak into the next.
  beforeEach(() => setCookie('stageFilter={}'));

  it('shows every stage by default, with one toggle per stage the flow contains', () => {
    const { container } = render(
      <ViewSettingsProvider>
        <FlowRenderer spec={mixedSpec} view={view} />
      </ViewSettingsProvider>
    );
    expect(container.querySelectorAll('table').length).toBe(2);
    // Only the two stages this flow uses are offered (not all six).
    expect(screen.getByRole('button', { name: /Hide Forward pass panels/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Hide Back propagation panels/i })).toBeTruthy();
  });

  it('drops a stage panels and the now-dangling arrow when its toggle is clicked', () => {
    const { container } = render(
      <ViewSettingsProvider>
        <FlowRenderer spec={mixedSpec} view={view} />
      </ViewSettingsProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Hide Back propagation panels/i }));
    expect(container.querySelectorAll('table').length).toBe(1);
    expect(container.textContent).not.toContain('→');
  });

  it('None hides every panel and All brings them back', () => {
    const { container } = render(
      <ViewSettingsProvider>
        <FlowRenderer spec={mixedSpec} view={view} />
      </ViewSettingsProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'None' }));
    expect(container.querySelectorAll('table').length).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(container.querySelectorAll('table').length).toBe(2);
  });
});

// A tiny consumer that drives the token-colour override API (as the chip
// colour picker does).
function ColorOverrideHarness() {
  const { setTokenColor, resetTokenColor } = useViewSettings();
  return (
    <>
      <button onClick={() => setTokenColor('chip-prev-bg', '#123456')}>set</button>
      <button onClick={() => resetTokenColor('chip-prev-bg')}>clear</button>
    </>
  );
}

describe('token chip colour overrides', () => {
  const readVar = () => document.documentElement.style.getPropertyValue('--c-chip-prev-bg');

  it('applies an override as an inline CSS var and reverts it on reset', () => {
    render(
      <ViewSettingsProvider>
        <ColorOverrideHarness />
      </ViewSettingsProvider>
    );
    expect(readVar()).toBe('');
    fireEvent.click(screen.getByText('set'));
    expect(readVar()).toBe('#123456');
    fireEvent.click(screen.getByText('clear'));
    expect(readVar()).toBe('');
  });
});

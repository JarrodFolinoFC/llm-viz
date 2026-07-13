import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { flow, FlowRenderer, type FlowSpec } from 'mlblocks';
import { ViewSettingsProvider } from '../src/theme';
import { flowClasses } from 'mlblocks';
import { VectorPanel } from 'mlblocks';
import { TrainingStage } from 'mlblocks';

interface DemoView {
  x: number[];
  step: number;
}

const { flex, panel, arrow } = flow<DemoView>();
const spec: FlowSpec<DemoView> = flex(
  { wrap: true, gap: 8, align: 'stretch' },
  panel(TrainingStage.Forward, VectorPanel, (v) => ({ symbol: 'x', values: v.x, step: v.step })),
  arrow('next'),
  panel(TrainingStage.Forward, VectorPanel, (v) => ({ symbol: 'y', values: v.x, step: v.step }))
);
const view: DemoView = { x: [0.1, -0.2, 0.3], step: 1 };

afterEach(cleanup);

describe('FlowRenderer CSS responsiveness', () => {
  it('emits the arrangement hooks the stylesheet relies on (stage rows + arrow glyph)', () => {
    const { container } = render(
      <ViewSettingsProvider>
        <FlowRenderer spec={spec} view={view} />
      </ViewSettingsProvider>,
    );

    // Pipeline rows are tagged so the arrangement CSS can collapse them.
    expect(container.querySelector(`.${flowClasses.stageRow}`)).not.toBeNull();
    // The arrow renders its glyph as text (orientation follows the arrangement),
    // with the label as real text beside it.
    expect(container.textContent).toContain('→');
    expect(container.textContent).toContain('next');
  });

  it('renders no inline flex-direction, leaving orientation entirely to CSS', () => {
    const { container } = render(
      <ViewSettingsProvider>
        <FlowRenderer spec={spec} view={view} />
      </ViewSettingsProvider>,
    );
    const rows = container.querySelectorAll<HTMLElement>(`.${flowClasses.stageRow}`);
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      // The component must not pin a direction inline — the stylesheet owns it.
      expect(row.style.flexDirection).toBe('');
    });
  });
});

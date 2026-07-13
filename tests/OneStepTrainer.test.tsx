import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ViewSettingsProvider } from '../src/theme';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OneStepTrainer } from 'mlblocks';

function setup(overrides: Partial<Parameters<typeof OneStepTrainer>[0]> = {}) {
  const props = {
    seed: 1,
    onSeedChange: vi.fn(),
    lr: 0.5,
    onLrChange: vi.fn(),
    examplesLength: 20,
    step: 7,
    onStep: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
  render(
    <ViewSettingsProvider>
      <OneStepTrainer {...props} />
    </ViewSettingsProvider>,
  );
  return props;
}

afterEach(cleanup);

describe('OneStepTrainer (Ant Design controls)', () => {
  it('drives the step actions through the buttons', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /step \+1/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+10/ }));
    fireEvent.click(screen.getByRole('button', { name: /epoch/i }));
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(props.onStep).toHaveBeenNthCalledWith(1, 1);
    expect(props.onStep).toHaveBeenNthCalledWith(2, 10);
    expect(props.onStep).toHaveBeenNthCalledWith(3, props.examplesLength);
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  // The "n" keyboard shortcut now lives in VimLayer (see VimLayer.test.tsx) so it
  // works even when this panel is closed.

  it('shows the step and epoch statistics', () => {
    setup({ step: 45, examplesLength: 20 });
    // step = 45, epoch = floor(45/20) = 2, 5 examples into epoch 2. The stats
    // are headless View/Text now, so assert the rendered text, not antd classes.
    const text = document.body.textContent ?? '';
    expect(text).toContain('45');
    expect(text).toContain('Epoch 2 progress');
    expect(text).toContain('5/20 examples');
  });
});

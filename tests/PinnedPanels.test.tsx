import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';

import { PinnedPanelsProvider, Panel } from 'mlblocks';
import { ViewSettingsProvider } from '../src/theme';

afterEach(cleanup);

/** antd's Dropdown opens on the full pointer press, not a bare click. */
function openMenu() {
  const t = screen.getByRole('button', { name: 'Panel actions' });
  fireEvent.mouseDown(t);
  fireEvent.mouseUp(t);
  fireEvent.click(t);
}

const renderPanel = () =>
  render(
    <ViewSettingsProvider>
      <PinnedPanelsProvider>
        <Panel title="Alpha" step={1} dimmed={false}>
          <span>BODY-A</span>
        </Panel>
      </PinnedPanelsProvider>
    </ViewSettingsProvider>,
  );

describe('panel pin + maximize', () => {
  it('offers a ⋮ menu with Pin and Maximize (f)', async () => {
    renderPanel();
    openMenu();
    expect(await screen.findByRole('menuitem', { name: /Pin/ })).toBeTruthy();
    const max = screen.getByRole('menuitem', { name: /Maximize/ });
    expect(max.textContent).toContain('f'); // its accelerator is shown
  });

  it('pins a live copy into the RHS drawer and keeps the original in place', async () => {
    const { container } = renderPanel();
    expect(screen.getAllByText('BODY-A')).toHaveLength(1);
    expect(container.querySelector('aside[data-open="true"]')).toBeNull();

    openMenu();
    fireEvent.click(await screen.findByRole('menuitem', { name: /Pin/ }));

    // Drawer open, and the body now renders in two places (flow + drawer).
    expect(container.querySelector('aside[data-open="true"]')).toBeTruthy();
    expect(screen.getAllByText('BODY-A')).toHaveLength(2);
  });

  it('unpins from the menu, restoring the single copy', async () => {
    const { container } = renderPanel();
    openMenu();
    fireEvent.click(await screen.findByRole('menuitem', { name: /Pin/ }));
    expect(screen.getAllByText('BODY-A')).toHaveLength(2);

    openMenu(); // the item now reads "Unpin"
    fireEvent.click(await screen.findByRole('menuitem', { name: /Unpin/ }));
    expect(container.querySelector('aside[data-open="true"]')).toBeNull();
    expect(screen.getAllByText('BODY-A')).toHaveLength(1);
  });

  it('Ctrl+G toggles the drawer while panels stay pinned; the hide button collapses it', async () => {
    const { container } = renderPanel();
    openMenu();
    fireEvent.click(await screen.findByRole('menuitem', { name: /Pin/ }));
    expect(container.querySelector('aside[data-open="true"]')).toBeTruthy();

    // Ctrl+G hides the drawer — the copy stays mounted (just off-screen), still pinned.
    fireEvent.keyDown(document, { key: 'g', ctrlKey: true });
    expect(container.querySelector('aside[data-open="true"]')).toBeNull();
    expect(screen.getAllByText('BODY-A')).toHaveLength(2);

    // Ctrl+G again brings it back.
    fireEvent.keyDown(document, { key: 'g', ctrlKey: true });
    expect(container.querySelector('aside[data-open="true"]')).toBeTruthy();

    // The header hide button collapses it too.
    fireEvent.click(screen.getByLabelText('Hide pinned panels (Ctrl+G)'));
    expect(container.querySelector('aside[data-open="true"]')).toBeNull();
  });

  it('maximizes into the overlay via the f accelerator', async () => {
    const { container } = renderPanel();
    // overlay is a fixed div, closed initially
    expect(container.querySelector('div[data-open="true"]')).toBeNull();
    openMenu();
    await screen.findByRole('menuitem', { name: /Maximize/ });
    fireEvent.keyDown(document, { key: 'f' });

    expect(container.querySelector('div[data-open="true"]')).toBeTruthy();
    expect(screen.getAllByText('BODY-A')).toHaveLength(2); // flow + overlay copy
  });
});

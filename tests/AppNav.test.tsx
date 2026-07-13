import { render, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import App from '../src/App';
import { ViewSettingsProvider } from '../src/theme';

function renderApp() {
  return render(
    <ViewSettingsProvider>
      <MemoryRouter initialEntries={['/bigram/training/scalar']}>
        <App />
      </MemoryRouter>
    </ViewSettingsProvider>
  );
}

afterEach(cleanup);

describe('App nav shell', () => {
  it('renders the sidebar open by default', () => {
    renderApp();
    const sider = document.querySelector('.ant-layout-sider');
    expect(sider).not.toBeNull();
    expect(sider!.classList.contains('ant-layout-sider-collapsed')).toBe(false);
  });

  it('toggles the sidebar with Ctrl+H', () => {
    renderApp();
    fireEvent.keyDown(window, { key: 'h', ctrlKey: true });
    expect(document.querySelector('.ant-layout-sider-collapsed')).not.toBeNull();
    fireEvent.keyDown(window, { key: 'h', ctrlKey: true });
    expect(document.querySelector('.ant-layout-sider-collapsed')).toBeNull();
  });

  it('renders the header with the app title and GitHub link', () => {
    const { getByRole } = renderApp();
    expect(getByRole('heading', { name: 'LLM Viz' })).toBeInTheDocument();
    const github = getByRole('link', { name: 'View source on GitHub' });
    expect(github).toHaveAttribute('href', expect.stringContaining('github.com'));
  });

  it('toggles the sidebar from the header hamburger', () => {
    const { getByRole } = renderApp();
    const toggle = getByRole('button', { name: 'Hide navigation' });
    fireEvent.click(toggle);
    expect(document.querySelector('.ant-layout-sider-collapsed')).not.toBeNull();
    fireEvent.click(getByRole('button', { name: 'Show navigation' }));
    expect(document.querySelector('.ant-layout-sider-collapsed')).toBeNull();
  });

  it('ignores Ctrl+H while typing in a field', () => {
    renderApp();
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'h', ctrlKey: true });
    expect(document.querySelector('.ant-layout-sider-collapsed')).toBeNull();
    input.remove();
  });
});

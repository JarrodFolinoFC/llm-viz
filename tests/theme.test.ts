import { describe, expect, it } from 'vitest';
import { theme as antdAlgorithms } from 'antd';

import { antdTheme, buildAntdTheme } from '../src/theme';
import { resolveThemeColors } from '../src/theme';

const light = resolveThemeColors('light');

describe('antdTheme', () => {
  it('maps highlight to colorPrimary', () => {
    expect(antdTheme.token?.colorPrimary).toBe(light['highlight']);
  });

  it('maps status token foregrounds', () => {
    expect(antdTheme.token?.colorSuccess).toBe(light['success-fg']);
    expect(antdTheme.token?.colorWarning).toBe(light['warning-fg']);
    expect(antdTheme.token?.colorError).toBe(light['error-fg']);
    expect(antdTheme.token?.colorInfo).toBe(light['info-fg']);
  });

  it('maps text, surface, and border tokens', () => {
    expect(antdTheme.token?.colorText).toBe(light['text-primary']);
    expect(antdTheme.token?.colorTextSecondary).toBe(light['text-secondary']);
    expect(antdTheme.token?.colorBgContainer).toBe(light['bg-page']);
    expect(antdTheme.token?.colorBorder).toBe(light['border-default']);
  });

  it('uses numeric radius and font size for antd', () => {
    expect(antdTheme.token?.borderRadius).toBe(4);
    expect(antdTheme.token?.fontSize).toBe(16);
  });

  it('selects the matching algorithm per mode', () => {
    expect(buildAntdTheme('light').algorithm).toBe(antdAlgorithms.defaultAlgorithm);
    expect(buildAntdTheme('dark').algorithm).toBe(antdAlgorithms.darkAlgorithm);
  });

  it('resolves distinct hex per mode', () => {
    expect(resolveThemeColors('dark')['bg-page']).not.toBe(light['bg-page']);
  });
});

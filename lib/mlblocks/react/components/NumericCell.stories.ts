import type { Meta, StoryObj } from '@storybook/react-vite';

// Data-driven colours pass through as raw CSS values (stories mirror the app's
// shared-ui var references without importing its theme object).
const color = {
  success: { fg: 'var(--c-success-fg)' },
  error: { fg: 'var(--c-error-fg)' },
  text: { emphasis: 'var(--c-text-emphasis)', primary: 'var(--c-text-primary)' },
} as const;
import { NumericCell } from './NumericCell';

const meta = {
  title: 'Core/NumericCell',
  component: NumericCell,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    decimals: { control: { type: 'number', min: 0, max: 6 } },
    signed: { control: 'boolean' },
    prefix: { control: 'text' },
    isHighlighted: { control: 'boolean' },
    colorFn: { control: false },
  },
  args: {
    value: 0.42,
  },
} satisfies Meta<typeof NumericCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 0.42,
  },
};

export const Signed: Story = {
  args: {
    value: 1.5,
    signed: true,
  },
};

export const Negative: Story = {
  args: {
    value: -2.34,
    signed: true,
  },
};

export const WithPrefix: Story = {
  args: {
    value: 19.99,
    prefix: '$',
  },
};

export const FourDecimals: Story = {
  args: {
    value: 0.123456,
    decimals: 4,
  },
};

// `colorFn` receives the value and whether the cell is highlighted, returning a
// color string. Here positives are green, negatives red.
export const ColorCoded: Story = {
  args: {
    value: -0.8,
    signed: true,
    colorFn: (v) => (v >= 0 ? color.success.fg : color.error.fg),
  },
};

export const Highlighted: Story = {
  args: {
    value: 0.95,
    isHighlighted: true,
    colorFn: (_v, isHighlighted) =>
      isHighlighted ? color.text.emphasis : color.text.primary,
  },
};

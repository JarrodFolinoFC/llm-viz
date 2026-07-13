import type { Meta, StoryObj } from '@storybook/react-vite';

import { ColumnGrid } from 'mlblocks';

const vocab = ['the', 'cat', 'sat', '.'];

// A few numeric columns (logit, eˣ, probability) over the vocab rows.
const columns = [
  { label: 'logit', cells: vocab.map((_, i) => ({ value: (i - 1.5) / 2, signed: true })) },
  { label: 'eˣ', cells: vocab.map((_, i) => ({ value: Math.exp((i - 1.5) / 2) })) },
  { label: 'p', cells: vocab.map((_, i) => ({ value: (i + 1) / 10 })) },
];

const meta = {
  title: 'Flow/ColumnGrid',
  component: ColumnGrid,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    highlightedRow: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    columns: { control: false },
    rowLabels: { control: false },
    rowAction: { control: false },
  },
  args: {
    columns,
    rowLabels: vocab,
  },
} satisfies Meta<typeof ColumnGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// `highlightedRow` bolds one row to track the active token.
export const HighlightedRow: Story = {
  args: { highlightedRow: 1 },
};

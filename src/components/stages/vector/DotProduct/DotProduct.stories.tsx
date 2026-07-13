import type { Meta, StoryObj } from '@storybook/react-vite';

import { DotProduct } from './index';

const vocab = ['the', 'cat', 'sat', '.'];
const EBefore = vocab.map((_, i) => [Math.sin(i) / 2, Math.cos(i) / 2]);
const UBefore = vocab.map((_, i) => [Math.cos(i) / 2, Math.sin(i) / 2]);
// [logit, eˣ, prob] per candidate next token.
const logits = vocab.map((_, j) => EBefore[0][0] * UBefore[j][0] + EBefore[0][1] * UBefore[j][1]);
const exps = logits.map((l) => Math.exp(l));
const sum = exps.reduce((a, b) => a + b, 0);
const softmaxRows = vocab.map((_, j) => [logits[j], exps[j], exps[j] / sum]);

// e_a · u_b for every candidate b → the logits, then their softmax.
const meta = {
  title: 'Stages/Vector/DotProduct',
  component: DotProduct,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
    showSum: { control: 'boolean' },
    phase: { control: 'text' },
    vocab: { control: false },
    flash: { control: false },
    currentPair: { control: false },
    EBefore: { control: false },
    UBefore: { control: false },
    softmaxRows: { control: false },
  },
  args: {
    vocab,
    step: 5,
    dimmed: false,
    flash: null,
    currentPair: { prev: 0, target: 2 },
    EBefore,
    UBefore,
    softmaxRows,
  },
} satisfies Meta<typeof DotProduct>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSum: Story = {
  args: { showSum: true },
};

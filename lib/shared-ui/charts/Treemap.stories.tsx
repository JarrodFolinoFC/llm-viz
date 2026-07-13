import type { Meta, StoryObj } from '@storybook/react-vite';
import { aud } from '../format';
import { Treemap } from './Treemap';

/**
 * A dependency-free treemap. Cells are laid out with the squarified algorithm so
 * each area is proportional to its value while staying close to square. Labels
 * and values render only where the cell is big enough; every cell has a tooltip.
 * Zero/negative slices are dropped, and an all-zero dataset shows an empty note.
 */
const meta = {
  title: 'Charts/Treemap',
  component: Treemap,
  parameters: { layout: 'centered' },
  argTypes: {
    width: { control: { type: 'number', min: 120, max: 480, step: 10 } },
    height: { control: { type: 'number', min: 80, max: 360, step: 10 } },
    format: { control: false },
  },
  args: {
    title: 'Where the money went',
    width: 320,
    height: 220,
    format: aud,
    data: [
      { label: 'Groceries', value: 1240 },
      { label: 'Eating Out', value: 860 },
      { label: 'Transport', value: 420 },
      { label: 'Utilities', value: 380 },
      { label: 'Entertainment', value: 210 },
      { label: 'Other', value: 95 },
    ],
  },
} satisfies Meta<typeof Treemap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

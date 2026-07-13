import type { Meta, StoryObj } from '@storybook/react-vite';
import { aud } from '../format';
import { LineChart } from './LineChart';

const weeks = ['1 Jan', '8 Jan', '15 Jan', '22 Jan', '29 Jan', '5 Feb', '12 Feb', '19 Feb'];

const series = (label: string, values: number[]) => ({
  label,
  points: values.map((value, i) => ({ label: weeks[i], value })),
});

/**
 * A dependency-free multi-series line chart. Every series is one `<polyline>`
 * over a shared x-axis (point index → label), with a hover dot per point and a
 * legend when more than one series is shown.
 */
const meta = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    height: { control: { type: 'number', min: 120, max: 480, step: 20 } },
    format: { control: false },
  },
  args: {
    title: 'Weekly spending',
    height: 240,
    format: aud,
    series: [
      series('Eating Out', [120, 86, 140, 60, 95, 210, 70, 130]),
      series('Groceries', [180, 160, 210, 175, 190, 230, 205, 188]),
      series('Transport', [40, 55, 38, 62, 44, 50, 35, 58]),
    ],
  },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

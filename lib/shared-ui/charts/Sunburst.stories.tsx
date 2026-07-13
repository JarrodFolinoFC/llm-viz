import type { Meta, StoryObj } from '@storybook/react-vite';
import { formatBytes } from '../format';
import { Sunburst } from './Sunburst';

/**
 * A dependency-free sunburst for hierarchies. Each ring is one level of the tree
 * and each arc's sweep is proportional to its (recursively summed) value. Hue
 * comes from the top-level ancestor and lightens with depth; hover an arc to
 * highlight it and read its share in the centre, click a directory to zoom in,
 * click the centre to zoom back out. Feeds straight off a raw size tree.
 */
const meta = {
  title: 'Charts/Sunburst',
  component: Sunburst,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: { type: 'number', min: 240, max: 600, step: 20 } },
    rings: { control: { type: 'number', min: 2, max: 6, step: 1 } },
    format: { control: false },
  },
  args: {
    size: 420,
    rings: 4,
    format: formatBytes,
    data: {
      name: 'Downloads',
      children: [
        {
          name: 'projects',
          children: [
            { name: 'app', children: [{ name: 'node_modules', value: 480_000_000 }, { name: 'src', value: 24_000_000 }] },
            { name: 'archive.zip', value: 210_000_000 },
          ],
        },
        {
          name: 'media',
          children: [
            { name: 'talk.mp4', value: 320_000_000 },
            { name: 'photos', children: [{ name: 'trip', value: 140_000_000 }, { name: 'screenshots', value: 36_000_000 }] },
          ],
        },
        { name: 'installer.dmg', value: 180_000_000 },
        { name: 'notes.pdf', value: 3_200_000 },
      ],
    },
  },
} satisfies Meta<typeof Sunburst>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

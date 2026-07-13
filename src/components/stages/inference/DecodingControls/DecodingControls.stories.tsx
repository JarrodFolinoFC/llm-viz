import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DecodingControls } from './index';
import { DEFAULT_DECODING, type Decoding } from '../decoding';

// The decoding knobs shared by every inference page: temperature + greedy/sample.
const meta = {
  title: 'Panels/DecodingControls',
  component: DecodingControls,
  args: { value: DEFAULT_DECODING, onChange: () => {} },
} satisfies Meta<typeof DecodingControls>;

export default meta;
type Story = StoryObj<typeof meta>;

function Stateful() {
  const [value, setValue] = useState<Decoding>(DEFAULT_DECODING);
  return <DecodingControls value={value} onChange={setValue} />;
}

export const Default: Story = { render: () => <Stateful /> };

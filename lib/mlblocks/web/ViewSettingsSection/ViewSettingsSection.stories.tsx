import type { Meta, StoryObj } from '@storybook/react-vite';

import { ViewSettingsSection } from './index';

// The view-settings controls (panel size, precision, arrows/actions toggles,
// colour overrides). Reads/writes the shared useViewSettings store.
const meta = {
  title: 'App/ViewSettingsSection',
  component: ViewSettingsSection,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ViewSettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

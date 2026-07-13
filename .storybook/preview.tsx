import type { Preview } from '@storybook/react-vite'
import 'katex/dist/katex.min.css'
import 'mlblocks/style.css'

import { ViewSettingsProvider } from '../src/theme'
// Side-effect: register the app's tensor vocabulary for the filter stories.
import '../src/training/params'

const preview: Preview = {
  decorators: [
    // ViewSettingsProvider is mlblocks' web composition: the primitives
    // renderer, cookie-backed view settings, the TrainerSettings bridge, and
    // antd's ConfigProvider + App — the same environment main.tsx mounts.
    (Story) => (
      <ViewSettingsProvider>
        <Story />
      </ViewSettingsProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;

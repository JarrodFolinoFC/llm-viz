import type { Meta, StoryObj } from '@storybook/react-vite'
import { DownloadOutlined } from '@ant-design/icons'

import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'shared-ui/Button',
  component: Button,
  args: { children: 'Click me' },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['default', 'primary', 'dashed', 'text', 'link'],
    },
  },
}

export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { type: 'primary' } }
export const Default: Story = { args: { type: 'default' } }
export const Text: Story = { args: { type: 'text' } }
export const WithIcon: Story = { args: { type: 'primary', icon: <DownloadOutlined />, children: 'Download' } }
export const Disabled: Story = { args: { type: 'primary', disabled: true } }

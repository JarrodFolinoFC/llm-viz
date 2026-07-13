import type { Meta, StoryObj } from '@storybook/react-vite'
import { VimLayer } from 'vimium-layer'

import { Button } from '../Button'
import { Link } from '../Link'
import { ClickableIcon } from '../ClickableIcon'
import { AppIcon } from '../AppIcon'

/**
 * The shared interactive primitives, each a *native* vim-hint target: press `f`
 * to enter hint mode and every one paints its own label (a subtle corner/inline
 * badge) instead of the VimLayer's floating yellow chip. Type a label to
 * activate that element.
 */
function Demo() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 640 }}>
      <VimLayer />
      <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
        Press <kbd>f</kbd>, then type a label. Each label sits on its component.
      </p>

      <section style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button type="primary" onClick={() => alert('primary')}>
          Save
        </Button>
        <Button onClick={() => alert('secondary')}>Cancel</Button>
        <Button type="text" onClick={() => alert('ghost')}>
          More
        </Button>
      </section>

      <section style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <Link href="#docs">Documentation</Link>
        <Link href="#repo">Repository</Link>
        <span>
          Inline <Link href="#inline">link inside a sentence</Link> keeps the label ahead of it.
        </span>
      </section>

      <section style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <ClickableIcon icon="BellOutlined" label="Alerts" size={22} onClick={() => alert('alerts')} />
        <ClickableIcon icon="CalendarOutlined" label="Calendar" size={22} onClick={() => alert('calendar')} />
        <ClickableIcon icon="DownloadOutlined" label="Download" size={22} onClick={() => alert('download')} />
        {/* Clickable AppIcon on a colored tile — corner label, like the switcher. */}
        <span
          style={{
            display: 'inline-flex',
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#7c3aed',
            color: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="BookOutlined" label="Notes" onClick={() => alert('notes')} style={{ fontSize: 24 }} />
        </span>
      </section>
    </div>
  )
}

const meta: Meta<typeof Demo> = {
  title: 'shared-ui/Vim native hints',
  component: Demo,
}

export default meta

type Story = StoryObj<typeof Demo>

export const Playground: Story = {}

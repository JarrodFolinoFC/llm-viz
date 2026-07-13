import { useCallback } from 'react';
import { Tabs as AntdTabs } from 'antd';
import type { TabsProps as AntdTabsProps } from 'antd';
import { useVimHint } from 'vimium-layer';

import { HintText } from './vim/HintText';
import { hintWord } from './vim/hintWord';

export type TabsProps = AntdTabsProps;

/** A tab title wired as its own vim hint: in hint mode its leading letters light
 *  up as the keys to press (see {@link HintText}); typing them selects the tab.
 *  The label is a `prefix` request, so colliding titles extend to more real
 *  letters ("lon"/"loc") rather than getting a digit. */
function TabHintLabel({ text }: { text: string }) {
  const { ref, hint } = useVimHint({ prefix: hintWord(text) });
  // antd renders the clickable tab as `.ant-tabs-tab-btn` (role="tab"); reach it
  // from this label span and register it, so the layer excludes it from its DOM
  // scan (no floating chip) and a typed label clicks the right tab.
  const setRef = useCallback(
    (node: HTMLSpanElement | null) => {
      ref(node ? node.closest<HTMLElement>('.ant-tabs-tab-btn') : null);
    },
    [ref],
  );
  return (
    <span ref={setRef}>
      <HintText text={text} hint={hint} />
    </span>
  );
}

/**
 * antd's `Tabs` with the vim layer designed in: instead of the layer floating a
 * chip over each tab, every string-labelled tab hints as its own leading letters
 * — "World" reads as a lit **Wo**rld and typing `wo` selects it. A near-drop-in
 * for antd's `Tabs` (same `items` / `activeKey` / `onChange` API); non-string
 * labels (custom nodes) are passed through untouched and fall back to the layer's
 * default overlay hint.
 */
export function Tabs({ items, ...rest }: TabsProps) {
  const hinted = items?.map((item) =>
    typeof item.label === 'string' && hintWord(item.label)
      ? { ...item, label: <TabHintLabel text={item.label} /> }
      : item,
  );
  return <AntdTabs items={hinted} {...rest} />;
}

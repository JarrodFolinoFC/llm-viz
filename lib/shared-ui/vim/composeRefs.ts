import type { Ref } from 'react';

/**
 * Compose refs into one callback ref, so a vim-native component can feed its
 * own hint ref *and* honour a ref injected by a wrapper. antd's Tooltip /
 * Popover / Dropdown clone their child with a ref, and in React 19 it arrives
 * as a plain prop — spread via `{...rest}` it would silently *replace* the
 * component's hint ref, un-registering it from the vim layer (which then falls
 * back to a floating overlay chip).
 */
export function composeRefs<T>(...refs: (Ref<T> | null | undefined)[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }
  };
}

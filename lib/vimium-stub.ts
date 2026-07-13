import { useCallback } from 'react';
import type { RefCallback } from 'react';

/**
 * Inert stand-in for the monorepo's `vimium-layer` package (the Vimium-style
 * keyboard layer was dropped when this app went standalone). shared-ui's
 * components still call `useVimHint` and mount `<VimLayer />`, so this module
 * keeps those call sites compiling while guaranteeing hint mode never
 * activates: `hint` is always null, the layer renders nothing, and no key
 * listeners are installed. The components therefore behave as plain antd.
 */

export interface NativeHintView {
  /** The full assigned label, e.g. "sa". */
  label: string;
  /** Portion of the label already typed (always a prefix of `label`). */
  typed: string;
  /** Whether `label` still starts with `typed` — i.e. still a candidate. */
  matched: boolean;
}

export interface UseVimHintOptions {
  onActivate?: () => void;
  disabled?: boolean;
  label?: string;
  prefix?: string;
}

export interface UseVimHintResult {
  ref: RefCallback<HTMLElement>;
  hint: NativeHintView | null;
  active: boolean;
}

export function useVimHint(options: UseVimHintOptions = {}): UseVimHintResult {
  void options;
  const ref = useCallback<RefCallback<HTMLElement>>(() => {}, []);
  return { ref, hint: null, active: false };
}

export interface VimLayerProps {
  onStep?: (n: number) => void;
  bindings?: Record<string, () => void>;
}

export function VimLayer(props: VimLayerProps) {
  void props;
  return null;
}

export function acquireVimKeyboard(): () => void {
  return () => {};
}

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ElementType,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import styles from './sensitive.module.css';

export interface SensitiveContextValue {
  /** When true, sensitive info (financial figures, …) is blurred. */
  hidden: boolean;
  setHidden: (v: boolean) => void;
  /** Flip between hidden and shown. */
  toggle: () => void;
}

/** What {@link useSensitive} returns, plus whether a provider is actually mounted
 *  — surfaces (Settings, the ⋮ menu) use `available` to only show the toggle
 *  where it does something. */
export type UseSensitive = SensitiveContextValue & { available: boolean };

// Null default (rather than a working stub) so `useSensitive` can tell whether a
// provider is present — an app that composes its own root (llm-trainer) has none,
// and shouldn't render a dead toggle.
const Ctx = createContext<SensitiveContextValue | null>(null);

export function useSensitive(): UseSensitive {
  const ctx = useContext(Ctx);
  return ctx
    ? { ...ctx, available: true }
    : { hidden: false, setHidden: () => {}, toggle: () => {}, available: false };
}

const COOKIE = 'hideSensitive';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

/**
 * The global "Hide sensitive information" setting — the privacy sibling of the
 * light/dark {@link ThemeProvider}. Off by default (`hideSensitive` cookie `'1'`
 * when on), persisted across the shared origin so it holds in every app. Part of
 * the standard `mountApp` chrome, so every first-party app gets it.
 *
 * It doesn't render anything itself; the {@link Sensitive} component reads this
 * to blur its children. Across the module-federation boundary (home's panels)
 * React context can't reach a remote's own shared-ui copy, so the host threads
 * the flag in as a prop instead — see {@link RemotePanelProps}.
 */
export function SensitiveProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState<boolean>(() => readCookie(COOKIE) === '1');

  const toggle = () => setHidden((h) => !h);

  useEffect(() => {
    writeCookie(COOKIE, hidden ? '1' : '0');
  }, [hidden]);

  return <Ctx.Provider value={{ hidden, setHidden, toggle }}>{children}</Ctx.Provider>;
}

export interface SensitiveProps {
  children: ReactNode;
  /**
   * Force the blurred state, overriding the global setting. Used across the
   * module-federation boundary, where a remote panel can't read the host's
   * {@link SensitiveProvider} context — home passes its own `hideSensitive` flag
   * in as a prop (see {@link RemotePanelProps}). Omit inside a normal app to follow the
   * global "Hide sensitive information" toggle.
   */
  hidden?: boolean;
  /** Wrapper element (default `span`, so it sits inline with surrounding text). */
  as?: ElementType;
  className?: string;
}

/**
 * Blur its children when sensitive info is hidden — the shared primitive for the
 * global "Hide sensitive information" setting. Wrap any figure you want masked (a
 * balance, a total) in this; it follows the global {@link SensitiveProvider}
 * toggle, or an explicit `hidden` prop when one is given.
 *
 * Blurred content is inert (not selectable) so the number can't be read or copied
 * while hidden. This is a display-level mask for shoulder-surfing / screenshots,
 * not a security boundary — the value still exists in the DOM.
 */
export function Sensitive({ children, hidden, as: Tag = 'span', className }: SensitiveProps) {
  const ctx = useSensitive();
  const blurred = hidden ?? ctx.hidden;
  return (
    <Tag
      className={clsx(styles.sensitive, blurred && styles.blurred, className)}
      title={blurred ? 'Hidden — turn off “Hide sensitive information” to reveal' : undefined}
    >
      {children}
    </Tag>
  );
}

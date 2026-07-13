/**
 * The parameter/tensor axis of the page filter — a third filter alongside the
 * training stage and the panel kind. Each flow panel can be tagged with the
 * tensors it involves (see `PanelNode.tensors`); the "Parameters" group of
 * the filter bar then shows/hides panels by tensor, so you can isolate "just
 * everything that touches W₁" across the whole flow.
 *
 * The vocabulary is CONSUMER-REGISTERED: the framework hardcodes no model's
 * tensor names. An app declares its tensors once at startup —
 *
 *     registerParams([
 *       ['E',  { label: 'E',  color: '#0EA5E9' }],
 *       ['W1', { label: 'W₁', color: '#4169E1' }],
 *       …
 *     ]);
 *
 * — in every entrypoint that renders flows (main, test setup, storybook
 * preview; module state resets per entry). Order of registration is the
 * canonical toggle order. Unregistered keys degrade gracefully (their own name
 * in a neutral slate), so stories and tests render without registration.
 */

/** A consumer-defined tensor key (e.g. 'E', 'W1', 'Whh'). */
export type ParamTensor = string;

export interface ParamMeta {
  /** Human-readable label shown on the toggle. */
  label: string;
  /** Accent colour for the toggle's shown state. */
  color: string;
}

const order: ParamTensor[] = [];
const meta = new Map<ParamTensor, ParamMeta>();

/**
 * Declare the app's tensors in canonical layout order. Call once per
 * entrypoint, before any flow renders; repeat registrations of the same key
 * update its meta without duplicating the order.
 */
export function registerParams(entries: ReadonlyArray<readonly [ParamTensor, ParamMeta]>): void {
  for (const [key, m] of entries) {
    if (!meta.has(key)) order.push(key);
    meta.set(key, m);
  }
}

/** Registered tensors in registration (canonical) order. */
export function paramOrder(): ParamTensor[] {
  return [...order];
}

const NEUTRAL = '#64748B';

/** A tensor's meta; unknown keys degrade to their own name in neutral slate. */
export function paramMeta(key: ParamTensor): ParamMeta {
  return meta.get(key) ?? { label: key, color: NEUTRAL };
}

/** Is this a registered tensor key? (Cookie-value validation.) */
export function isParamTensor(key: string): boolean {
  return meta.has(key);
}

/** Registered keys as a Set (the cookie filters validate against it live). */
export function paramSet(): ReadonlySet<string> {
  return new Set(order);
}

/**
 * Wrap a LaTeX token in the parameter's identity colour — the same accent the
 * filter labels use — so a parameter reads as the same hue wherever it heads a
 * panel: the weights row, its ∇ gradient, and its after-step value. Derived
 * quantities (activations x / z₁ / h, operators) are left uncoloured by simply
 * not wrapping them, keeping colour == "parameter".
 */
export function paramTex(key: ParamTensor, tex: string): string {
  return `\\textcolor{${paramMeta(key).color}}{${tex}}`;
}

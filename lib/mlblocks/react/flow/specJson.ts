import type { FlowLayoutOpts, FlowNode, FlowSpec, GridNode, GridRowNode } from './spec';

/**
 * Flow layouts as JSON. A `.spec.json` file holds ONLY arrangement — named
 * panels, arrows, layout containers — while everything computational stays in
 * code: the panels (component + view-model getter) live in a registry the
 * flow module builds, and the JSON references them by name. This is the line
 * the spec DSL always drew (specs are data, bindings are code), pushed to its
 * end: the data half now lives in a file you can edit without touching TS.
 *
 * Node forms:
 *   "wPanel"                                — a registry node, by name
 *   { "arrow": "h·W₂+b₂" }                  — a labelled connector
 *   { "lossSlot": true }                     — the shell-provided loss panel
 *   { "flex": {…opts}, "children": […] }     — a row/column (opts as in FlowLayoutOpts;
 *                                              "className" is a registry.classNames key)
 *   { "grid": {rowGap, columnGap}, "rows": [{"span"?, "cells": […]}] }
 *                                            — a column-aligned grid (gaps take
 *                                              registry.spaces token names)
 *   { "annotate": {"node": …, "key": "w1", "dials"?: true} }
 *                                            — wrap a node with its note companions
 *                                              via registry.annotate
 *
 * Loading is build-time (`import spec from './x.spec.json'`) and validation
 * is eager: unknown names, keys or shapes throw at module load, so a typo
 * fails tests and dev boot, never a user's render.
 */
export interface JsonSpecRegistry<V> {
  /** Named nodes — panels or composite stacks, already bound to the view. */
  nodes: Record<string, FlowNode<V>>;
  /** Wrap a node with its note companions (flows with annotations provide it). */
  annotate?: (node: FlowNode<V>, key: string, dials?: boolean) => FlowNode<V>;
  /** className lookup for flex nodes (CSS-module classes can't live in JSON). */
  classNames?: Record<string, string>;
  /** Space-token values for grid gaps (e.g. { lg: 24, sm: 8 }). */
  spaces?: Record<string, number | string>;
}

const fail = (path: string, msg: string): never => {
  throw new Error(`specFromJson: ${msg} at ${path}`);
};

const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

const FLEX_OPTS = ['gap', 'wrap', 'align', 'justify', 'vertical'] as const;

function parseNode<V>(json: unknown, registry: JsonSpecRegistry<V>, path: string): FlowNode<V> {
  if (typeof json === 'string') {
    const node = registry.nodes[json];
    if (!node) return fail(path, `unknown node "${json}" (registry has: ${Object.keys(registry.nodes).join(', ')})`);
    return node;
  }
  if (!isObject(json)) return fail(path, `expected a node name or object, got ${JSON.stringify(json)}`);

  if ('arrow' in json) {
    if (typeof json.arrow !== 'string') return fail(path, `"arrow" must be a string label`);
    return { kind: 'arrow', label: json.arrow };
  }

  if ('lossSlot' in json) return { kind: 'lossSlot' };

  if ('annotate' in json) {
    const a = json.annotate;
    if (!isObject(a) || typeof a.key !== 'string') return fail(path, `"annotate" needs { node, key }`);
    if (!registry.annotate) return fail(path, `"annotate" used but the registry provides no annotate builder`);
    const target = parseNode(a.node, registry, `${path}.annotate.node`);
    return registry.annotate(target, a.key, a.dials === true);
  }

  if ('flex' in json) {
    const opts = json.flex;
    if (!isObject(opts)) return fail(path, `"flex" must be an options object`);
    if (!Array.isArray(json.children)) return fail(path, `"flex" needs a "children" array`);
    const layout: FlowLayoutOpts = {};
    for (const k of FLEX_OPTS) {
      if (k in opts) (layout as Record<string, unknown>)[k] = opts[k];
    }
    if ('className' in opts) {
      const key = opts.className;
      const cls = typeof key === 'string' ? registry.classNames?.[key] : undefined;
      if (!cls) return fail(path, `unknown className "${String(key)}"`);
      layout.className = cls;
    }
    return {
      kind: 'layout',
      flowRow: true,
      ...layout,
      children: json.children.map((c, i) => parseNode(c, registry, `${path}.children[${i}]`)),
    };
  }

  if ('grid' in json) {
    const props = json.grid;
    if (!isObject(props)) return fail(path, `"grid" must be a props object`);
    if (!Array.isArray(json.rows)) return fail(path, `"grid" needs a "rows" array`);
    const gap = (v: unknown, name: string): number | string | undefined => {
      if (v === undefined) return undefined;
      if (typeof v === 'number') return v;
      const resolved = typeof v === 'string' ? registry.spaces?.[v] : undefined;
      if (resolved === undefined) return fail(path, `unknown space token ${JSON.stringify(v)} for "${name}"`);
      return resolved;
    };
    const grid: GridNode<V> = {
      kind: 'grid',
      props: { rowGap: gap(props.rowGap, 'rowGap'), columnGap: gap(props.columnGap, 'columnGap') },
      rows: json.rows.map((r, i) => parseRow(r, registry, `${path}.rows[${i}]`)),
    };
    return grid;
  }

  return fail(path, `unrecognised node ${JSON.stringify(Object.keys(json))}`);
}

function parseRow<V>(json: unknown, registry: JsonSpecRegistry<V>, path: string): GridRowNode<V> {
  if (!isObject(json) || !Array.isArray(json.cells)) return fail(path, `grid row needs a "cells" array`);
  return {
    kind: 'gridRow',
    ...(json.span === true ? { span: true } : {}),
    cells: json.cells.map((c, i) => parseNode(c, registry, `${path}.cells[${i}]`)),
  };
}

/** Build a {@link FlowSpec} from an imported `.spec.json` + the flow's registry. */
export function specFromJson<V>(json: unknown, registry: JsonSpecRegistry<V>): FlowSpec<V> {
  return parseNode(json, registry, '$');
}

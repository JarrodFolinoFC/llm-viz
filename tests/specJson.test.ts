import { describe, it, expect } from 'vitest';

import { specFromJson, TrainingStage, type FlowNode } from 'mlblocks';

const aPanel: FlowNode<unknown> = {
  kind: 'panel',
  stage: TrainingStage.Data,
  panelKind: 'standard',
  tensors: ['W'],
  render: () => null,
};

const registry = { nodes: { aPanel }, spaces: { lg: 24, sm: 8 } };

describe('specFromJson', () => {
  it('builds the node kinds from their JSON forms', () => {
    const spec = specFromJson(
      {
        grid: { rowGap: 'lg', columnGap: 'sm' },
        rows: [
          { span: true, cells: [{ flex: { wrap: true, gap: 'sm' }, children: ['aPanel', { lossSlot: true }] }] },
          { cells: ['aPanel', { arrow: 'x→y' }] },
        ],
      },
      registry,
    );
    expect(spec).toMatchObject({
      kind: 'grid',
      props: { rowGap: 24, columnGap: 8 },
      rows: [
        {
          kind: 'gridRow',
          span: true,
          cells: [{ kind: 'layout', flowRow: true, wrap: true, children: [aPanel, { kind: 'lossSlot' }] }],
        },
        { kind: 'gridRow', cells: [aPanel, { kind: 'arrow', label: 'x→y' }] },
      ],
    });
  });

  it('routes annotate nodes through the registry builder', () => {
    const wrapped: FlowNode<unknown> = { kind: 'layout', children: [aPanel] };
    const seen: unknown[] = [];
    const spec = specFromJson(
      { annotate: { node: 'aPanel', key: 'w1', dials: true } },
      { ...registry, annotate: (node, key, dials) => (seen.push([node, key, dials]), wrapped) },
    );
    expect(spec).toBe(wrapped);
    expect(seen).toEqual([[aPanel, 'w1', true]]);
  });

  it('throws on an unknown node name, with the path and the known names', () => {
    expect(() => specFromJson({ flex: {}, children: ['nope'] }, registry)).toThrow(
      /unknown node "nope".*aPanel.*\$\.children\[0\]/s,
    );
  });

  it('throws on an unknown space token and on annotate without a builder', () => {
    expect(() => specFromJson({ grid: { rowGap: 'xl' }, rows: [] }, registry)).toThrow(/unknown space token "xl"/);
    expect(() => specFromJson({ annotate: { node: 'aPanel', key: 'k' } }, registry)).toThrow(/no annotate builder/);
  });
});

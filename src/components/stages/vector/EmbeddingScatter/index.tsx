import { lazy, Suspense, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Modal } from 'antd';
import { Segmented, Switch } from 'shared-ui';

import { color, useViewSettings } from '../../../../theme';
import { dot } from 'mlblocks/core';
import { Panel, TrainingStage } from 'mlblocks';
import styles from './EmbeddingScatter.module.css';
import type { EmbeddingFlash, EmbeddingModel } from '../../../../training/strategies/embedding';
import type { ModelPoint } from 'mlblocks/react';
import { clamp, fade, project, v3, type Projection } from './geometry';
import { declutterLabels } from './declutterLabels';

// Plotly is heavy (~1MB), so only load it when the user switches to that renderer.
const EmbeddingScatterPlotly = lazy(() => import('./EmbeddingScatterPlotly'));

interface EmbeddingScatterProps {
  vocab: readonly string[];
  /** Current (post-step) V × d embedding matrix (the prev-token vectors). */
  E: number[][];
  /** Pre-step E, to ghost the moved token. */
  EBefore: number[][];
  /** Current unembedding matrix (the next-token vectors). */
  U: number[][];
  /** Pre-step U, to ghost the moved next-token vector. */
  UBefore: number[][];
  step: number;
  flash: EmbeddingFlash | null;
  /** E/U snapshot per recorded step (the trainer's `modelHistory`) — each
   *  displayed vector drags a fading trail of its past positions. */
  history?: ModelPoint<EmbeddingModel>[];
}

const PAD = 32;
const LABEL_GAP = 13;
/** Trails show at most this many recent snapshots — older history declutters away. */
const TRAIL = 40;

/**
 * Scatter of the token vectors. Each prev-token embedding e_a is a filled point
 * (labelled); each next-token unembedding u_b is an amber marker (hover to see
 * the word). Reading the geometry IS reading the model: a logit e_a · u_b is
 * large when the two vectors point the same way, so a word's e sits toward the
 * u of the words that tend to follow it — the seed of attention's QKᵀ.
 *
 * Works at d = 2 (flat) and d = 3 (drag to rotate). An expand button opens a
 * near-fullscreen modal; the inline and modal plots share rotation state.
 *
 * At d = 2 the cloud is decluttered to just the pair being trained this step —
 * the prev token's e_a and the target token's u_b — each ghosted at its
 * pre-step position so the gradient move is the only thing you read.
 */
export function EmbeddingScatter({ vocab, E, EBefore, U, UBefore, step, flash, history }: EmbeddingScatterProps) {
  const { precision } = useViewSettings();
  const dims = E[0]?.length ?? 0;
  const is3d = dims >= 3;
  const [rot, setRot] = useState({ yaw: 0.7, pitch: -0.35 });
  const [open, setOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [renderer, setRenderer] = useState<'svg' | 'plotly'>('svg');
  const drag = useRef<{ x: number; y: number } | null>(null);

  if (dims < 2) return null;

  const usePlotly = is3d && renderer === 'plotly';

  const yaw = is3d ? rot.yaw : 0;
  const pitch = is3d ? rot.pitch : 0;
  // Recent history the trails draw through; it joins the radius so a trail
  // never projects outside the canvas.
  const trail = (history ?? []).slice(-TRAIL);
  const trailPts = trail.flatMap((h) => [...h.model.E, ...h.model.U]);
  const maxR = Math.max(1e-6, ...[...E, ...U, ...trailPts].map((p) => Math.hypot(...v3(p))));
  const active = flash?.prev ?? null;
  const target = flash?.target ?? null;
  // At d = 2, show only the current pair (e_a, u_b); higher d keeps the full cloud.
  const onlyPair = !is3d && active != null && target != null;
  // The logit for the current pair: e_a · u_b — the quantity the model trains on.
  const pairDot = onlyPair ? dot(E[active!], U[target!]) : null;

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!is3d) return;
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setRot((r) => ({ yaw: r.yaw + dx * 0.01, pitch: clamp(r.pitch + dy * 0.01, -1.4, 1.4) }));
  };
  const endDrag = () => { drag.current = null; };

  /** The plot rendered at an arbitrary canvas size; marker/text sizing scales mildly. */
  function plot(size: number) {
    const k = clamp(size / 260, 1, 2); // visual scale for dots/labels
    const scale = (size / 2 - PAD * k) / maxR;
    const c = size / 2;
    const proj: Projection = { yaw, pitch, scale, center: c };
    const gap = LABEL_GAP * k;
    const labelFont = 12 * k;

    // Project E with decluttered label positions (dots stay exact).
    const eIdx = onlyPair ? [active!] : E.map((_, i) => i);
    const uIdx = onlyPair ? [target!] : U.map((_, i) => i);
    const ePts = declutterLabels(
      eIdx.map((i) => ({ i, ...project(E[i], proj) })),
      { center: c, gap, top: PAD / 2, bottom: size - PAD / 2 }
    );
    const uPts = uIdx.map((i) => ({ i, ...project(U[i], proj) }));
    const axes = Array.from({ length: dims }, (_, kk) => {
      const end = (s: number) => { const a = new Array(dims).fill(0); a[kk] = s * maxR; return a; };
      return { k: kk, pos: project(end(1), proj), neg: project(end(-1), proj), label: ['x', 'y', 'z'][kk] };
    });

    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={styles.plotSvg}
        style={{ maxWidth: size, cursor: is3d ? 'grab' : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        aria-label="embedding scatter"
      >
        {axes.map((a) => (
          <g key={a.k}>
            <line x1={a.neg.x} y1={a.neg.y} x2={a.pos.x} y2={a.pos.y} stroke={color.border.default} strokeWidth={1} />
            <text x={a.pos.x} y={a.pos.y} dx={3} fontSize={10 * k} fill={color.text.muted}>{a.label}</text>
          </g>
        ))}

        {/* Fading trails: each displayed vector's path over the recorded steps,
            drawn per segment so old positions fade out and recent ones lead in
            to the live marker. Only the tokens the declutter shows get trails. */}
        {trail.length > 1 && (() => {
          const trailFor = (idx: number[], of: (m: EmbeddingModel) => number[][], stroke: string, prefix: string) =>
            idx.map((i) => {
              const pts = trail.map((h) => project(of(h.model)[i], proj));
              return (
                <g key={`${prefix}${i}`}>
                  {pts.slice(1).map((p, s) => (
                    <line
                      key={s}
                      x1={pts[s].x} y1={pts[s].y} x2={p.x} y2={p.y}
                      stroke={stroke} strokeWidth={1}
                      opacity={0.1 + 0.35 * ((s + 1) / (pts.length - 1))}
                    />
                  ))}
                </g>
              );
            });
          return (
            <>
              {trailFor(eIdx, (m) => m.E, color.info.fg, 'te')}
              {trailFor(uIdx, (m) => m.U, color.highlight, 'tu')}
            </>
          );
        })()}

        {active != null && (() => {
          const before = project(EBefore[active], proj);
          const after = project(E[active], proj);
          return (
            <>
              <line x1={before.x} y1={before.y} x2={after.x} y2={after.y} stroke={color.text.muted} strokeWidth={1} strokeDasharray="3 2" />
              <circle cx={before.x} cy={before.y} r={3 * k} fill="none" stroke={color.text.muted} />
            </>
          );
        })()}

        {onlyPair && target != null && (() => {
          const before = project(UBefore[target], proj);
          const after = project(U[target], proj);
          const h = 3 * k;
          return (
            <>
              <line x1={before.x} y1={before.y} x2={after.x} y2={after.y} stroke={color.text.muted} strokeWidth={1} strokeDasharray="3 2" />
              <rect
                x={before.x - h} y={before.y - h} width={h * 2} height={h * 2}
                transform={`rotate(45 ${before.x} ${before.y})`}
                fill="none" stroke={color.text.muted}
              />
            </>
          );
        })()}

        {uPts.map((d) => {
          const isTarget = d.i === target;
          const h = 3 * k;
          return (
            <rect
              key={`u${d.i}`}
              x={d.x - h} y={d.y - h} width={h * 2} height={h * 2}
              transform={`rotate(45 ${d.x} ${d.y})`}
              fill={isTarget ? color.highlight : 'none'}
              stroke={color.highlight}
              strokeWidth={1}
              opacity={fade(d.depth, maxR, is3d)}
            >
              <title>{`u: ${vocab[d.i]}`}</title>
            </rect>
          );
        })}

        {showLabels && target != null && (() => {
          const d = uPts.find((p) => p.i === target);
          if (!d) return null;
          return <text x={d.x + 6} y={d.y - 5} fontSize={labelFont} fill={color.chip.nextFg} fontWeight="bold">{vocab[target]}</text>;
        })()}

        {ePts.map((d) => {
          const isActive = d.i === active;
          const labelX = d.side === 'r' ? d.x + 8 : d.x - 8;
          return (
            <g key={`e${d.i}`}>
              {showLabels && (
                <line x1={d.x} y1={d.y} x2={labelX} y2={d.labelY} stroke={color.border.strong} strokeWidth={0.75} />
              )}
              <circle
                cx={d.x} cy={d.y} r={(isActive ? 5 : 3) * k}
                fill={color.info.fg}
                stroke={isActive ? color.emphasis : color.bg.surface}
                strokeWidth={isActive ? 1.5 : 1}
                opacity={fade(d.depth, maxR, is3d)}
              />
              {showLabels && (
                <text
                  x={labelX} y={d.labelY}
                  fontSize={labelFont}
                  textAnchor={d.side === 'r' ? 'start' : 'end'}
                  dominantBaseline="middle"
                  fill={isActive ? color.text.emphasis : color.text.secondary}
                  fontWeight={isActive ? 'bold' : 'normal'}
                >
                  {vocab[d.i]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  const legend = (
    <div className={styles.legend}>
      <span><span className={styles.markerE}>●</span> e (word)</span>
      <span><span className={styles.markerU}>◆</span> u (next)</span>
      {is3d && <span>drag to rotate</span>}
    </div>
  );

  const dotSection = pairDot != null && active != null && target != null && (
    <div className={styles.dotSection}>
      <div className={styles.dotSectionLabel}>Current pair logit</div>
      <div>
        e<sub>{vocab[active]}</sub> · u<sub>{vocab[target]}</sub> ={' '}
        <strong className={styles.dotSectionValue}>{pairDot.toFixed(precision)}</strong>
      </div>
    </div>
  );

  // Render the chosen renderer at a given canvas size.
  const view = (size: number) =>
    usePlotly ? (
      <Suspense fallback={<div className={styles.plotlyFallback} style={{ width: size, height: size }}>loading Plotly…</div>}>
        <EmbeddingScatterPlotly vocab={vocab} E={E} U={U} EBefore={EBefore} flash={flash} size={size} />
      </Suspense>
    ) : (
      plot(size)
    );

  const inlineSize = is3d ? 380 : 260;
  const bigSize = Math.round(
    Math.min(
      (typeof window !== 'undefined' ? window.innerWidth : 1200) * 0.8,
      (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.8,
    ),
  );

  return (
    <Panel title={`E + U scatter`} stage={TrainingStage.Parameters} step={step} dimmed={false}>
      <div className={styles.inlineWrap} style={{ maxWidth: inlineSize }}>
        <div className={styles.toolbar}>
          {is3d && (
            <Segmented
              size="small"
              value={renderer}
              onChange={(v) => setRenderer(v as 'svg' | 'plotly')}
              options={[{ label: 'SVG', value: 'svg' }, { label: 'Plotly', value: 'plotly' }]}
            />
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            title="expand"
            className={styles.expandButton}
          >
            ⛶
          </button>
        </div>
        {view(inlineSize)}
        {legend}
        {dotSection}
      </div>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
        width={bigSize + 64}
        title={`E + U scatter`}
        destroyOnHidden
      >
        <div className={styles.modalBody}>
          <div className={styles.modalToggle}>
            <span>Tokens</span>
            <Switch size="small" checked={showLabels} onChange={setShowLabels} />
          </div>
          {view(bigSize)}
          {legend}
          {dotSection}
        </div>
      </Modal>
    </Panel>
  );
}

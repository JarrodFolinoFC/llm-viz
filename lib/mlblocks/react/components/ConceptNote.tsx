import type { ReactNode } from 'react';

import { TrainingStage } from '../../core/stage';
import { useP } from '../primitives/context';
import { STAGE_META } from '../flow/stageMeta';

interface ConceptNoteProps {
  /** The concept this note translates (e.g. "Embeddings", "Softmax"). */
  title: ReactNode;
  /** The plain-English explanation — a sentence or two in friendly prose. */
  text: ReactNode;
  /**
   * The training phase the annotated panel belongs to. Injected from the
   * `panel(stage, …)` node in a flow; tints the note's accent to match its
   * neighbour's badge so the pairing reads at a glance.
   */
  stage?: TrainingStage;
}

/**
 * A plain-English commentary card that rides alongside a data panel in the flow.
 * Deliberately *not* a training {@link Panel} (no live badge, no tensor) — it's
 * an aside that translates the maths into ordinary language. Shown only when
 * the "Plain English" view setting is on.
 */
export function ConceptNote({ title, text, stage }: ConceptNoteProps) {
  const P = useP();
  const accent = stage ? STAGE_META[stage].color : undefined;
  return (
    <P.View
      direction="col"
      gap="xs"
      sty={{
        maxwCh: 22,
        p: 'sm',
        bg: 'infoBg',
        borderColor: 'infoBorder',
        accentBorder: accent ? { raw: accent } : 'infoBorder',
        radius: 'md',
        color: 'textSecondary',
        font: 'sm',
        lh: 1.4,
      }}
    >
      <P.View align="center" gap="xs" sty={{ color: 'textEmphasis', bold: true }}>
        <P.Text>🗣</P.Text>
        <P.Text>{title}</P.Text>
      </P.View>
      <P.Text>{text}</P.Text>
    </P.View>
  );
}

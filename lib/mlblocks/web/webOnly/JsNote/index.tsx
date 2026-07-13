import { TrainingStage } from '../../../core/stage';
import { STAGE_META } from '../../../react/flow/stageMeta';
import { JsIcon } from '../JsIcon';
import styles from './JsNote.module.css';

/** Class map exported for tests (count JS notes without duplicating classes). */
export const jsNoteClasses = styles;

interface JsNoteProps {
  /** The concept this note translates (e.g. "Softmax", "∇W₂"). */
  title: string;
  /** The panel's maths as runnable, dependency-free JavaScript source. */
  code: string;
  /**
   * The training phase the annotated panel belongs to. Injected from the
   * `panel(stage, …)` node in a flow; tints the note's accent to match its
   * neighbour's badge so the pairing reads at a glance.
   */
  stage?: TrainingStage;
}

/**
 * The pure-JavaScript companion to a data panel: the same calculation the
 * panel visualises, written as a few lines of plain JS (no library, no
 * framework) with the live numbers baked in as comments. The code-flavoured
 * sibling of the plain-English {@link ConceptNote}; shown when the "JS" panel
 * kind is toggled on in the page filter.
 */
export function JsNote({ title, code, stage }: JsNoteProps) {
  const accent = stage ? STAGE_META[stage].color : undefined;
  return (
    <aside className={styles.note} style={accent ? { borderInlineStartColor: accent } : undefined}>
      <div className={styles.title}>
        <JsIcon className={styles.icon} />
        {title}
      </div>
      <pre className={styles.code}>
        <code>{code}</code>
      </pre>
    </aside>
  );
}

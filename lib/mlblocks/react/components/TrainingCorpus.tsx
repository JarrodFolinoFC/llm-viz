import { tokenize } from '../../core/math/funcs';
import { TrainingStage } from '../../core/stage';
import { useP } from '../primitives/context';
import { Panel } from './Panel';

interface TrainingCorpusProps {
  corpus?: string;
  step: number;
  /** Position of the last context token; the target is the token after it. null hides it. */
  pairIdx?: number | null;
  /** How many context tokens precede the target (the block size N); 1 = a bigram pair. */
  contextLen?: number;
}

export function TrainingCorpus({ corpus, pairIdx, step, contextLen = 1 }: TrainingCorpusProps) {
  const P = useP();
  const tokens = tokenize(corpus || '');
  const showPosition = pairIdx !== undefined;
  const markIdx = pairIdx ?? -1;
  const heading = 'Training corpus';

  if (!showPosition) {
    return (
      <P.View direction="col" gap="xs">
        <P.Text sty={{ bold: true }}>{heading}</P.Text>
        <P.Text sty={{ mono: true, p: 'md', bg: 'surfaceSubtle', borderColor: 'border', radius: 'sm', maxwCh: 65 }}>
          {corpus}
        </P.Text>
      </P.View>
    );
  }

  return (
    <Panel title={heading} step={step} dimmed={false} stage={TrainingStage.Data}>
      <P.View wrap align="center" gap={4} sty={{ p: 'md', radius: 'sm', mono: true, maxwCh: 65, lh: 2.4 }}>
        {tokens.map((t, i) => {
          // The contextLen tokens ending at markIdx are the context; the next is
          // the target. A null pairIdx (markIdx −1) highlights nothing.
          const isPrev = markIdx >= 0 && i > markIdx - contextLen && i <= markIdx;
          const isTarget = markIdx >= 0 && i === markIdx + 1;
          return (
            <P.Text
              key={i}
              sty={{
                px: 'xs',
                py: 1,
                radius: 'sm',
                ...(isPrev
                  ? { bg: 'chipPrevBg', color: 'chipPrevFg', bold: true }
                  : isTarget
                    ? { bg: 'chipNextBg', color: 'chipNextFg', bold: true }
                    : { color: 'textMuted' }),
              }}
            >
              {t}
            </P.Text>
          );
        })}
      </P.View>
    </Panel>
  );
}

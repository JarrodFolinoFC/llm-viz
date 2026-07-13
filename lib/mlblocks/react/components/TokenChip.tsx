import { useP } from '../primitives/context';

/**
 * A highlighted token pill. Defaults to the "next" (info) colours; `isPrev`
 * switches to the amber context highlight. Both pull chip-specific tokens so
 * the chip colour picker recolours only these.
 */
export function TokenChip({ text, isPrev = false }: { text: string; isPrev?: boolean }) {
  const P = useP();
  return (
    <P.View
      inline
      sty={{
        px: 'xs',
        py: 1,
        radius: 'sm',
        bold: true,
        color: isPrev ? 'chipPrevFg' : 'chipNextFg',
        bg: isPrev ? 'chipPrevBg' : 'chipNextBg',
      }}
    >
      <P.Text>{text}</P.Text>
    </P.View>
  );
}

import { useP } from '../primitives/context';
import { paramMeta, type ParamTensor } from '../flow/paramTensor';

const PARAM_ROLE: Partial<Record<ParamTensor, string>> = {
  E: 'token embeddings (V×d)',
  W1: 'input → hidden weights',
  b1: 'hidden bias',
  W2: 'hidden → output weights',
  b2: 'output bias',
};

interface ParamLegendProps {
  tensors: readonly ParamTensor[];
}

/**
 * A one-line sub-heading naming the model's learnable parameters, each in the
 * same identity colour the parameter filter and the panel headings use. Unlike
 * the filter's toggle buttons this is padding-less — plain coloured labels — so
 * it reads as a compact sub-heading above the flow (and leaves room alongside
 * the panels' action menus).
 */
export function ParamLegend({ tensors }: ParamLegendProps) {
  const P = useP();
  return (
    <P.View align="baseline" wrap gap="sm" sty={{ mb: 'sm' }}>
      <P.Text sty={{ em: 0.8, color: 'textMuted' }}>MODEL PARAMETERS</P.Text>
      <P.View inline align="baseline" wrap gap="xs">
        {tensors.map((t, i) => {
          const { label, color } = paramMeta(t);
          const role = PARAM_ROLE[t];
          const chip = (
            <P.Text sty={{ color: { raw: color }, bold: true, ...(role ? { deco: 'underlineDotted' as const } : {}) }}>
              {label}
            </P.Text>
          );
          return (
            <P.View key={t} inline align="baseline" gap="xs">
              {i > 0 && <P.Text color="textMuted">·</P.Text>}
              {role ? <P.Tip content={`${label} — ${role}`}>{chip}</P.Tip> : chip}
            </P.View>
          );
        })}
      </P.View>
    </P.View>
  );
}

import { Flex, Tooltip } from 'antd';
import { Button, ColorPicker } from 'shared-ui';

import { VARS, type VarName } from 'shared-ui';

import { useViewSettings } from '../theme/ViewSettings';
import { TokenChip } from '../../react/components/TokenChip';
import styles from './TokenChipColors.module.css';

/** The two chip variants and the tokens that colour them. */
const CHIPS = [
  { label: 'Previous token', isPrev: true, bg: 'chip-prev-bg', fg: 'chip-prev-fg' },
  { label: 'Target token', isPrev: false, bg: 'chip-next-bg', fg: 'chip-next-fg' },
] as const satisfies readonly { label: string; isPrev: boolean; bg: VarName; fg: VarName }[];

const CHIP_TOKENS: VarName[] = CHIPS.flatMap((c) => [c.bg, c.fg]);

/**
 * Colour picker scoped to the token chips. Each variant (previous / target)
 * shows a live preview and a background + text swatch picker; edits apply
 * instantly and are scoped to the active light/dark mode.
 */
export function TokenChipColors() {
  const { mode, colorOverrides, setTokenColor, resetTokenColor } = useViewSettings();
  const modeIdx = mode === 'dark' ? 1 : 0;
  const overrides = colorOverrides[mode] ?? {};
  const effective = (name: VarName) => overrides[name] ?? VARS[name][modeIdx];
  const anyOverridden = CHIP_TOKENS.some((name) => overrides[name] != null);

  return (
    <div className={styles.editor}>
      <span className={styles.heading}>
        Token chip colours <span className={styles.mode}>({mode})</span>
      </span>

      {CHIPS.map((chip) => (
        <Flex key={chip.label} align="center" gap={8} wrap>
          <span className={styles.preview}>
            <TokenChip text={chip.isPrev ? 'prev' : 'next'} isPrev={chip.isPrev} />
          </span>
          <Tooltip title={`${chip.label} background`}>
            <ColorPicker
              size="small"
              format="hex"
              disabledAlpha
              value={effective(chip.bg)}
              onChange={(_, hex) => setTokenColor(chip.bg, hex)}
            />
          </Tooltip>
          <Tooltip title={`${chip.label} text`}>
            <ColorPicker
              size="small"
              format="hex"
              disabledAlpha
              value={effective(chip.fg)}
              onChange={(_, hex) => setTokenColor(chip.fg, hex)}
            />
          </Tooltip>
        </Flex>
      ))}

      <Button
        size="small"
        type="text"
        danger
        disabled={!anyOverridden}
        onClick={() => CHIP_TOKENS.forEach((name) => resetTokenColor(name))}
      >
        Reset chip colours
      </Button>
    </div>
  );
}

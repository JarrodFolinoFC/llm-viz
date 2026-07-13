import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';
import { useVimHint } from 'vimium-layer';

import { HintText } from './vim/HintText';
import { VimHint } from './vim/VimHint';
import { hintWord } from './vim/hintWord';
import styles from './Segmented.module.css';

export type SegmentedValue = string | number;

export interface SegmentedOption {
  label: ReactNode;
  value: SegmentedValue;
  disabled?: boolean;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: SegmentedValue;
  onChange: (value: SegmentedValue) => void;
  /** Stretch the segments to fill the width (equal widths). */
  block?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  style?: CSSProperties;
}

/** One segment — a native vim-hint target. A string label hints as its own
 *  leading letters ("Active" → lit **Ac**tive, typing selects it); a non-string
 *  (icon) label keeps the centred-letters overlay. The *selected* segment isn't
 *  hinted at all (aria-selected — the layer skips it; you're already on it). */
function Segment({
  option,
  selected,
  onSelect,
}: {
  option: SegmentedOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const text = typeof option.label === 'string' ? option.label : undefined;
  const { ref, hint, active } = useVimHint({
    disabled: option.disabled,
    onActivate: onSelect,
    prefix: text ? hintWord(text) : undefined,
  });
  const classes = clsx(styles.item, selected && styles.selected, option.disabled && styles.disabled);
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={selected}
      disabled={option.disabled}
      className={classes}
      onClick={onSelect}
    >
      {text ? (
        <span className={styles.label}>
          <HintText text={text} hint={hint} />
        </span>
      ) : (
        <>
          <span className={clsx(styles.label, active && styles.dimLabel)}>{option.label}</span>
          <VimHint hint={hint} placement="overlay" />
        </>
      )}
    </button>
  );
}

/**
 * A theme-aware, antd-compatible `Segmented` with the vim layer designed in:
 * each segment is a native hint target (label hides, letters frame in hint mode)
 * instead of the layer floating a chip over it. A near-drop-in for antd's
 * `Segmented` for the `options` / `value` / `onChange` / `block` / `size` API.
 */
export function Segmented({ options, value, onChange, block, size = 'middle', className, style }: SegmentedProps) {
  const classes = clsx(styles.group, block && styles.block, styles[size], className);
  return (
    <div role="tablist" className={classes} style={style}>
      {options.map((opt) => (
        <Segment
          key={String(opt.value)}
          option={opt}
          selected={opt.value === value}
          onSelect={() => !opt.disabled && onChange(opt.value)}
        />
      ))}
    </div>
  );
}

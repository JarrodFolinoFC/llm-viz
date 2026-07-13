import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { theme } from 'antd';
import * as chrono from 'chrono-node';
import dayjs from 'dayjs';
import { CheckCircleOutlined, CloseCircleFilled, WarningOutlined } from '@ant-design/icons';
import { useVimHint } from 'vimium-layer';

import { Input } from './Input';
import { VimHint } from './vim/VimHint';
import { countdownLabel, daysUntil, parseLocalDate } from './dates';

export interface SmartDateInputProps {
  /** ISO date "YYYY-MM-DD", or '' when unset. */
  value: string;
  /** Fired on commit (Enter/blur) with the parsed ISO date, or '' when cleared. */
  onChange: (iso: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  autoFocus?: boolean;
  className?: string;
  style?: CSSProperties;
  /**
   * Bias ambiguous/relative parsing toward the future (default true) — good for
   * due dates ("friday" → the coming one). Set false for past dates (birthdays).
   */
  forwardDate?: boolean;
}

/** ISO → the dd/MM/YYYY text shown at rest and while editing. */
const toDisplay = (iso: string): string => (iso ? dayjs(iso).format('DD/MM/YYYY') : '');

type Parsed =
  | { kind: 'empty' }
  | { kind: 'ok'; iso: string }
  | { kind: 'bad' };

/**
 * A plain text date field with natural-language parsing (via
 * [chrono](https://github.com/wanasit/chrono), British `dd/MM/YYYY` reading).
 *
 * Type anything — `25 Dec`, `next friday`, `in 3 weeks`, or `04/07/2026` — and a
 * live **preview** shows the resolved date below the field. On commit (Enter or
 * blur) it saves the canonical ISO date back through `onChange` and normalises
 * the text to `dd/MM/YYYY`; Escape reverts. Unparseable text is never saved —
 * it just shows a "couldn't read that" hint and reverts on blur.
 *
 * A drop-in for the old `VimDatePicker` (same `value`/`onChange` string API).
 */
export function SmartDateInput({
  value,
  onChange,
  placeholder = 'e.g. 25 Dec, next friday, 04/07/2026',
  allowClear = true,
  autoFocus,
  className,
  style,
  forwardDate = true,
}: SmartDateInputProps) {
  const [text, setText] = useState(() => toDisplay(value));
  const [focused, setFocused] = useState(false);

  // Reflect external value changes while not actively editing (so a preset
  // button or a store update repaints the field), without clobbering typing.
  useEffect(() => {
    if (!focused) setText(toDisplay(value));
  }, [value, focused]);

  const parsed: Parsed = useMemo(() => {
    const t = text.trim();
    if (!t) return { kind: 'empty' };
    const d = chrono.en.GB.parseDate(t, new Date(), { forwardDate });
    return d ? { kind: 'ok', iso: dayjs(d).format('YYYY-MM-DD') } : { kind: 'bad' };
  }, [text, forwardDate]);

  const commit = () => {
    if (parsed.kind === 'empty') {
      if (value) onChange('');
      setText('');
    } else if (parsed.kind === 'ok') {
      if (parsed.iso !== value) onChange(parsed.iso);
      setText(toDisplay(parsed.iso));
    } else {
      setText(toDisplay(value)); // unparseable — revert to the last good value
    }
  };

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <Input
        value={text}
        placeholder={placeholder}
        suffix={
          allowClear && text ? (
            <ClearButton
              onClear={() => {
                setText('');
                if (value) onChange('');
              }}
            />
          ) : undefined
        }
        autoFocus={autoFocus}
        style={{ width: '100%' }}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setText(toDisplay(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {focused && <Preview parsed={parsed} />}
    </div>
  );
}

/** The field's clear (×) affordance, as a *native* vim-hint target so its `f`
 *  label sits inline (a slot beside the glyph) instead of a floating overlay chip
 *  — replaces antd's `allowClear`, which paints an un-hintable icon. Shown only
 *  when there's text; `mousedown` is suppressed so clicking it doesn't blur-commit
 *  the field before the clear fires. */
function ClearButton({ onClear }: { onClear: () => void }) {
  const { ref, hint } = useVimHint({ onActivate: onClear });
  return (
    <span
      ref={ref}
      role="button"
      aria-label="Clear date"
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
      style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: 'inherit' }}
    >
      <VimHint hint={hint} placement="slot-end" />
      <CloseCircleFilled style={{ opacity: 0.45 }} />
    </span>
  );
}

/** The floating preview under the field: the resolved date (with a relative
 *  "in 3 days" hint) while typing, or a gentle error for unrecognised text.
 *  Colours come from antd's design tokens, so it tracks light/dark themes. */
function Preview({ parsed }: { parsed: Parsed }) {
  const { token } = theme.useToken();
  const base: CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    zIndex: 5,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    padding: '4px 8px',
    fontSize: 12,
    lineHeight: 1.3,
    borderRadius: token.borderRadius,
    whiteSpace: 'nowrap',
    background: token.colorBgElevated,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: token.boxShadowSecondary,
  };

  if (parsed.kind === 'empty') {
    return (
      <div style={{ ...base, color: token.colorTextTertiary }}>
        Type a date — e.g. <b>25 Dec</b>, <b>next friday</b>, <b>04/07/2026</b>
      </div>
    );
  }
  if (parsed.kind === 'bad') {
    return (
      <div style={{ ...base, color: token.colorWarning }}>
        <WarningOutlined /> Couldn’t read that date
      </div>
    );
  }
  const days = daysUntil(parseLocalDate(parsed.iso));
  return (
    <div style={{ ...base, color: token.colorSuccess }}>
      <CheckCircleOutlined />
      <span style={{ color: token.colorText, fontWeight: 600 }}>
        {dayjs(parsed.iso).format('ddd, D MMM YYYY')}
      </span>
      <span style={{ color: token.colorTextTertiary }}>({countdownLabel(days)})</span>
    </div>
  );
}

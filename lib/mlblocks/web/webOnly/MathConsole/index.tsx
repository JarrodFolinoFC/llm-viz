import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Card } from 'antd';
import { Button, Checkbox, TextArea, errorMessage } from 'shared-ui';
import { CloseOutlined } from '@ant-design/icons';

import {
  runJs,
  formatValue,
  shapeOf,
  HELPERS,
  HELPER_NAMES,
  CONST_NAMES,
} from '../../lib/jsSandbox';
import { snippetSource, type Snippet } from '../../../react/lib/snippets';
import { highlightJs } from '../../lib/prism';
import styles from './MathConsole.module.css';

export interface MathConsoleProps {
  /** Live model variables exposed to the console (E, U, a, b, …). */
  scope?: Record<string, unknown>;
  /** Optional token legend, shown in the cheatsheet. */
  vocab?: readonly string[];
  /** Close button handler (rendered in the card header). */
  onClose?: () => void;
}

export interface MathConsoleHandle {
  /** Load a row snippet into the console and run it. */
  submit: (snippet: Snippet) => void;
}

type EntryKind = 'result' | 'error' | 'log';
interface Entry {
  kind: EntryKind | 'input';
  text: string;
}

/** Inline syntax-highlighted JS. */
function Code({ source }: { source: string }) {
  return <code className={styles.code} dangerouslySetInnerHTML={{ __html: highlightJs(source) }} />;
}

export const MathConsole = forwardRef<MathConsoleHandle, MathConsoleProps>(function MathConsole(
  { scope = {}, vocab, onClose },
  ref,
) {
  // User variables (+ `ans`) persist across lines; the live scope is read each
  // run from a ref so expressions see the current training step's E/U.
  const varsRef = useRef<Record<string, unknown>>({});
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [showProcess, setShowProcess] = useState(false);
  // The last snippet run — everything it feeds is derived from it, not stored.
  const [lastSnippet, setLastSnippet] = useState<Snippet | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Helper definitions surfaced in the cheatsheet for the last-used snippet.
  const usedDefs = lastSnippet?.uses ?? [];
  // The last snippet's PyTorch twin — shown (not run) so the mapping to the
  // line you'd write in nanoGPT is explicit.
  const pytorch = lastSnippet?.pytorch ?? null;

  // Keep the log pinned to the latest line.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [entries]);

  const runCode = (src: string) => {
    const code = src.trim();
    if (!code) return;
    const out: Entry[] = [{ kind: 'input', text: code }];
    const onLog = (...args: unknown[]) => out.push({ kind: 'log', text: args.map(formatValue).join(' ') });
    try {
      const value = runJs(code, scopeRef.current, varsRef.current, onLog);
      varsRef.current.ans = value;
      out.push({ kind: 'result', text: formatValue(value) });
    } catch (err) {
      out.push({ kind: 'error', text: errorMessage(err) });
    }
    setEntries((e) => [...e, ...out]);
  };

  const submit = (snippet: Snippet) => {
    setLastSnippet(snippet);
    const code = snippetSource(snippet, showProcess);
    setInput(code);
    runCode(code);
  };

  useImperativeHandle(ref, () => ({ submit }));

  // Toggling "show process" re-loads (and re-runs) the last snippet's variant.
  const onToggleProcess = (next: boolean) => {
    setShowProcess(next);
    if (lastSnippet) {
      const code = snippetSource(lastSnippet, next);
      setInput(code);
      runCode(code);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      runCode(input);
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      clear();
    }
  };

  const clear = () => {
    setEntries([]);
    setLastSnippet(null);
  };

  const modelVars = useMemo(() => Object.keys(scope), [scope]);

  return (
    <Card
      size="small"
      title="Math console"
      classNames={{ body: styles.cardBody }}
      extra={
        <span>
          <Button type="text" size="small" onClick={clear}>clear</Button>
          {onClose && (
            <Button type="text" size="small" icon={<CloseOutlined />} aria-label="Close console" onClick={onClose} />
          )}
        </span>
      }
    >
      {/* Cheatsheet — replaced by the used-function definitions after a snippet runs. */}
      <div className={styles.cheatsheet}>
        {modelVars.length > 0 && (
          <div className={styles.note}>
            <strong>vars:</strong> {modelVars.map((n) => `${n} (${shapeOf(scopeRef.current[n])})`).join(', ')}
          </div>
        )}
        {vocab && vocab.length > 0 && (
          <div className={styles.note}>
            <strong>tokens:</strong> {vocab.map((t, i) => `${i}:${t}`).join('  ')}
          </div>
        )}
        {usedDefs.length > 0 ? (
          <div className={styles.defs}>
            <div className={styles.note}><strong>functions used:</strong></div>
            {usedDefs
              .filter((n) => HELPERS[n])
              .map((n) => (
                <pre key={n} className={styles.defBlock}>
                  <Code source={HELPERS[n].src} />
                </pre>
              ))}
          </div>
        ) : (
          <div className={styles.note}>
            <strong>functions:</strong> {HELPER_NAMES.join(', ')} · <strong>const:</strong> {CONST_NAMES.join(', ')}
            <br />
            Real JS — use <Code source="E.map(r => dot(r, U[0]))" />, arrow fns, console.log. Assign with <code>x = …</code>; last result is <code>ans</code>.
          </div>
        )}
      </div>

      {pytorch && (
        <div className={styles.note}>
          <strong>as PyTorch:</strong> <code className={styles.code}>{pytorch}</code>
        </div>
      )}

      <div className={styles.log} ref={logRef}>
        {entries.map((e, i) =>
          e.kind === 'input' ? (
            <div key={i} className={styles.line}>
              <span className={styles.prompt}>{'> '}</span>
              <Code source={e.text} />
            </div>
          ) : (
            <p key={i} className={`${styles.line} ${styles[e.kind]}`}>
              {e.kind === 'log' ? <span className={styles.logTag}>· </span> : null}
              {e.text}
            </p>
          ),
        )}
      </div>

      <div className={styles.controls}>
        <Checkbox checked={showProcess} onChange={(ev) => onToggleProcess(ev.target.checked)}>
          show process
        </Checkbox>
      </div>
      <div className={styles.inputRow}>
        <TextArea
          className={styles.field}
          value={input}
          placeholder="e.g. dot(E[a], U[b])   ·   ⌘/Ctrl+Enter run · ⌘/Ctrl+L clear"
          onChange={(ev) => setInput(ev.target.value)}
          onKeyDown={onKeyDown}
          autoSize={{ minRows: 1, maxRows: 8 }}
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="primary" onClick={() => runCode(input)}>Run</Button>
      </div>
    </Card>
  );
});

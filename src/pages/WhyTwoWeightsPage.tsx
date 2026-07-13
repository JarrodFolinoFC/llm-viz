import { useMemo, useState } from 'react';
import { Typography } from 'antd';
import { Button, LineChart, errorMessage, type Series } from 'shared-ui';

import { runJs, formatValue } from 'mlblocks';
import { highlightJs } from 'mlblocks';
import styles from './WhyTwoWeightsPage.module.css';

const { Title, Paragraph, Text } = Typography;

// The two toy models, in one place so the chart, the table, and the runnable
// script below all agree on the same numbers.
const single = { W: 1, b: 0 };
const two = { W1: 1.2, b1: 0, W2: 5, b2: 0 };

const singleWeight = (x: number) => single.W * x + single.b;
const twoWeights = (x: number) =>
  two.W2 * Math.tanh(two.W1 * x + two.b1) + two.b2;

// The exact script shown in the card AND executed by "Run" — the one the user
// can also paste into the math console or a browser console.
const DEMO_CODE = `// W = weight (the slope) · b = BIAS (a fixed add-on that shifts up/down)

// 1) SINGLE WEIGHT: multiply + shift → always a straight line.
function singleWeight(x, W, b) {
  return W * x + b;          // b (bias): lifts/drops the whole line
}

// 2) TWO WEIGHTS + SQUASH: multiply → tanh (the bend) → multiply.
function twoWeights(x, W1, b1, W2, b2) {
  const z = W1 * x + b1;     // b1 (bias): shifts the signal BEFORE the squash
  const h = Math.tanh(z);    // the squash / "gut-feeling" (−1…1)
  return W2 * h + b2;        // b2 (bias): shifts the final score up/down
}

const single = { W: 1, b: 0 };
const two = { W1: 1.2, b1: 0, W2: 5, b2: 0 };

console.log('  x | single (straight) | two+tanh (curved)');
for (let x = -6; x <= 6; x += 2) {
  const s = singleWeight(x, single.W, single.b);
  const t = twoWeights(x, two.W1, two.b1, two.W2, two.b2);
  console.log(x + ' | ' + s.toFixed(3) + ' | ' + t.toFixed(3));
}`;

type Line = { kind: 'log' | 'error'; text: string };

/**
 * "Why two weights?" — the straight-line-vs-curve demo, promoted to a runnable
 * Analysis page. One weight (× W + b) can only ever draw a straight line; stack
 * a second weight with a `tanh` squash between them and the output can bend. The
 * chart plots both from the same parameters as the script, which runs in the
 * app's JS sandbox so you can see the numbers behind the curve.
 */
export function WhyTwoWeightsPage() {
  const series = useMemo<Series[]>(() => {
    const xs: number[] = [];
    for (let x = -6; x <= 6 + 1e-9; x += 0.5) xs.push(Math.round(x * 10) / 10);
    const pts = (f: (x: number) => number) =>
      xs.map((x) => ({ label: x % 1 === 0 ? String(x) : '', value: f(x) }));
    return [
      { label: 'single weight (straight)', color: '#f8836b', points: pts(singleWeight) },
      { label: 'two weights + tanh (curved)', color: '#38bdf8', points: pts(twoWeights) },
    ];
  }, []);

  // Keep the y-axis symmetric so the straight line and the S-curve share a frame.
  const yMin = useMemo(
    () => Math.floor(Math.min(...series.flatMap((s) => s.points.map((p) => p.value)))),
    [series],
  );

  const [output, setOutput] = useState<Line[] | null>(null);

  const run = () => {
    const lines: Line[] = [];
    const onLog = (...args: unknown[]) =>
      lines.push({ kind: 'log', text: args.map(formatValue).join(' ') });
    try {
      runJs(DEMO_CODE, {}, {}, onLog);
    } catch (err) {
      lines.push({ kind: 'error', text: errorMessage(err) });
    }
    setOutput(lines);
  };

  return (
    <Typography className={styles.page}>
      <Title level={3}>Why two weights? — one line can't bend</Title>
      <Paragraph>
        A single weight is just <Text code>score = W·x + b</Text>: <Text strong>W</Text> tilts the
        line and <Text strong>b</Text> (the <Text strong>bias</Text>) slides it up or down — but the
        result is <Text strong>always a straight line</Text>. Chaining two weights with{' '}
        <Text strong>nothing between them</Text> is the same as one weight (
        <Text code>W₂·W₁·x</Text>), so it stays straight too.
      </Paragraph>
      <Paragraph>
        The fix is the <Text strong>squash</Text> — a <Text code>tanh</Text> step wedged between the
        two weights that bends the signal (it flattens out near ±1). That bend is what lets the pair{' '}
        <Text strong>W₁ → tanh → W₂</Text> trace a curve. This is exactly the MLP's{' '}
        <Text strong>W₁ → hidden layer → W₂</Text> — the hidden layer <em>is</em> the squash.
      </Paragraph>

      <LineChart
        title="Same inputs, two models"
        series={series}
        height={280}
        yMin={yMin}
        format={(n) => n.toFixed(1)}
      />

      <div className={styles.codeCard}>
        <div className={styles.codeHead}>
          <span className={styles.codeTitle}>Run it yourself</span>
          <Button type="primary" size="small" onClick={run}>
            Run
          </Button>
        </div>
        <pre className={styles.pre}>
          <code dangerouslySetInnerHTML={{ __html: highlightJs(DEMO_CODE) }} />
        </pre>
        {output && (
          <div className={styles.output}>
            {output.map((l, i) => (
              <p key={i} className={l.kind === 'error' ? styles.outError : styles.outLog}>
                {l.text}
              </p>
            ))}
          </div>
        )}
      </div>

      <Paragraph type="secondary" style={{ marginTop: 16 }}>
        Read the two columns the script prints: the <Text strong>single</Text> column changes by the
        same amount every row forever (a straight line), while the <Text strong>two+tanh</Text>{' '}
        column flattens toward its limits at the edges (the curve bending). Change{' '}
        <Text code>b</Text> and the whole line shifts but never bends; only the <Text code>tanh</Text>{' '}
        can do that.
      </Paragraph>
    </Typography>
  );
}

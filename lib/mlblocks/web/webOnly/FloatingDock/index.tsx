import { useCallback, useRef, useState, type ReactNode } from 'react';
import { FloatButton } from 'antd';
import { CalculatorOutlined, ControlOutlined } from '@ant-design/icons';
import clsx from 'clsx';

import { OneStepTrainer, type OneStepTrainerProps } from '../../../react/components/OneStepTrainer';
import { MathConsole, type MathConsoleHandle } from '../MathConsole';
import { MathConsoleContext } from '../../../react/flow/mathConsole';
import { useStepBinding } from '../../stepBinding';
import type { Snippet } from '../../../react/lib/snippets';
import styles from './FloatingDock.module.css';

export interface FloatingDockProps extends OneStepTrainerProps {
  /** Live model variables exposed to the math console (E, U, a, b, …). */
  scope?: Record<string, unknown>;
  /** Optional token legend for the console cheatsheet. */
  vocab?: readonly string[];
  /** The page content; rendered inside the console-context provider. */
  children: ReactNode;
}

/**
 * Bottom-right float-button dock with two collapsible panels — the one-step
 * trainer (open by default) and the safe math console — plus a context that lets
 * any calculation panel push a row's snippet into the console. The console stays
 * mounted (just hidden) so its log and history survive toggling.
 */
/** Which single panel is showing (only one at a time). */
type Active = 'trainer' | 'calc' | null;

export function FloatingDock({ scope, vocab, children, ...trainer }: FloatingDockProps) {
  // The trainer starts open so stepping is one click away; the console starts closed.
  const [active, setActive] = useState<Active>('trainer');
  const consoleRef = useRef<MathConsoleHandle>(null);

  const toggle = (panel: Exclude<Active, null>) =>
    setActive((cur) => (cur === panel ? null : panel));

  const send = useCallback((snippet: Snippet) => {
    setActive('calc');
    consoleRef.current?.submit(snippet);
  }, []);

  // The step-key listener is mounted once globally (the host's StepBindingProvider);
  // register this stage's handler so `n` advances training while this page is active.
  useStepBinding(trainer.onStep);

  return (
    <MathConsoleContext.Provider value={{ send, available: true }}>
      {children}

      <div className={clsx(styles.panels, 'no-print')}>
        {/* The console stays mounted (just hidden) so its log/history survive. */}
        <div className={clsx(styles.panel, active !== 'calc' && styles.hidden)}>
          <MathConsole ref={consoleRef} scope={scope} vocab={vocab} onClose={() => setActive(null)} />
        </div>
        {active === 'trainer' && (
          <div className={clsx(styles.panel, styles.trainerPanel)}>
            <OneStepTrainer {...trainer} />
          </div>
        )}
      </div>

      <FloatButton.Group shape="square" style={{ insetInlineEnd: 24, insetBlockEnd: 24 }}>
        <FloatButton
          icon={<CalculatorOutlined />}
          tooltip="Math console"
          type={active === 'calc' ? 'primary' : 'default'}
          onClick={() => toggle('calc')}
        />
        <FloatButton
          icon={<ControlOutlined />}
          tooltip={
            <>
              Training controls — press <kbd>n</kbd> to step
            </>
          }
          type={active === 'trainer' ? 'primary' : 'default'}
          onClick={() => toggle('trainer')}
        />
      </FloatButton.Group>
    </MathConsoleContext.Provider>
  );
}

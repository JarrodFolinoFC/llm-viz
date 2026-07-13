import type { ReactNode } from 'react';
import { Segmented, Switch } from 'shared-ui';

import { useViewSettings } from '../theme/ViewSettings';
import { PANEL_SIZES, ARRANGEMENTS, type PanelSize, type Arrangement } from '../../react/viewOptions';
import { PRECISIONS, type Precision } from '../../core/precision';
import { TokenChipColors } from '../TokenChipColors';
import styles from './ViewSettingsSection.module.css';

/** One labelled switch row in the settings section — exported so apps can
 *  compose their own rows into the `extra` slot with consistent styling. */
export function SettingsToggle({
  label,
  checked,
  onChange,
  checkedChildren,
  unCheckedChildren,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  checkedChildren?: ReactNode;
  unCheckedChildren?: ReactNode;
}) {
  return (
    <div className={styles.viewToggle}>
      <span className={styles.viewLabel}>{label}</span>
      <Switch
        size="small"
        checked={checked}
        onChange={onChange}
        checkedChildren={checkedChildren}
        unCheckedChildren={unCheckedChildren}
      />
    </div>
  );
}

/**
 * The framework section of the Ctrl+S Settings panel: arrangement, panel size,
 * decimals, arrows, code actions, and the token-chip colours. (Light/dark
 * lives in the shared panel's base Appearance row.) App-specific rows ride in
 * via the `extra` slot, rendered between the built-in toggles and the chip
 * colours.
 */
export function ViewSettingsSection({ extra }: { extra?: ReactNode } = {}) {
  const { panelSize, setPanelSize, arrangement, setArrangement, hideArrows, setHideArrows, hideActions, setHideActions, precision, setPrecision } = useViewSettings();
  return (
    <div className={styles.viewSettings}>
      <div className={styles.viewHeading}>View</div>
      <div className={styles.viewField}>
        <span className={styles.viewLabel}>Arrangement</span>
        <Segmented
          size="small"
          block
          value={arrangement}
          onChange={(v) => setArrangement(v as Arrangement)}
          options={ARRANGEMENTS.map((a) => ({ label: a[0].toUpperCase() + a.slice(1), value: a }))}
        />
      </div>
      <div className={styles.viewField}>
        <span className={styles.viewLabel}>Panel size</span>
        <Segmented
          size="small"
          block
          value={panelSize}
          onChange={(v) => setPanelSize(v as PanelSize)}
          options={PANEL_SIZES.map((s) => ({ label: s.toUpperCase(), value: s }))}
        />
      </div>
      <div className={styles.viewField}>
        <span className={styles.viewLabel}>Decimals</span>
        <Segmented
          size="small"
          block
          value={precision}
          onChange={(v) => setPrecision(v as Precision)}
          options={PRECISIONS.map((p) => ({ label: String(p), value: p }))}
        />
      </div>
      <SettingsToggle
        label="Flow arrows"
        checked={!hideArrows}
        onChange={(checked) => setHideArrows(!checked)}
        checkedChildren="show"
        unCheckedChildren="hide"
      />
      <SettingsToggle
        label="Code actions"
        checked={!hideActions}
        onChange={(checked) => setHideActions(!checked)}
        checkedChildren="show"
        unCheckedChildren="hide"
      />
      {extra}
      <div className={styles.viewField}>
        <TokenChipColors />
      </div>
    </div>
  );
}

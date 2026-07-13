import { Flex, Tooltip } from 'antd';
import { Button } from 'shared-ui';

import { space } from 'shared-ui';

import type { TrainingStage } from '../../../core/stage';
import { STAGE_META } from '../../../react/flow/stageMeta';
import { PANEL_KIND_META, type PanelKind } from '../../../react/flow/panelKinds';
import { paramMeta, type ParamTensor } from '../../../react/flow/paramTensor';
import { webPrimitives } from '../../primitives';

const { Icon } = webPrimitives;
import styles from './StageSelect.module.css';

interface StageSelectProps {
  /** The stages present in this flow, in pipeline order (unique per page). */
  stages: TrainingStage[];
  /** The subset currently filtered out. */
  hidden: ReadonlySet<TrainingStage>;
  /** Flip one stage between shown and hidden. */
  onToggle: (stage: TrainingStage) => void;
  /** Show every stage in this flow. */
  onShowAll: () => void;
  /** Hide every stage in this flow. */
  onHideAll: () => void;
  /** The panel kinds present in this flow. The Panels group renders only when
   *  there's a companion kind to toggle (i.e. more than just `standard`). */
  kinds?: PanelKind[];
  /** The kinds currently filtered out (companions are hidden by default). */
  hiddenKinds?: ReadonlySet<PanelKind>;
  /** Flip one panel kind between shown and hidden. */
  onToggleKind?: (kind: PanelKind) => void;
  /** The parameter tensors present in this flow (empty → no Parameters group). */
  tensors?: string[];
  /** The tensors currently filtered out. */
  hiddenTensors?: ReadonlySet<string>;
  /** Flip one parameter tensor between shown and hidden. */
  onToggleTensor?: (tensor: string) => void;
  /** Show every parameter in this flow. */
  onShowAllTensors?: () => void;
  /** Hide every parameter in this flow. */
  onHideAllTensors?: () => void;
}

/** One toggle button of the filter bar, shared by the stage / kind / parameter
 *  groups. The icon is optional — the parameter toggles are label-only. */
function FilterToggle({
  label,
  icon,
  shown,
  noun,
  onToggle,
}: {
  label: string;
  icon?: React.ReactNode;
  shown: boolean;
  /** What the toggle filters, for the tooltip / aria label ("panels", "notes"…). */
  noun: string;
  onToggle: () => void;
}) {
  return (
    <Tooltip title={`${label}: ${shown ? 'shown — click to hide' : 'hidden — click to show'}`}>
      <Button
        size="small"
        icon={icon ? <span style={{ display: 'inline-flex' }}>{icon}</span> : undefined}
        onClick={onToggle}
        aria-pressed={shown}
        aria-label={`${shown ? 'Hide' : 'Show'} ${label} ${noun}`}
        // No colour coding: a shown toggle is just bold default text; a hidden
        // one greys out. The icon inherits the text colour (so it greys too).
        style={shown ? { fontWeight: 600 } : { opacity: 0.55 }}
      >
        {label}
      </Button>
    </Tooltip>
  );
}

/**
 * The per-flow page filter: one icon toggle per training phase the flow
 * actually contains, plus All / None shortcuts — and, when the flow carries
 * companion panels (plain-English / JS asides), a second "Panels" group that
 * shows/hides each panel kind. Clicking a toggle drops its panels (and any
 * dangling connectors) from this flow only — the set of toggles and their
 * state are unique to each page.
 */
export function StageSelect({
  stages,
  hidden,
  onToggle,
  onShowAll,
  onHideAll,
  kinds = [],
  hiddenKinds,
  onToggleKind,
  tensors = [],
  hiddenTensors,
  onToggleTensor,
  onShowAllTensors,
  onHideAllTensors,
}: StageSelectProps) {
  if (stages.length === 0) return null;
  const allShown = hidden.size === 0;
  const allHidden = hidden.size === stages.length;
  const kindGroup = kinds.length > 1 && hiddenKinds && onToggleKind;
  const paramGroup = tensors.length > 0 && hiddenTensors && onToggleTensor;
  const allParamsShown = !!hiddenTensors && hiddenTensors.size === 0;
  const allParamsHidden = !!hiddenTensors && hiddenTensors.size === tensors.length;
  return (
    <Flex className={`${styles.bar} no-print`} gap={space.xs} wrap align="center">
      <span className={styles.label}>Stages</span>
      {stages.map((stage) => {
        const { label, icon } = STAGE_META[stage];
        const iconNode = <Icon name={icon} />;
        return (
          <FilterToggle
            key={stage}
            label={label}
            icon={iconNode}
            shown={!hidden.has(stage)}
            noun="panels"
            onToggle={() => onToggle(stage)}
          />
        );
      })}
      <span className={styles.divider} aria-hidden />
      <Button size="small" type="text" onClick={onShowAll} disabled={allShown}>
        All
      </Button>
      <Button size="small" type="text" onClick={onHideAll} disabled={allHidden}>
        None
      </Button>
      {kindGroup && (
        <>
          <span className={styles.divider} aria-hidden />
          <span className={styles.label}>Panels</span>
          {kinds.map((kind) => {
            const { label, icon } = PANEL_KIND_META[kind];
            const iconNode = <Icon name={icon} />;
            return (
              <FilterToggle
                key={kind}
                label={label}
                icon={iconNode}
                shown={!hiddenKinds.has(kind)}
                noun="panels"
                onToggle={() => onToggleKind(kind)}
              />
            );
          })}
        </>
      )}
      {paramGroup && (
        <>
          <span className={styles.divider} aria-hidden />
          <span className={styles.label}>Parameters</span>
          {tensors.map((tensor) => {
            const { label } = paramMeta(tensor as ParamTensor);
            return (
              <FilterToggle
                key={tensor}
                label={label}
                shown={!hiddenTensors.has(tensor)}
                noun="panels"
                onToggle={() => onToggleTensor(tensor)}
              />
            );
          })}
          {onShowAllTensors && onHideAllTensors && (
            <>
              <Button size="small" type="text" onClick={onShowAllTensors} disabled={allParamsShown}>
                All
              </Button>
              <Button size="small" type="text" onClick={onHideAllTensors} disabled={allParamsHidden}>
                None
              </Button>
            </>
          )}
        </>
      )}
    </Flex>
  );
}

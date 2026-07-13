import { createContext, useContext, type ReactNode } from 'react';

/**
 * The Training-loss panel, handed down by {@link StageShell} and rendered as the
 * flow's bottom "Loss" stage by the flow renderers (FlowRenderer / FlowWithChart).
 * Keeping it in context — rather than inlined at the top of StageShell — lets the
 * loss participate in the per-flow StageSelect filter and sit after the pipeline.
 */
const LossSlotContext = createContext<ReactNode>(null);

export const LossSlotProvider = LossSlotContext.Provider;

/** The loss panel for the current flow, or null outside a StageShell. */
export function useLossSlot(): ReactNode {
  return useContext(LossSlotContext);
}

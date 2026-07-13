import { createContext, useContext } from 'react';

/** Panel sizes offered by the settings UI. */
export type PanelSize = 'xxs' | 'xs' | 's' | 'm' | 'l';

export const PANEL_SIZES: PanelSize[] = ['xxs', 'xs', 's', 'm', 'l'];

/** How the flow panels are arranged:
 *  - `stage`     — grouped into a row per training stage
 *  - `collapsed` — every stage row joined into one continuous wrapping flow
 *                  (the desktop default)
 *  - `vertical`  — one panel per row (the mobile default) */
export type Arrangement = 'stage' | 'collapsed' | 'vertical';

export const ARRANGEMENTS: Arrangement[] = ['stage', 'collapsed', 'vertical'];

/**
 * The platform-free slice of the view settings that headless components read
 * (panel size, flow arrangement, chrome toggles). The web ViewSettingsProvider
 * bridges its cookie-backed state into this context; a native app provides its
 * own. Default-bearing so components render unprovided in tests and stories.
 */
export interface ViewOptions {
  panelSize: PanelSize;
  arrangement: Arrangement;
  /** Hide the connector arrows between flow panels (more room for the data). */
  hideArrows: boolean;
  /** Hide the per-row "JS" buttons and per-panel copy actions. */
  hideActions: boolean;
}

const Ctx = createContext<ViewOptions>({
  panelSize: 'm',
  arrangement: 'stage',
  hideArrows: false,
  hideActions: false,
});

export const ViewOptionsProvider = Ctx.Provider;

export const useViewOptions = (): ViewOptions => useContext(Ctx);

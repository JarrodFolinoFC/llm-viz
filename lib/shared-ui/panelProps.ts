/**
 * The props the `home` shell passes into every federated `./Panel` remote.
 *
 * Panels get their settings by prop, not context: a remote bundles its own copy
 * of shared-ui (it isn't a federation-shared singleton), so React context from
 * the host can't reach it. The host reads the global settings and threads the
 * relevant ones in here.
 */
export interface RemotePanelProps {
  /** The host's global "Hide sensitive information" setting — panels forward it
   *  to {@link Sensitive} to blur financial figures. */
  hideSensitive?: boolean;
}

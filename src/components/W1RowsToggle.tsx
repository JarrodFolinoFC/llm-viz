import { SettingsToggle } from 'mlblocks';

import { useW1AllWords } from '../theme/appSettings';

/** The MLP-specific "W₁ rows" view toggle, injected into mlblocks'
 *  ViewSettingsSection via its `extra` slot. */
export function W1RowsToggle() {
  const [w1AllWords, setW1AllWords] = useW1AllWords();
  return (
    <SettingsToggle
      label="W₁ rows"
      checked={w1AllWords}
      onChange={setW1AllWords}
      checkedChildren="every word"
      unCheckedChildren="slots"
    />
  );
}

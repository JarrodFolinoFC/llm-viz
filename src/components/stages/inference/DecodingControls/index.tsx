import { Flex } from 'antd';
import { Button, Segmented, Slider } from 'shared-ui';
import { ReloadOutlined } from '@ant-design/icons';

import { Term } from 'mlblocks';
import styles from '../inference.module.css';
import { type Decoding } from '../decoding';

interface DecodingControlsProps {
  value: Decoding;
  onChange: (next: Decoding) => void;
}

/**
 * The decoding knobs every inference page shares: the softmax temperature and
 * the greedy/sample switch (plus a re-roll for sampled chains). Maps 1:1 to
 * nanoGPT sample.py's `temperature` and multinomial sampling.
 */
export function DecodingControls({ value, onChange }: DecodingControlsProps) {
  return (
    <Flex align="center" gap="middle" wrap>
      <Flex align="center" gap="small">
        <Term
          label="temperature"
          explain="Divides every logit before the softmax: p ∝ e^(x/T). T < 1 sharpens the distribution toward the argmax; T > 1 flattens it toward uniform. It never changes the ranking — only how confident the model acts. nanoGPT's sample.py exposes exactly this knob."
          formula="p_i = \frac{e^{x_i / T}}{\sum_j e^{x_j / T}}"
        />
        <Slider
          min={0.2}
          max={3}
          step={0.1}
          value={value.temperature}
          onChange={(temperature) => onChange({ ...value, temperature })}
          className={styles.temperatureSlider}
        />
        <span className={styles.temperatureValue}>T = {value.temperature.toFixed(1)}</span>
      </Flex>
      <Flex align="center" gap="small">
        {/* A two-way button group — shared Segmented (vim-hintable) rather than
            antd Radio.Group optionType="button", which renders the same UI. */}
        <Segmented
          size="small"
          value={value.mode}
          onChange={(mode) => onChange({ ...value, mode: mode as Decoding['mode'] })}
          options={[
            { label: 'greedy', value: 'greedy' },
            { label: 'sample', value: 'sample' },
          ]}
        />
        {value.mode === 'sample' && (
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => onChange({ ...value, nonce: value.nonce + 1 })}
          >
            resample
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

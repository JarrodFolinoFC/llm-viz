import { useState } from 'react';

import { DEFAULT_DECODING, type Decoding } from './decoding';

/** The decoding-knob state (temperature, greedy vs sample) every inference
 *  page holds and hands to its DecodingControls. */
export function useDecoding() {
  return useState<Decoding>(DEFAULT_DECODING);
}

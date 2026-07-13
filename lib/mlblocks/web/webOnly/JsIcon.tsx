import { webPrimitives } from '../primitives';

/** The JS square glyph, via the web icon map (fills with currentColor). */
export function JsIcon({ className }: { size?: number; className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-flex' }}>
      <webPrimitives.Icon name="js" />
    </span>
  );
}

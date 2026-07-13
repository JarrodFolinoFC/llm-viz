/**
 * Save `data` as a JSON file download — the object-URL + synthetic-click dance
 * the backup/export buttons each hand-rolled. Strings are written verbatim
 * (for callers that already serialised); anything else is pretty-printed.
 */
export function downloadJson(filename: string, data: unknown): void {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Thin wrapper over Prism for highlighting the console's JavaScript. Importing
// the language components registers them on the shared Prism instance; we only
// expose a string→HTML helper so callers never touch Prism directly.
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

/** Highlight a JS string to HTML using Prism's `token` classes (styled by CSS). */
export function highlightJs(code: string): string {
  return Prism.highlight(code, Prism.languages.javascript, 'javascript');
}

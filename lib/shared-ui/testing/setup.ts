// Shared vitest setup for the apps' jsdom component tests: polyfills for the
// browser APIs jsdom lacks but antd/the charts touch. Wire it in via
//   test: { setupFiles: ['shared-ui/vitest-setup'] }
// Deliberately dependency-free so any app can use it without extra devDeps.

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }

  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }

  // jsdom has no elementFromPoint; the vim layer calls it to find the scroll
  // container under the pointer when hint mode starts. Null is a safe answer
  // (the layer's walk just no-ops), and it keeps hint-mode tests from throwing.
  if (typeof document !== 'undefined' && !document.elementFromPoint) {
    document.elementFromPoint = () => null;
  }

  // jsdom's Blob/File have no .text(); the apps read uploads with it.
  if (typeof Blob !== 'undefined' && !Blob.prototype.text) {
    Blob.prototype.text = function (this: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error as Error);
        r.readAsText(this);
      });
    };
  }
}

export {};

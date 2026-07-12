import '@testing-library/jest-dom';

// jsdom does not implement IntersectionObserver, but several components
// (notably <Reveal>) construct one on mount. Tests that exercise scroll
// behaviour mock playReveal directly, so a no-op stub is sufficient here
// to keep the constructor from throwing during render.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    constructor(callback) {
      this.callback = callback;
    }

    observe() {}

    unobserve() {}

    disconnect() {}

    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver = IntersectionObserverStub;
}

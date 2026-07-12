/**
 * @file Verifies the reduced-motion hook responds to arbitrary media-query changes.
 */
import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import { act, renderHook } from '@testing-library/react';
import fc from 'fast-check';

import { useReducedMotion } from './useReducedMotion';

/**
 * Build a fake MediaQueryList whose `matches` value is mutable and whose
 * registered `change` listeners can be dispatched on demand.
 */
function createFakeMediaQueryList(initial) {
  const listeners = new Set();
  const mql = {
    matches: initial,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (type, listener) => {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener: (type, listener) => {
      if (type === 'change') listeners.delete(listener);
    },
    // Legacy API surface, in case anything ever falls back to it.
    addListener: (listener) => listeners.add(listener),
    removeListener: (listener) => listeners.delete(listener),
    dispatchEvent: () => true,
  };
  // Helper for tests, not part of the standard API.
  mql.__setMatches = (next) => {
    mql.matches = next;
    const event = { matches: next, media: mql.media, type: 'change' };
    for (const listener of listeners) listener(event);
  };
  return mql;
}

function installMatchMedia(initial) {
  const mql = createFakeMediaQueryList(initial);
  const matchMedia = vi.fn(() => mql);
  // jsdom does not implement matchMedia by default, so we attach our fake.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  });
  return mql;
}

afterEach(() => {
  // Remove our fake so each test starts from a clean slate.
  delete window.matchMedia;
  vi.restoreAllMocks();
});

describe('useReducedMotion (property tests)', () => {
  /**
   * Property 10: Live reduced-motion preference toggles take effect.
   *
   * For an arbitrary sequence of `matches` boolean changes dispatched on the
   * mocked `MediaQueryList`, every read of the hook value after a change
   * reflects the new value.
   *
   * **Validates: Requirements 5.4**
   */
  it('reflects every dispatched matches change in the hook value', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 25 }),
        (initial, sequence) => {
          const mql = installMatchMedia(initial);

          const { result, unmount } = renderHook(() => useReducedMotion());

          // Initial render must reflect the initial matchMedia value.
          expect(result.current).toBe(initial);

          for (const next of sequence) {
            act(() => {
              mql.__setMatches(next);
            });
            expect(result.current).toBe(next);
          }

          unmount();
        },
      ),
      { numRuns: 50 },
    );
  });
});

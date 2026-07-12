import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * React hook that tracks the user's `prefers-reduced-motion` preference.
 *
 * Reads the initial value from `window.matchMedia('(prefers-reduced-motion: reduce)')`
 * and subscribes to the resulting `MediaQueryList`'s `change` event so that
 * toggling the OS-level setting during a session takes effect on subsequent
 * renders without requiring a reload.
 *
 * Falls back to `false` in non-browser environments (e.g. SSR) where
 * `window.matchMedia` is not available.
 *
 * @returns {boolean} `true` when reduced motion is requested, otherwise `false`.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia(QUERY);
    const onChange = (event) => setReduced(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

import { useEffect, useRef } from 'react';

import { applyParallax } from '../motion/engine';
import { useReducedMotion } from '../motion/useReducedMotion';

/**
 * Wraps children in an element that translates vertically in response to
 * scroll, creating a parallax depth effect. The component is the host of
 * Property 12 ("parallax transform is a deterministic function of scroll
 * position") and the reduced-motion gate from Requirement 5.2.
 *
 * Behaviour:
 *  - When reduced motion is off: a passive `scroll` listener is attached to
 *    `window`. On each scroll event the transform is applied inside a
 *    `requestAnimationFrame` call so we never block the main thread.
 *    Any pending rAF is cancelled before scheduling the next one.
 *  - When reduced motion is on (or on unmount): the scroll listener is
 *    detached, any pending rAF is cancelled, and
 *    `applyParallax(el, 0, { reducedMotion: true })` is called to reset
 *    any residual transform to its final visible state.
 *  - The effect re-runs when the reduced-motion preference toggles, so a
 *    visitor flipping the OS-level setting mid-session sees the new
 *    behaviour without a reload.
 *
 * Props:
 *  - `as`: tag name (or component) used to render the wrapper. Defaults
 *    to `'div'`.
 *  - `factor`: numeric parallax speed factor written to `data-parallax`.
 *    `applyParallax` in the engine reads this attribute to compute the
 *    translate offset: `translateY = scrollY * factor`. Defaults to `0.2`.
 *  - `children`: the content to parallax.
 *  - Any other props are forwarded to the underlying element.
 *
 * @param {{ as?: keyof JSX.IntrinsicElements | React.ElementType, factor?: number, children?: React.ReactNode }} props
 */
export function ParallaxLayer({
  as: Tag = 'div', factor = 0.2, children, ...rest
}) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (reducedMotion) {
      // Reset to final visible state; no scroll listener needed.
      applyParallax(el, 0, { reducedMotion: true });
      return undefined;
    }

    let rafId = null;

    const onScroll = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        rafId = null;
        applyParallax(el, window.scrollY, { reducedMotion: false });
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Apply immediately on mount so the initial position is correct.
    applyParallax(el, window.scrollY, { reducedMotion: false });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Reset transform on unmount.
      applyParallax(el, 0, { reducedMotion: true });
    };
  }, [reducedMotion]);

  return (
    <Tag ref={ref} data-parallax={factor} {...rest}>
      {children}
    </Tag>
  );
}

import { useEffect, useRef } from 'react';

import { playReveal } from '../motion/engine';
import { useReducedMotion } from '../motion/useReducedMotion';

/**
 * Wrap children in an element that fades/slides in when it first scrolls
 * into view. The component is the host of Property 11 ("scroll-triggered
 * entrance fires once per card") and the reduced-motion branch of
 * Requirement 5.2.
 *
 * Behaviour:
 *  - On mount in the motion-on branch, the wrapper's opacity is set to `0`
 *    and an `IntersectionObserver` is created with a `0.15` threshold.
 *    The first time the wrapper intersects the viewport we call
 *    `playReveal` on it and then `unobserve` so the entrance fires
 *    exactly once per mounted instance.
 *  - On mount in the reduced-motion branch, no observer is created;
 *    instead `playReveal(el, { reducedMotion: true })` is invoked
 *    immediately so the element is rendered in its final visible state
 *    (`opacity: 1`, no residual transform).
 *  - The effect re-runs when the reduced-motion preference toggles, so a
 *    visitor flipping the OS-level setting mid-session sees the new
 *    behaviour without a reload.
 *  - When the component unmounts (or the effect re-runs), any active
 *    observer is disconnected so we never leak listeners.
 *
 * Props:
 *  - `as`: tag name (or component) used to render the wrapper. Defaults
 *    to `'div'`. This lets callers preserve semantic structure (e.g.
 *    `<Reveal as="li">` inside a list) while keeping the entrance
 *    behaviour identical.
 *  - `children`: the content to reveal.
 *  - Any other props are forwarded to the underlying element.
 *
 * @param {{ as?: keyof JSX.IntrinsicElements | React.ElementType, children?: React.ReactNode }} props
 */
export function Reveal({ as: Tag = 'div', children, ...rest }) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (reducedMotion) {
      // Skip the observer entirely; render directly in final state.
      playReveal(el, { reducedMotion: true });
      return undefined;
    }

    // Hide before the first intersect so the reveal has somewhere to animate from.
    el.style.opacity = '0';

    const observer = new IntersectionObserver(
      (entries, io) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            playReveal(entry.target, { reducedMotion: false });
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}

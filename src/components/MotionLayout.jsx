import {
  cloneElement, isValidElement, useEffect, useRef, useState,
} from 'react';
import { useLocation } from 'react-router-dom';

import { playTransition } from '../motion/engine';
import { useReducedMotion } from '../motion/useReducedMotion';

/**
 * Wraps `<Routes>` (or any children) and animates the page container when
 * `useLocation().pathname` changes.
 *
 * Behaviour:
 *  1. On every `pathname` change, the currently rendered container (outgoing)
 *     is faded out via `playTransition(outgoing, null, opts)`.
 *  2. Only once that await resolves are the children swapped to the new
 *     route's children (async-safe: the old page is fully gone before the
 *     new one renders).
 *  3. On the next animation frame after the new children mount,
 *     `playTransition(null, incoming, opts)` fades the incoming container in.
 *
 * The container element is tracked through a single `ref` so both halves of
 * the transition talk to the same DOM node.
 *
 * Under reduced motion both transitions resolve immediately (handled by the
 * engine), so the swap is still performed but without any visual delay.
 *
 * Props:
 *  - `children`: the `<Routes>` tree (or any subtree) to transition between.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function MotionLayout({ children }) {
  const { pathname } = useLocation();
  const containerRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // `displayed` holds the children and pathname that are currently rendered
  // in the DOM. They lag behind `pathname`/`children` by exactly one outgoing
  // transition so the old content is visible until the fade-out completes.
  const [displayed, setDisplayed] = useState({ pathname, children });

  // <Routes> consumes router context directly. Pinning its location prevents
  // it from rendering the destination route before the outgoing transition
  // has completed and displayed has intentionally advanced.
  const displayedChildren = isValidElement(displayed.children)
    ? cloneElement(displayed.children, { location: displayed.pathname })
    : displayed.children;

  useEffect(() => {
    // Capture the ref value at effect-run time so the closure is stable even
    // if the ref node is replaced between the two halves of the transition.
    const outgoing = containerRef.current;

    playTransition(outgoing, null, { reducedMotion }).then(() => {
      // Swap to the new route's children.
      setDisplayed({ pathname, children });

      // Give React one frame to commit the new children before triggering
      // the incoming fade so we always animate real, painted DOM nodes.
      requestAnimationFrame(() => {
        playTransition(null, containerRef.current, { reducedMotion });
      });
    });
    // `children` is intentionally omitted: we only want this effect to fire
    // on genuine pathname changes, not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, reducedMotion]);

  return (
    <div ref={containerRef} data-page={displayed.pathname}>
      {displayedChildren}
    </div>
  );
}

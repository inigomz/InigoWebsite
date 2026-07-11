import anime from 'animejs';
import { DURATION, EASING, STAGGER } from './tokens';

/**
 * Animation_Engine primitives backed by anime.js.
 *
 * Each primitive accepts a target plus an options bag that includes a
 * `reducedMotion` flag. When `reducedMotion` is `true`, the primitive
 * skips the anime.js timeline entirely, places the targeted element(s)
 * in their final visible state (`opacity: 1`, `transform: 'none'`), and
 * returns a resolved promise so callers (such as the route-transition
 * pipeline) can await it without branching.
 *
 * When `reducedMotion` is `false`, the primitive runs an anime.js timeline
 * and exposes its `.finished` promise. We always coerce that promise to a
 * resolution via `.catch(() => {})` so a rejection inside anime.js can
 * never wedge a route transition mid-fade.
 */

/**
 * Apply the final, reduced-motion-safe visual state to an element.
 *
 * @param {Element | null | undefined} el The element to reset (no-op if falsy).
 */
function setFinalState(el) {
  if (!el || !el.style) return;
  el.style.opacity = '1';
  el.style.transform = 'none';
}

/**
 * Coerce an anime.js `.finished` promise into one that always resolves.
 *
 * Route transitions chain on these promises; a rejection from anime.js
 * (e.g. a torn-down DOM node) must not leave the UI mid-transition.
 *
 * @param {Promise<unknown> | undefined} finished The anime.js `.finished` promise.
 * @returns {Promise<void>} A promise that resolves once the timeline settles.
 */
function safeFinished(finished) {
  return Promise.resolve(finished).catch(() => {}).then(() => undefined);
}

/**
 * Play the Home_Page hero reveal: a staggered fade/slide on every
 * `[data-hero-char]` descendant of `target`.
 *
 * Under reduced motion the container and all hero-char descendants are
 * placed directly in their final state.
 *
 * @param {HTMLElement} target            The hero container element.
 * @param {{ reducedMotion?: boolean }} [options]
 * @returns {Promise<void>} Resolves when the animation settles (or immediately under reduced motion).
 */
export function playHero(target, { reducedMotion } = {}) {
  if (reducedMotion) {
    setFinalState(target);
    if (target && typeof target.querySelectorAll === 'function') {
      const chars = target.querySelectorAll('[data-hero-char]');
      chars.forEach(setFinalState);
    }
    return Promise.resolve();
  }
  return safeFinished(
    anime({
      targets: target.querySelectorAll('[data-hero-char]'),
      opacity: [0, 1],
      translateY: [12, 0],
      delay: anime.stagger(STAGGER.hero),
      duration: DURATION.hero,
      easing: EASING.standard,
    }).finished
  );
}

/**
 * Play a scroll-triggered entrance reveal on a single element.
 *
 * Under reduced motion the element is placed directly in its final state.
 *
 * @param {HTMLElement} el                The element to reveal.
 * @param {{ reducedMotion?: boolean }} [options]
 * @returns {Promise<void>} Resolves when the reveal completes (or immediately under reduced motion).
 */
export function playReveal(el, { reducedMotion } = {}) {
  if (reducedMotion) {
    setFinalState(el);
    return Promise.resolve();
  }
  return safeFinished(
    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: DURATION.reveal,
      easing: EASING.standard,
    }).finished
  );
}

/**
 * Apply a parallax transform to `el` based on a vertical scroll offset.
 *
 * The element's `data-parallax` attribute supplies the parallax factor
 * (numeric, defaults to `0.2`). The function writes
 * `translate3d(0, ${scrollY * factor}px, 0)` to the element's inline
 * transform, making the output a deterministic function of `scrollY`.
 *
 * Under reduced motion the element is placed directly in its final state.
 *
 * @param {HTMLElement} el                The parallax target.
 * @param {number} scrollY                The current vertical scroll offset in pixels.
 * @param {{ reducedMotion?: boolean }} [options]
 */
export function applyParallax(el, scrollY, { reducedMotion } = {}) {
  if (!el || !el.style) return;
  if (reducedMotion) {
    setFinalState(el);
    return;
  }
  const raw = el.dataset ? el.dataset.parallax : undefined;
  const parsed = Number(raw);
  const factor = Number.isFinite(parsed) ? parsed : 0.2;
  el.style.transform = `translate3d(0, ${scrollY * factor}px, 0)`;
}

/**
 * Play a route transition: fade out the outgoing page container and
 * fade/slide in the incoming page container. Either side may be `null`
 * when only one container exists at a given moment in the swap.
 *
 * Under reduced motion both containers are placed directly in their
 * final state.
 *
 * @param {HTMLElement | null} outgoing   The container leaving the viewport.
 * @param {HTMLElement | null} incoming   The container entering the viewport.
 * @param {{ reducedMotion?: boolean }} [options]
 * @returns {Promise<void>} Resolves once both halves of the transition settle.
 */
export function playTransition(outgoing, incoming, { reducedMotion } = {}) {
  if (reducedMotion) {
    setFinalState(outgoing);
    setFinalState(incoming);
    return Promise.resolve();
  }
  const out = outgoing
    ? safeFinished(
        anime({
          targets: outgoing,
          opacity: [1, 0],
          duration: DURATION.transitionOut,
          easing: EASING.standard,
        }).finished
      )
    : Promise.resolve();
  const inn = incoming
    ? safeFinished(
        anime({
          targets: incoming,
          opacity: [0, 1],
          translateY: [8, 0],
          duration: DURATION.transitionIn,
          easing: EASING.standard,
        }).finished
      )
    : Promise.resolve();
  return Promise.all([out, inn]).then(() => undefined);
}

/**
 * Play a hover/focus micro-interaction (a brief scale pulse).
 *
 * Under reduced motion the element is placed directly in its final state
 * and the consuming component may use `data-micro-state` for a non-motion
 * affordance (e.g. a CSS color change).
 *
 * @param {HTMLElement} el                The interactive element.
 * @param {{ reducedMotion?: boolean }} [options]
 * @returns {Promise<void>} Resolves when the pulse completes (or immediately under reduced motion).
 */
export function playMicro(el, { reducedMotion } = {}) {
  if (reducedMotion) {
    setFinalState(el);
    return Promise.resolve();
  }
  return safeFinished(
    anime({
      targets: el,
      scale: [1, 1.03, 1],
      duration: DURATION.micro,
      easing: EASING.spring,
    }).finished
  );
}

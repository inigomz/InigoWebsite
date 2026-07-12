// Motion design tokens for the Portfolio_Website Animation_Engine.
//
// These tokens are the single source of truth for animation timing,
// easing, and stagger across the Animation_Engine primitives in
// `./engine.js` (`playHero`, `playReveal`, `playTransition`, `playMicro`,
// `applyParallax`).
//
// - Durations are expressed in milliseconds (anime.js convention).
// - Easing strings follow anime.js easing names, including the `spring()`
//   helper for tactile micro-interactions.
// - Stagger values are per-element delays in milliseconds.

/**
 * Per-primitive animation durations (ms).
 *
 * @property {number} hero          Home_Page hero reveal (staggered char entrance).
 * @property {number} reveal        Scroll-triggered entrance via IntersectionObserver.
 * @property {number} transitionIn  Incoming page fade/slide on route change.
 * @property {number} transitionOut Outgoing page fade on route change.
 * @property {number} micro         Hover/focus micro-interaction on cards and links.
 */
export const DURATION = {
  hero: 800,
  reveal: 500,
  transitionIn: 350,
  transitionOut: 250,
  micro: 220,
};

/**
 * Easing curves consumed by anime.js timelines.
 *
 * @property {string} standard ease-out curve for opacity / translate animations.
 * @property {string} spring   spring(mass, stiffness, damping, velocity) for micro-interactions.
 */
export const EASING = {
  standard: 'easeOutCubic',
  spring: 'spring(1, 80, 10, 0)',
};

/**
 * Per-element stagger delays (ms).
 *
 * @property {number} hero Delay between successive [data-hero-char] elements during the hero reveal.
 */
export const STAGGER = {
  hero: 28,
};

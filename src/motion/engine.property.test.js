import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import fc from 'fast-check';

// Import after the mock so we get the mocked default export and can
// assert on its call count.
import anime from 'animejs';
import {
  applyParallax,
  playHero,
  playMicro,
  playReveal,
  playTransition,
} from './engine';

// Hoisted by Vitest so the engine module under test imports the mock
// instead of the real animejs library. The default export is the
// `anime()` function and it carries `stagger` as a property, mirroring
// the surface of animejs v3 that `engine.js` consumes.
vi.mock('animejs', () => {
  const animeMock = vi.fn(() => ({ finished: Promise.resolve() }));
  animeMock.stagger = vi.fn(() => 0);
  return { default: animeMock };
});

/**
 * Generator for a synthetic target element specification.
 *
 * We generate plain data here and only build live DOM nodes inside the
 * property body so each shrink iteration starts from a clean container.
 */
const elementSpec = fc.record({
  initialOpacity: fc.constantFrom('', '0', '0.25', '0.5', '0.75', '1', 'invalid'),
  initialTransform: fc.constantFrom(
    '',
    'none',
    'translateY(12px)',
    'translate3d(0, 40px, 0)',
    'rotate(45deg) scale(1.1)',
    'invalid',
  ),
  childCount: fc.integer({ min: 0, max: 5 }),
  parallaxFactor: fc.option(
    fc.constantFrom('0', '0.1', '0.2', '0.5', '1', '-0.3', 'NaN', ''),
  ),
});

/** Materialize an element from a spec, optionally with hero-char children. */
function buildElement(spec) {
  const el = document.createElement('div');
  if (spec.initialOpacity !== '') el.style.opacity = spec.initialOpacity;
  if (spec.initialTransform !== '') el.style.transform = spec.initialTransform;
  if (spec.parallaxFactor != null) el.dataset.parallax = spec.parallaxFactor;
  for (let i = 0; i < spec.childCount; i += 1) {
    const c = document.createElement('span');
    c.setAttribute('data-hero-char', String(i));
    // Pre-populate non-final state so we can verify the gate forces them
    // back to opacity 1 and transform none.
    c.style.opacity = '0';
    c.style.transform = 'translateY(12px)';
    el.appendChild(c);
  }
  return el;
}

/** Assert an element ended up in its reduced-motion final state. */
function assertFinalState(el) {
  expect(el.style.opacity).toBe('1');
  expect(el.style.transform).toBe('none');
}

beforeEach(() => {
  anime.mockClear();
  anime.stagger.mockClear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Animation_Engine reduced-motion gate (property tests)', () => {
  /**
   * Property 9: Reduced motion gate skips motion and leaves elements in final state.
   *
   * For every primitive in `{playHero, playReveal, applyParallax, playTransition,
   * playMicro}` and an arbitrary target element, calling with `reducedMotion: true`
   * invokes no animejs timeline (mock animejs and assert zero calls) and leaves
   * the element with `opacity: 1` and no residual transform.
   *
   * **Validates: Requirements 5.2, 5.3, 4.7**
   */
  it('skips animejs and leaves targets in final state for every primitive', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'playHero',
          'playReveal',
          'applyParallax',
          'playTransition',
          'playMicro',
        ),
        elementSpec,
        elementSpec,
        fc.double({ min: 0, max: 1_000_000, noNaN: true }),
        // Whether playTransition's outgoing/incoming side is null.
        fc.tuple(fc.boolean(), fc.boolean()),
        async (kind, primarySpec, secondarySpec, scrollY, [outNull, inNull]) => {
          anime.mockClear();
          anime.stagger.mockClear();

          const primary = buildElement(primarySpec);
          const secondary = buildElement(secondarySpec);
          document.body.appendChild(primary);
          document.body.appendChild(secondary);

          if (kind === 'playHero') {
            await playHero(primary, { reducedMotion: true });
            expect(anime).not.toHaveBeenCalled();
            expect(anime.stagger).not.toHaveBeenCalled();
            assertFinalState(primary);
            primary.querySelectorAll('[data-hero-char]').forEach(assertFinalState);
          } else if (kind === 'playReveal') {
            await playReveal(primary, { reducedMotion: true });
            expect(anime).not.toHaveBeenCalled();
            assertFinalState(primary);
          } else if (kind === 'applyParallax') {
            applyParallax(primary, scrollY, { reducedMotion: true });
            expect(anime).not.toHaveBeenCalled();
            assertFinalState(primary);
          } else if (kind === 'playTransition') {
            // Cover the optional-side branches (outgoing or incoming may be null)
            // while still proving zero animejs invocations.
            const outgoing = outNull ? null : primary;
            const incoming = inNull ? null : secondary;
            await playTransition(outgoing, incoming, { reducedMotion: true });
            expect(anime).not.toHaveBeenCalled();
            if (outgoing) assertFinalState(outgoing);
            if (incoming) assertFinalState(incoming);
          } else if (kind === 'playMicro') {
            await playMicro(primary, { reducedMotion: true });
            expect(anime).not.toHaveBeenCalled();
            assertFinalState(primary);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('applyParallax determinism (property tests)', () => {
  /**
   * Property 12: Parallax transform is a deterministic function of scroll position.
   *
   * Part A — formula: For arbitrary non-negative scroll offsets `y` and
   * arbitrary numeric `data-parallax` factors `f`, calling `applyParallax(el, y)`
   * (with reduced motion off) writes exactly `translate3d(0, ${y * f}px, 0)`
   * to the element's inline transform.
   *
   * Part B — monotonicity: For arbitrary non-negative factors `f >= 0` and
   * `y1 <= y2` (both non-negative), the translateY value produced by the engine
   * for `y1` is `<=` the translateY value produced for `y2`. (Monotonicity only
   * holds for non-negative factors; the generator is constrained accordingly.)
   *
   * **Validates: Requirements 4.4**
   */

  // Bounded numeric ranges keep generation away from floating-point edge cases
  // (Infinity, NaN, subnormal overflow) that aren't in scope for parallax.
  const scrollOffset = fc.double({ min: 0, max: 1_000_000, noNaN: true });
  const anyFactor = fc.double({ min: -100, max: 100, noNaN: true });
  const nonNegativeFactor = fc.double({ min: 0, max: 100, noNaN: true });

  it('writes translate3d(0, y*f px, 0) for arbitrary y >= 0 and finite factor f', () => {
    fc.assert(
      fc.property(scrollOffset, anyFactor, (y, f) => {
        const el = document.createElement('div');
        // Round-trips exactly: Number(String(f)) === f for all finite doubles,
        // so the engine recovers the same factor we generated.
        el.dataset.parallax = String(f);

        applyParallax(el, y);

        expect(el.style.transform).toBe(`translate3d(0, ${y * f}px, 0)`);
      }),
      { numRuns: 200 },
    );
  });

  it('is monotonic non-decreasing in y for non-negative factors', () => {
    // Pulls the translateY component out of `translate3d(0, <N>px, 0)`
    // so we compare what the engine actually wrote, not a recomputation.
    const translateYRe = /^translate3d\(0, (-?[0-9.eE+-]+)px, 0\)$/;

    fc.assert(
      fc.property(scrollOffset, scrollOffset, nonNegativeFactor, (a, b, f) => {
        const y1 = Math.min(a, b);
        const y2 = Math.max(a, b);

        const el1 = document.createElement('div');
        const el2 = document.createElement('div');
        el1.dataset.parallax = String(f);
        el2.dataset.parallax = String(f);

        applyParallax(el1, y1);
        applyParallax(el2, y2);

        const m1 = translateYRe.exec(el1.style.transform);
        const m2 = translateYRe.exec(el2.style.transform);
        expect(m1).not.toBeNull();
        expect(m2).not.toBeNull();

        const v1 = parseFloat(m1[1]);
        const v2 = parseFloat(m2[1]);
        expect(v1).toBeLessThanOrEqual(v2);
      }),
      { numRuns: 200 },
    );
  });
});

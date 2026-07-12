import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import {
  act, cleanup, render, screen,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fc from 'fast-check';

import { playMicro } from '../motion/engine';
import { ProjectCard } from './ProjectCard';

// Mock the engine so we can count playMicro invocations precisely. Keeping
// the resolved promise lets the in-flight debounce inside ProjectCard clear
// itself between activations.
vi.mock('../motion/engine', () => ({
  playMicro: vi.fn(() => Promise.resolve()),
  playReveal: vi.fn(() => Promise.resolve()),
  playHero: vi.fn(() => Promise.resolve()),
  playTransition: vi.fn(() => Promise.resolve()),
  applyParallax: vi.fn(),
}));

/**
 * Property 14: Micro-interaction trigger plays exactly once per activation.
 *
 * For arbitrary sequences of `pointerenter` / `focus` activations on a
 * `ProjectCard`, `playMicro` is called exactly once per discrete
 * activation and the element is left at `opacity: 1` with no residual
 * transform after each.
 *
 * The component debounces while an animation is in-flight, so we wait for
 * the resolved `playMicro` promise to drain between activations. That
 * matches real usage: a user firing a new pointer/focus event after the
 * pulse has settled should retrigger it.
 *
 * **Validates: Requirements 4.6, 4.7**
 */

// One activation = either a pointerenter or a focus event on the card.
const activationArb = fc.constantFrom('pointerenter', 'focus');

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderCard() {
  return render(
    <MemoryRouter>
      <ProjectCard slug="x" title="X" tech={['a']} description="d" />
    </MemoryRouter>,
  );
}

describe('ProjectCard micro-interaction property tests', () => {
  it('invokes playMicro exactly once per discrete activation', async () => {
    // Outer fast-check `assert` with `asyncProperty` so we can `await` the
    // resolved playMicro promise inside the property and let React flush
    // the in-flight ref reset.
    await fc.assert(
      fc.asyncProperty(
        fc.array(activationArb, { minLength: 1, maxLength: 12 }),
        async (activations) => {
          renderCard();

          try {
            // The card is the only link in the tree; grab it once.
            const card = screen.getByRole('link');

            for (const event of activations) {
              // Fire the event inside `act` so React flushes effects.
              await act(async () => {
                if (event === 'focus') {
                  // Blur first so a subsequent focus always fires as a new event.
                  card.blur();
                  card.focus();
                } else {
                  card.dispatchEvent(
                    new Event('pointerenter', { bubbles: true }),
                  );
                }
                // Drain microtasks so the resolved playMicro promise clears
                // the inFlight ref before the next activation.
                await Promise.resolve();
                await Promise.resolve();
              });

              // Final-state check after each activation: under the mock,
              // playMicro returns `Promise.resolve()` and does not write
              // any inline styles, so `opacity` stays at the default ('')
              // and `transform` stays unset. We assert there is no
              // *residual* transform — i.e. nothing the component itself
              // left behind.
              expect(card.style.transform).toBe('');
              expect(card.style.opacity === '' || card.style.opacity === '1').toBe(true);
            }

            // One playMicro call per activation, in order.
            expect(playMicro).toHaveBeenCalledTimes(activations.length);
          } finally {
            cleanup();
            playMicro.mockClear();
          }
        },
      ),
      { numRuns: 25 },
    );
  });
});

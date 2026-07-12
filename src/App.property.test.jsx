import {
  describe, expect, it, vi,
} from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fc from 'fast-check';

import { App } from './App';

// Keep the loader deterministic and small so the tests focus purely on routing.
vi.mock('./content/loader', () => ({
  projects: [],
  getProjectBySlug: vi.fn(() => undefined),
}));

// Stub all motion primitives — jsdom can't run anime.js timelines.
vi.mock('./motion/engine', () => ({
  playReveal: vi.fn(() => Promise.resolve()),
  playMicro: vi.fn(() => Promise.resolve()),
  playHero: vi.fn(() => Promise.resolve()),
  playTransition: vi.fn(() => Promise.resolve()),
  applyParallax: vi.fn(),
}));

/**
 * Property 7: Unknown route renders site Not_Found.
 *
 * For arbitrary URL paths that do not match any defined route, render the
 * app at the path and assert the Not_Found view contains a link to `/`.
 *
 * **Validates: Requirements 2.6**
 *
 * Property 8: Persistent navigation on every route.
 *
 * For each defined route in `{/, /projects, /projects/:slug, /about}`,
 * render the app and assert links with targets `/`, `/projects`, and
 * `/about` are present.
 *
 * **Validates: Requirements 2.5**
 */

// Path segment generator: non-empty, no slashes, no whitespace, ASCII printable.
const segmentArb = fc
  .stringOf(
    fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_',
    ),
    { minLength: 1, maxLength: 12 },
  );

// Known route prefixes the App actually serves. We exclude these so the
// generated path lands on the catch-all `*` route.
const KNOWN_TOP_LEVEL = new Set(['', 'projects', 'about']);

// Arbitrary path of 1+ segments that does not collide with a defined route.
const unknownPathArb = fc
  .array(segmentArb, { minLength: 1, maxLength: 4 })
  .filter((segments) => {
    const first = segments[0];
    if (KNOWN_TOP_LEVEL.has(first)) return false;
    // /projects/:slug is also defined, but the filter on `projects` above
    // already excludes any path beginning with /projects, so we're safe.
    return true;
  })
  .map((segments) => `/${segments.join('/')}`);

function renderAppAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App routing property tests', () => {
  it('renders the site NotFound with a / link for any unknown path', () => {
    fc.assert(
      fc.property(unknownPathArb, (path) => {
        const { unmount } = renderAppAt(path);

        try {
          // The site-variant NotFound renders a "Back to home" link to `/`.
          const link = screen.getByRole('link', { name: /back to home/i });
          expect(link).toBeInTheDocument();
          expect(link).toHaveAttribute('href', '/');
        } finally {
          unmount();
          cleanup();
        }
      }),
      { numRuns: 50 },
    );
  });

  it('renders persistent nav links to /, /projects, and /about on every defined route', () => {
    // The four route shapes the app actually defines. We pick a concrete slug
    // for the dynamic /projects/:slug route; its rendered NotFound is fine
    // for this test because we're only asserting the persistent nav.
    const routes = ['/', '/projects', '/projects/some-slug', '/about'];

    fc.assert(
      fc.property(fc.constantFrom(...routes), (path) => {
        const { unmount } = renderAppAt(path);

        try {
          // The Nav component tags every NavLink with data-testid="nav-link".
          const navLinks = screen.getAllByTestId('nav-link');
          const targets = navLinks.map((a) => a.getAttribute('href'));
          expect(targets).toEqual(expect.arrayContaining(['/', '/projects', '/about']));
        } finally {
          unmount();
          cleanup();
        }
      }),
      { numRuns: 25 },
    );
  });
});

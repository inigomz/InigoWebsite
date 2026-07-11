import { describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fc from 'fast-check';

// Mock the loader so the test controls which projects are visible.
vi.mock('../content/loader', () => ({
  projects: [],
  getProjectBySlug: vi.fn(),
}));

// Mock animation primitives — jsdom has no layout engine so anime.js
// timeline calls would throw or silently fail.
vi.mock('../motion/engine', () => ({
  playReveal: vi.fn(() => Promise.resolve()),
  playMicro: vi.fn(() => Promise.resolve()),
  playHero: vi.fn(() => Promise.resolve()),
  playTransition: vi.fn(() => Promise.resolve()),
  applyParallax: vi.fn(),
}));

import * as loader from '../content/loader';
import { Projects } from './Projects';

/**
 * Property 4: Projects page lists and links every record.
 *
 * Render `<Projects />` with arbitrary loader fixtures injected; assert one
 * card per record and that each card's link target is `/projects/${slug}`.
 *
 * **Validates: Requirements 3.6, 3.7**
 */

const safeString = fc
  .stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '),
    { minLength: 1 }
  )
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const slugArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'),
  { minLength: 1 }
);

const projectArb = fc.record({
  slug: slugArb,
  title: safeString,
  tech: fc.array(safeString, { minLength: 1 }),
  description: safeString,
  links: fc.array(
    fc.record({ label: safeString, url: safeString }),
    { minLength: 1 }
  ),
  body: fc.string(),
});

function renderProjects(projects) {
  // Inject the fixture directly into the mocked module's exported array.
  loader.projects.length = 0;
  projects.forEach((p) => loader.projects.push(p));

  return render(
    <MemoryRouter initialEntries={['/projects']}>
      <Projects />
    </MemoryRouter>
  );
}

describe('Projects page property tests', () => {
  it('renders exactly one card per record with the correct link target', () => {
    fc.assert(
      fc.property(
        // Use uniqueArray to avoid duplicate slugs which would cause duplicate keys.
        fc.uniqueArray(projectArb, { minLength: 1, maxLength: 10, selector: (p) => p.slug }),
        (projects) => {
          const { unmount } = renderProjects(projects);

          try {
            const expectedHrefs = projects
              .map((p) => `/projects/${p.slug}`)
              .sort();

            // Every <a class="project-card"> rendered inside the list.
            const links = Array.from(
              document.querySelectorAll('a.project-card')
            );
            expect(links).toHaveLength(projects.length);

            const actualHrefs = links
              .map((a) => a.getAttribute('href'))
              .sort();
            expect(actualHrefs).toEqual(expectedHrefs);

            // Every project's link target is present in the DOM.
            for (const project of projects) {
              const target = `/projects/${project.slug}`;
              const match = links.find((a) => a.getAttribute('href') === target);
              expect(match).toBeTruthy();
              // The card surfaces the project title via aria-label.
              expect(match).toHaveAttribute('aria-label', `View project: ${project.title}`);
            }
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * @file Checks complete and missing project-detail states with generated records.
 */
import {
  describe, expect, it, vi,
} from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import fc from 'fast-check';

import { getProjectBySlug } from '../content/loader';
import { ProjectDetail } from './ProjectDetail';

vi.mock('../content/loader', () => ({
  projects: [],
  getProjectBySlug: vi.fn(),
}));

vi.mock('../motion/engine', () => ({
  playReveal: vi.fn(() => Promise.resolve()),
  playMicro: vi.fn(() => Promise.resolve()),
  playHero: vi.fn(() => Promise.resolve()),
  playTransition: vi.fn(() => Promise.resolve()),
  applyParallax: vi.fn(),
}));

/**
 * Property 5: Project detail renders all record content.
 *
 * For arbitrary Project_Records, render `/projects/{slug}` and assert title,
 * every tech entry, every link's label and href, description, and rendered
 * Markdown body all appear in the DOM.
 *
 * **Validates: Requirements 3.8**
 */

const safeString = fc
  .stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '),
    { minLength: 1 },
  )
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const slugArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'),
  { minLength: 1 },
);

const projectArb = fc.record({
  slug: slugArb,
  title: safeString,
  tech: fc.uniqueArray(safeString, { minLength: 1, maxLength: 5 }),
  links: fc.uniqueArray(
    fc.record({ label: safeString, url: fc.constant('https://example.com') }),
    { minLength: 1, maxLength: 4, selector: (l) => l.label },
  ),
  description: safeString,
  // Plain text body so react-markdown renders it as a <p> we can query.
  body: safeString,
});

function renderDetail(project) {
  getProjectBySlug.mockReturnValue(project);
  return render(
    <MemoryRouter initialEntries={[`/projects/${project.slug}`]}>
      <Routes>
        <Route path="/projects/:slug" element={<ProjectDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProjectDetail property tests', () => {
  it('renders title, tech, links, description and body for any valid record', () => {
    fc.assert(
      fc.property(projectArb, (project) => {
        const { unmount } = renderDetail(project);

        try {
          // Title — use the heading role to avoid ambiguity with body/description text.
          expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(project.title);

          // Tech chips — query within the tech list to avoid collisions with
          // description / title text that may be the same string.
          const techList = screen.getByRole('list', { name: /technologies used/i });
          for (const t of project.tech) {
            const chip = Array.from(techList.querySelectorAll('li')).find(
              (li) => li.textContent.trim() === t,
            );
            expect(chip).toBeTruthy();
          }

          // Links — label text and href.
          for (const link of project.links) {
            const el = screen.getByRole('link', { name: link.label });
            expect(el).toBeInTheDocument();
            expect(el).toHaveAttribute('href', link.url);
          }

          // Description — query the specific <p class="project-detail__description">.
          const descEl = document.querySelector('.project-detail__description');
          expect(descEl).toBeTruthy();
          expect(descEl.textContent.trim()).toBe(project.description);

          // Body — react-markdown renders plain text inside a <p> inside
          // .project-detail__body.
          const bodyContainer = document.querySelector('.project-detail__body');
          expect(bodyContainer).toBeTruthy();
          expect(bodyContainer.textContent.trim()).toBe(project.body);
        } finally {
          unmount();
          cleanup();
        }
      }),
      { numRuns: 50 },
    );
  });

  /**
   * Property 6: Unknown project slug renders project Not_Found.
   *
   * For arbitrary strings not in the loaded slug set, rendering
   * `/projects/{S}` shows the Not_Found view containing a link to
   * `/projects`.
   *
   * **Validates: Requirements 3.9**
   */
  it('renders project NotFound with a /projects link for any unknown slug', () => {
    fc.assert(
      fc.property(slugArb, (slug) => {
        // Mock the loader to return undefined: this slug is not loaded.
        getProjectBySlug.mockReturnValue(undefined);

        const { unmount } = render(
          <MemoryRouter initialEntries={[`/projects/${slug}`]}>
            <Routes>
              <Route path="/projects/:slug" element={<ProjectDetail />} />
            </Routes>
          </MemoryRouter>,
        );

        try {
          // The NotFound view renders a back-link to /projects.
          const link = screen.getByRole('link', { name: /back to projects/i });
          expect(link).toBeInTheDocument();
          expect(link).toHaveAttribute('href', '/projects');
        } finally {
          unmount();
          cleanup();
        }
      }),
      { numRuns: 50 },
    );
  });
});

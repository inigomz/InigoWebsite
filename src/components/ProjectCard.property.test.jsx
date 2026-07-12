/**
 * @file Verifies project cards preserve navigation and content through interactions.
 */
import {
  cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import {
  afterEach, describe, expect, it,
} from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import fc from 'fast-check';

import { ProjectCard } from './ProjectCard';

afterEach(cleanup);

/**
 * The animation is implemented as CSS state, so this test protects the more
 * important behavioral contract: pointer and keyboard interaction must never
 * alter the card's destination or accessible identity.
 */
describe('ProjectCard interaction property tests', () => {
  it('preserves its navigation contract through arbitrary interactions', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('enter', 'leave', 'focus', 'blur'), {
          minLength: 1,
          maxLength: 20,
        }),
        (interactions) => {
          const view = render(
            <MemoryRouter>
              <ProjectCard
                slug="pathfinder"
                title="Pathfinder"
                tech={['React', 'Canvas']}
                description="Explore graph searches."
              />
            </MemoryRouter>,
          );
          const card = screen.getByRole('link', { name: 'View project: Pathfinder' });

          interactions.forEach((interaction) => {
            if (interaction === 'enter') fireEvent.pointerEnter(card);
            if (interaction === 'leave') fireEvent.pointerLeave(card);
            if (interaction === 'focus') fireEvent.focus(card);
            if (interaction === 'blur') fireEvent.blur(card);
          });

          expect(card).toHaveAttribute('href', '/projects/pathfinder');
          expect(card).toHaveTextContent('Explore graph searches.');
          view.unmount();
        },
      ),
      { numRuns: 25 },
    );
  });
});

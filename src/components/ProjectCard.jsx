/**
 * @file Displays a project summary link with a smooth CSS interaction.
 */
import { Link } from 'react-router-dom';

/**
 * Render a project summary as a single navigable card.
 *
 * Hover and keyboard-focus motion live in CSS because they represent a
 * persistent interaction state. The browser can transition transforms on the
 * compositor and reverse them smoothly when the interaction ends.
 *
 * @param {{ slug: string, title: string, tech: string[], description: string }} props
 * @returns {JSX.Element}
 */
export function ProjectCard({
  slug, title, tech, description,
}) {
  return (
    <Link
      to={`/projects/${slug}`}
      className="project-card"
      aria-label={`View project: ${title}`}
    >
      <h2 className="project-card__title">{title}</h2>
      <ul className="project-card__tech" aria-label="Technologies used">
        {tech.map((technology) => (
          <li key={technology} className="project-card__chip">
            {technology}
          </li>
        ))}
      </ul>
      <p className="project-card__description">{description}</p>
    </Link>
  );
}

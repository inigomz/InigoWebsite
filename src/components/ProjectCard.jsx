import { useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { playMicro } from '../motion/engine';
import { useReducedMotion } from '../motion/useReducedMotion';

/**
 * Card component for a single project entry.
 *
 * Renders a `<Link>` to `/projects/${slug}` containing the project title,
 * a row of tech chip `<span>`s, and the description.
 *
 * On `pointerenter` and `focus`, plays a micro-interaction via `playMicro`.
 * Repeated events while an animation is already in-flight are debounced
 * using an `inFlight` ref so the primitive is never called twice
 * simultaneously on the same element.
 *
 * @param {{ slug: string, title: string, tech: string[], description: string }} props
 * @returns {JSX.Element}
 */
export function ProjectCard({
  slug, title, tech, description,
}) {
  const cardRef = useRef(null);
  const inFlight = useRef(false);
  const reducedMotion = useReducedMotion();

  const handleActivation = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    playMicro(cardRef.current, { reducedMotion }).then(() => {
      inFlight.current = false;
    });
  }, [reducedMotion]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return undefined;
    el.addEventListener('pointerenter', handleActivation);
    el.addEventListener('focus', handleActivation);
    return () => {
      el.removeEventListener('pointerenter', handleActivation);
      el.removeEventListener('focus', handleActivation);
    };
  }, [handleActivation]);

  return (
    <Link
      ref={cardRef}
      to={`/projects/${slug}`}
      className="project-card"
      aria-label={`View project: ${title}`}
    >
      <h2 className="project-card__title">{title}</h2>
      <ul className="project-card__tech" aria-label="Technologies used">
        {tech.map((t) => (
          <li key={t} className="project-card__chip">
            {t}
          </li>
        ))}
      </ul>
      <p className="project-card__description">{description}</p>
    </Link>
  );
}

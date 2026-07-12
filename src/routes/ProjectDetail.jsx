import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import { getProjectBySlug } from '../content/loader';
import { NotFound } from './NotFound';

/**
 * Project detail page.
 *
 * Reads the `:slug` param from the URL and looks up the matching project
 * record. When found, renders the full project content — title, tech chips,
 * links, description, and the Markdown body via `react-markdown`. When not
 * found, renders the project-variant `<NotFound>` component with a link
 * back to `/projects`.
 *
 * Satisfies Requirements 2.3, 3.8, and 3.9.
 *
 * @returns {JSX.Element}
 */
export function ProjectDetail() {
  const { slug } = useParams();
  const project = getProjectBySlug(slug);

  if (!project) {
    return <NotFound variant="project" />;
  }

  const {
    title, tech, links, description, body,
  } = project;

  return (
    <main aria-labelledby="project-title">
      <h1 id="project-title">{title}</h1>

      <ul className="project-detail__tech" aria-label="Technologies used">
        {tech.map((t) => (
          <li key={t} className="project-detail__chip">
            {t}
          </li>
        ))}
      </ul>

      <ul className="project-detail__links" aria-label="Project links">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="project-detail__description">{description}</p>

      <div className="project-detail__body">
        <ReactMarkdown>{body}</ReactMarkdown>
      </div>
    </main>
  );
}

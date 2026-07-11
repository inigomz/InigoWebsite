import { Link } from 'react-router-dom';

/**
 * 404 / not-found fallback component.
 *
 * @param {{ variant?: 'site' | 'project' }} props
 *   - `'project'`: shown when a project slug is not found; links back to `/projects`.
 *   - `'site'` (default): shown for unknown routes; links back to `/`.
 * @returns {JSX.Element}
 */
export function NotFound({ variant = 'site' }) {
  const isProject = variant === 'project';

  return (
    <main aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">
        {isProject ? 'Project not found' : 'Page not found'}
      </h1>
      <p>
        {isProject
          ? "The project you're looking for doesn't exist."
          : "The page you're looking for doesn't exist."}
      </p>
      <Link to={isProject ? '/projects' : '/'}>
        {isProject ? 'Back to projects' : 'Back to home'}
      </Link>
    </main>
  );
}

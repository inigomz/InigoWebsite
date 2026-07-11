import { useEffect, useState } from 'react';

const GITHUB_USER = 'inigomz';
const API_URL = `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100&type=owner`;
const MAX_REPOS = 6;

/**
 * Fetches and displays the user's public GitHub repositories.
 *
 * Repos are fetched from the public GitHub REST API (no auth required for
 * public data, though the anonymous rate limit is 60 requests/hour per IP).
 * Forks are filtered out and the list is sorted by star count, then most
 * recently pushed.
 *
 * States handled: loading, error (with the profile link as a fallback),
 * and the populated grid.
 */
export function GitHubRepos() {
  const [repos, setRepos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(API_URL, {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`GitHub API responded with ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        if (!Array.isArray(data)) {
          throw new Error('GitHub API returned an unexpected response');
        }

        const cleaned = data
          .filter((r) => !r.fork)
          .sort(
            (a, b) =>
              b.stargazers_count - a.stargazers_count ||
              new Date(b.pushed_at) - new Date(a.pushed_at)
          )
          .slice(0, MAX_REPOS);
        setRepos(cleaned);
      } catch (err) {
        if (cancelled || err.name === 'AbortError') return;
        setError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <section className="gh" aria-labelledby="gh-heading">
      <div className="gh__header">
        <h2 id="gh-heading">From GitHub</h2>
        <a
          className="gh__profile-link"
          href={`https://github.com/${GITHUB_USER}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          @{GITHUB_USER} ↗
        </a>
      </div>

      {error && (
        <p className="gh__status gh__status--error">
          Couldn&apos;t load repositories right now. View them directly on{' '}
          <a
            href={`https://github.com/${GITHUB_USER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      )}

      {!error && repos === null && (
        <ul className="gh__grid" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="gh__card gh__card--skeleton" />
          ))}
        </ul>
      )}

      {!error && repos !== null && repos.length === 0 && (
        <p className="gh__status">No public repositories yet.</p>
      )}

      {!error && repos !== null && repos.length > 0 && (
        <ul className="gh__grid">
          {repos.map((repo) => (
            <li key={repo.id}>
              <a
                className="gh__card"
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="gh__card-name">{repo.name}</span>
                {repo.description && (
                  <span className="gh__card-desc">{repo.description}</span>
                )}
                <span className="gh__card-meta">
                  {repo.language && (
                    <span className="gh__card-lang">
                      <span className="gh__lang-dot" aria-hidden="true" />
                      {repo.language}
                    </span>
                  )}
                  <span className="gh__card-stat" title="Stars">
                    ★ {repo.stargazers_count}
                  </span>
                  <span className="gh__card-stat" title="Forks">
                    ⑂ {repo.forks_count}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { projects } from '../content/loader';
import { ProjectCard } from '../components/ProjectCard';
import { Reveal } from '../components/Reveal';
import { GitHubRepos } from '../components/GitHubRepos';

/**
 * Projects listing page.
 *
 * Renders one `<Reveal>`-wrapped `<ProjectCard>` per project record from
 * the content loader, sorted alphabetically by title (the loader handles
 * sorting). Satisfies Requirements 2.2, 3.6, 3.7, and 4.3.
 *
 * @returns {JSX.Element}
 */
export function Projects() {
  return (
    <main aria-labelledby="projects-heading">
      <h1 id="projects-heading">Projects</h1>
      <ul className="projects-list">
        {projects.map((project) => (
          <Reveal key={project.slug} as="li">
            <ProjectCard
              slug={project.slug}
              title={project.title}
              tech={project.tech}
              description={project.description}
            />
          </Reveal>
        ))}
      </ul>
      <GitHubRepos />
    </main>
  );
}

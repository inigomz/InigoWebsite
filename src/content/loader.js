/**
 * @file Loads Markdown project files, validates frontmatter, and exposes query helpers.
 */
import matter from 'gray-matter';
import { REQUIRED_FIELDS } from './schema.js';

// Eager glob: { './projects/foo.md': '---\n...---\n...' }
const modules = import.meta.glob('./projects/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export function slugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '');
}

function isMissing(value) {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

function findMissingFields(data) {
  const missing = [];
  for (const field of REQUIRED_FIELDS) {
    if (isMissing(data[field])) missing.push(field);
  }
  return missing;
}

export function parseProject(filePath, raw) {
  const { data, content } = matter(raw);
  const missing = findMissingFields(data);
  if (missing.length > 0) {
    const fieldList = missing.map((f) => `"${f}"`).join(', ');
    throw new Error(
      `[portfolio-website] ${filePath}: missing required frontmatter field(s) ${fieldList}`,
    );
  }
  return {
    slug: slugFromPath(filePath),
    // Explicit order keeps curated projects stable; unranked additions fall back below them.
    order: data.order ?? Number.MAX_SAFE_INTEGER,
    title: data.title,
    tech: data.tech,
    links: data.links,
    description: data.description,
    body: content,
  };
}

export const projects = Object.entries(modules)
  .map(([path, raw]) => parseProject(path, raw))
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}

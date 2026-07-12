/**
 * @file Checks that arbitrary valid Markdown inputs become stable project records.
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseProject } from './loader.js';

/**
 * Property 2: Loader produces one well-formed record per valid file
 *
 * For arbitrary non-empty maps of valid Markdown sources, the loader returns
 * exactly one record per entry with populated, well-typed `slug`, `title`,
 * `tech` (non-empty string array), `links` (array of `{label, url}`),
 * `description`, and `body`.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

// Arbitraries for valid frontmatter fields
// Use only printable ASCII excluding YAML-special chars so generated strings
// are safe to embed in both quoted scalars and flow sequences.
const safeString = fc
  .stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '),
    { minLength: 1 },
  )
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const techArray = fc.array(safeString, { minLength: 1 });

const linkObject = fc.record({
  label: safeString,
  url: safeString,
});

const linksArray = fc.array(linkObject, { minLength: 1 });

const safeName = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'),
  { minLength: 1 },
);

/**
 * Build a raw markdown string using JSON flow style for sequences so arbitrary
 * string values never break YAML indentation rules.
 */
function buildRawMarkdown({
  title, tech, links, description, body,
}) {
  // Use JSON.stringify for safe quoting of every value
  const techFlow = `[${tech.map((t) => JSON.stringify(t)).join(', ')}]`;
  const linksFlow = `[${links
    .map((l) => `{label: ${JSON.stringify(l.label)}, url: ${JSON.stringify(l.url)}}`)
    .join(', ')}]`;
  return [
    '---',
    `title: ${JSON.stringify(title)}`,
    `tech: ${techFlow}`,
    `links: ${linksFlow}`,
    `description: ${JSON.stringify(description)}`,
    '---',
    body,
  ].join('\n');
}

describe('parseProject record shape property tests', () => {
  it('returns a well-formed record for every valid markdown source', () => {
    fc.assert(
      fc.property(
        safeName,
        safeString,
        techArray,
        linksArray,
        safeString,
        fc.string(),
        (name, title, tech, links, description, body) => {
          const filePath = `./projects/${name}.md`;
          const raw = buildRawMarkdown({
            title, tech, links, description, body,
          });
          const record = parseProject(filePath, raw);

          // slug is derived from filename stem
          expect(record.slug).toBe(name);

          // title is a non-empty string
          expect(typeof record.title).toBe('string');
          expect(record.title.length).toBeGreaterThan(0);

          // tech is a non-empty array of strings
          expect(Array.isArray(record.tech)).toBe(true);
          expect(record.tech.length).toBeGreaterThan(0);
          record.tech.forEach((t) => expect(typeof t).toBe('string'));

          // links is an array of objects with label and url
          expect(Array.isArray(record.links)).toBe(true);
          record.links.forEach((l) => {
            expect(typeof l.label).toBe('string');
            expect(typeof l.url).toBe('string');
          });

          // description is a non-empty string
          expect(typeof record.description).toBe('string');
          expect(record.description.length).toBeGreaterThan(0);

          // body is a string (may be empty)
          expect(typeof record.body).toBe('string');
        },
      ),
      { numRuns: 200 },
    );
  });
});

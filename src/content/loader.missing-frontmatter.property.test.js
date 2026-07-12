import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseProject } from './loader.js';
import { REQUIRED_FIELDS } from './schema.js';

/**
 * Property 3: Missing required frontmatter fails the build with a precise error
 *
 * For arbitrary valid Markdown sources with an arbitrary non-empty subset of
 * required fields removed, the loader throws an error whose message contains
 * the file path and every removed field's name.
 *
 * **Validates: Requirements 3.5**
 */

const nonEmptyString = fc
  .string({ minLength: 1 })
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const safeName = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'),
  { minLength: 1 },
);

/**
 * Build frontmatter YAML omitting the fields listed in `omit`.
 */
function buildRawWithOmissions(omit) {
  const lines = ['---'];
  if (!omit.includes('title')) lines.push('title: "My Project"');
  if (!omit.includes('tech')) lines.push('tech:\n  - "TypeScript"');
  if (!omit.includes('links')) lines.push('links:\n  - label: "Repo"\n    url: "https://example.com"');
  if (!omit.includes('description')) lines.push('description: "A project description."');
  lines.push('---');
  lines.push('Some body content.');
  return lines.join('\n');
}

describe('parseProject missing-frontmatter property tests', () => {
  it('throws an error naming the file path and every missing field', () => {
    // Arbitrary non-empty subset of REQUIRED_FIELDS to omit
    const subsetArb = fc
      .subarray(REQUIRED_FIELDS, { minLength: 1 })
      .filter((s) => s.length > 0);

    fc.assert(
      fc.property(safeName, subsetArb, (name, omittedFields) => {
        const filePath = `./projects/${name}.md`;
        const raw = buildRawWithOmissions(omittedFields);

        expect(() => parseProject(filePath, raw)).toThrow();

        try {
          parseProject(filePath, raw);
        } catch (err) {
          // Error message must contain the file path
          expect(err.message).toContain(filePath);

          // Error message must name every omitted field
          for (const field of omittedFields) {
            expect(err.message).toContain(field);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});

/**
 * @file Checks that project filenames consistently produce the expected URL slug.
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { slugFromPath } from './loader.js';

/**
 * Property 1: Slug derivation
 *
 * For arbitrary filenames `<name>.md` where `<name>` is a non-empty string of
 * safe filename characters (alphanumeric, hyphens, underscores), `slugFromPath`
 * returns exactly `<name>` when given a path of the form `./projects/<name>.md`.
 *
 * **Validates: Requirements 3.4**
 */
describe('slugFromPath property tests', () => {
  it('derives slug equal to the stem of the filename for any safe name', () => {
    // Generator: non-empty strings consisting only of alphanumerics, hyphens,
    // and underscores — the safe characters allowed in project filenames.
    const safeName = fc
      .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'), {
        minLength: 1,
      });

    fc.assert(
      fc.property(safeName, (name) => {
        const path = `./projects/${name}.md`;
        expect(slugFromPath(path)).toBe(name);
      }),
      { numRuns: 200 },
    );
  });
});

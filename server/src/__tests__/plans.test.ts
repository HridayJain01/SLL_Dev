import { describe, it, expect } from 'vitest';
import {
  normalizePlanCode,
  normalizePlanAccess,
  isPlanAllowedForBook,
  getPlanAllowance,
  PLAN_DEFINITIONS,
} from '../config/constants.js';

/**
 * These pure functions encode what each plan is actually sold as. A silent change
 * here mis-sells memberships or hands members books they did not pay for, and
 * nothing else in the system would notice.
 */
describe('normalizePlanCode', () => {
  it('maps the legacy codes onto their replacements', () => {
    expect(normalizePlanCode('NORMAL')).toBe('LITTLE_READER');
    expect(normalizePlanCode('PREMIUM')).toBe('STAR_READER');
  });

  it('passes current codes through and rejects anything else', () => {
    expect(normalizePlanCode('WONDER_BUNDLE')).toBe('WONDER_BUNDLE');
    expect(normalizePlanCode('NOT_A_PLAN')).toBeNull();
    expect(normalizePlanCode(null)).toBeNull();
    expect(normalizePlanCode(undefined)).toBeNull();
  });
});

describe('normalizePlanAccess', () => {
  it('treats access as a ladder — a lower tier implies the ones above it', () => {
    expect(normalizePlanAccess(['LITTLE_READER'])).toEqual([
      'LITTLE_READER',
      'STAR_READER',
      'WONDER_BUNDLE',
    ]);
    expect(normalizePlanAccess(['STAR_READER'])).toEqual(['STAR_READER', 'WONDER_BUNDLE']);
    expect(normalizePlanAccess(['WONDER_BUNDLE'])).toEqual(['WONDER_BUNDLE']);
  });

  it('expands the legacy codes the same way as their replacements', () => {
    expect(normalizePlanAccess(['NORMAL'])).toEqual(normalizePlanAccess(['LITTLE_READER']));
    expect(normalizePlanAccess(['PREMIUM'])).toEqual(normalizePlanAccess(['STAR_READER']));
  });

  it('falls back by kind when a book declares no access at all', () => {
    // An unmarked book is readable by everyone; an unmarked puzzle is not, because
    // Little Reader does not include puzzles.
    expect(normalizePlanAccess([], 'book')).toEqual([
      'LITTLE_READER',
      'STAR_READER',
      'WONDER_BUNDLE',
    ]);
    expect(normalizePlanAccess([], 'puzzle')).toEqual(['STAR_READER', 'WONDER_BUNDLE']);
    expect(normalizePlanAccess(null, 'puzzle')).toEqual(['STAR_READER', 'WONDER_BUNDLE']);
  });
});

describe('isPlanAllowedForBook', () => {
  it('lets a higher tier reach a lower tier book, but not the reverse', () => {
    expect(isPlanAllowedForBook('WONDER_BUNDLE', ['LITTLE_READER'])).toBe(true);
    expect(isPlanAllowedForBook('LITTLE_READER', ['WONDER_BUNDLE'])).toBe(false);
  });

  it('keeps Little Reader out of puzzles', () => {
    expect(isPlanAllowedForBook('LITTLE_READER', [], 'puzzle')).toBe(false);
    expect(isPlanAllowedForBook('STAR_READER', [], 'puzzle')).toBe(true);
  });

  it('refuses an unknown or missing plan outright', () => {
    expect(isPlanAllowedForBook(null, ['LITTLE_READER'])).toBe(false);
    expect(isPlanAllowedForBook('NOT_A_PLAN', ['LITTLE_READER'])).toBe(false);
  });
});

describe('getPlanAllowance', () => {
  it('reports the allowance each plan is sold with', () => {
    // Little Reader: books only. Star Reader: a combined cap. Wonder Bundle: both,
    // capped separately. The shapes differ, which is what the quota code branches on.
    expect(getPlanAllowance('LITTLE_READER')).toMatchObject({
      monthlyBookLimit: 5,
      monthlyPuzzleLimit: 0,
      monthlyTotalLimit: null,
    });
    expect(getPlanAllowance('STAR_READER')).toMatchObject({
      monthlyBookLimit: null,
      monthlyPuzzleLimit: null,
      monthlyTotalLimit: 8,
    });
    expect(getPlanAllowance('WONDER_BUNDLE')).toMatchObject({
      monthlyBookLimit: 6,
      monthlyPuzzleLimit: 4,
      monthlyTotalLimit: null,
    });
  });

  it('defaults an unrecognised plan to the least generous one', () => {
    expect(getPlanAllowance('NOT_A_PLAN')).toEqual(PLAN_DEFINITIONS.LITTLE_READER.allowance);
  });
});

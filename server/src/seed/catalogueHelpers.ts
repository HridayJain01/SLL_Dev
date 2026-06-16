/**
 * Shared helpers for turning the "Library stock" workbook into Star Learners
 * catalogue data, and for matching cover-image files back to their book.
 */

/**
 * Canonical shelf code, e.g. "b1-16", "B1/16", "B1_1" all collapse to "B1/01".
 * Box prefix uppercased, item number zero-padded to 2 digits. Used as the
 * stable join key between the spreadsheet, the DB, and image filenames.
 */
export function normalizeShelfCode(raw: string): string | null {
  if (!raw) return null;
  const match = String(raw)
    .trim()
    .match(/^(B)\s*(\d+)\s*[\/_\-\s]\s*(\d+)/i);
  if (!match) return null;
  const box = Number(match[2]);
  const item = Number(match[3]);
  if (!Number.isFinite(box) || !Number.isFinite(item)) return null;
  return `B${box}/${String(item).padStart(2, '0')}`;
}

/** Strip the extension and derive a shelf code from an image file name. */
export function shelfCodeFromFileName(fileName: string): string | null {
  const base = fileName.replace(/\.[^.]+$/, '');
  return normalizeShelfCode(base);
}

/**
 * Turn an "ageGroup" string into a numeric [min, max] band.
 * Handles "0-2yrs", "2-4yrs", "4-6yrs", "2-4yrs and 4-6yrs".
 */
export function parseAgeBand(ageGroup: string | null): { min: number; max: number } {
  const nums = (ageGroup || '').match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return { min: 0, max: 12 };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

/** Explicit names for known messy/duplicate type values; everything else is title-cased. */
const TYPE_NAME_OVERRIDES: Record<string, string> = {
  '': 'Uncategorised',
  story: 'Stories',
  stories: 'Stories',
  'story books': 'Stories',
  'board book': 'Board Books',
  'board books': 'Board Books',
  vehicles: 'Vehicles',
  'read along books': 'Read Along Books',
  'read on your own': 'Read on Your Own',
  'flap book': 'Flap Books',
  'flap books': 'Flap Books',
  'community helpers': 'Community Helpers',
  'touch and feel': 'Touch and Feel',
};

const TYPE_EMOJI: Record<string, string> = {
  Stories: '📖',
  'Board Books': '📚',
  'Values and Emotions': '❤️',
  'Community Helpers': '🚒',
  Vehicles: '🚗',
  'Touch and Feel': '✋',
  'Flap Books': '📔',
  'Peppa Pig': '🐷',
  Educational: '🔢',
  'Read Along Books': '🔊',
  'Read on Your Own': '🧒',
  Series: '📗',
  Grammar: '✏️',
  Mythology: '🛕',
  Puzzles: '🧩',
  Uncategorised: '🏷️',
};

const SMALL_WORDS = new Set(['and', 'or', 'of', 'the', 'a', 'an', 'to', 'for', '&']);

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) =>
      !w ? w : i > 0 && SMALL_WORDS.has(w) ? w : w[0].toUpperCase() + w.slice(1)
    )
    .join(' ');
}

/** Normalize a raw `type` value into a clean category name. */
export function normalizeCategoryName(rawType: string | null): string {
  const key = (rawType || '').trim().toLowerCase();
  if (key in TYPE_NAME_OVERRIDES) return TYPE_NAME_OVERRIDES[key];
  return titleCase((rawType || '').trim());
}

export function emojiForCategory(name: string): string {
  return TYPE_EMOJI[name] || '📘';
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const READING_LEVELS = new Set(['Easy', 'Medium', 'Hard']);

/** Handles "Soft", "Softcover", "Hard", "Hard cover", "hardcover", etc. */
export function normalizeCoverType(raw: string | null): 'Hardcover' | 'Softcover' | undefined {
  const v = (raw || '').trim().toLowerCase();
  if (!v) return undefined;
  if (v.startsWith('hard')) return 'Hardcover';
  if (v.startsWith('soft')) return 'Softcover';
  return undefined;
}

export function normalizeReadingLevel(raw: string | null): 'Easy' | 'Medium' | 'Hard' | undefined {
  const v = titleCase((raw || '').trim());
  return READING_LEVELS.has(v) ? (v as 'Easy' | 'Medium' | 'Hard') : undefined;
}

/** Split a comma-separated keyword cell into a clean, de-duplicated list. */
export function parseKeywords(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of String(raw).split(/[,;]/)) {
    const k = part.trim().replace(/\s+/g, ' ');
    if (k && !seen.has(k.toLowerCase())) {
      seen.add(k.toLowerCase());
      out.push(k);
    }
  }
  return out;
}

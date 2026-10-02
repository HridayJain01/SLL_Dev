import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Book from '../models/Book.js';
import Borrow from '../models/Borrow.js';
import { PLAN_CODES } from '../config/constants.js';
import { parseWorkbook, ParsedItem } from './parseWorkbook.js';
import {
  parseAgeBand,
  normalizeCategoryName,
  emojiForCategory,
  slugify,
  normalizeCoverType,
  normalizeReadingLevel,
  parseKeywords,
} from './catalogueHelpers.js';

// Run via `npm run import:library` (cwd = server/). Pass an .xlsx path to override.
// Add `--dry-run` to print what would change (field by field) without writing.
// Add `--fresh` to wipe the Books and Categories collections first (a clean rebuild).
const args = process.argv.slice(2);
const fresh = args.includes('--fresh');
const dryRun = args.includes('--dry-run');
const WORKBOOK =
  args.find((a) => !a.startsWith('--')) ||
  path.resolve(process.cwd(), 'src/seed/data/library-stock.xlsx');

/** Non-empty description is required by the schema; build a sensible fallback. */
function descriptionFor(item: ParsedItem, categoryName: string): string {
  if (item.description && item.description.trim()) return item.description.trim();
  const age = item.ageRaw ? ` for ages ${item.ageRaw}` : '';
  const seriesBit = item.series ? ` Part of the “${item.series.name}” series.` : '';
  return `${item.title} — a ${categoryName.toLowerCase()}${age}.${seriesBit}`.trim();
}

async function importLibrary() {
  if (!fs.existsSync(WORKBOOK)) {
    throw new Error(`Workbook not found: ${WORKBOOK}`);
  }
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(`Connected to MongoDB. Parsing ${WORKBOOK}`);

  if (fresh && dryRun) throw new Error('--fresh and --dry-run cannot be combined.');
  if (fresh && (await Borrow.countDocuments())) {
    throw new Error('--fresh would orphan existing borrows. Drop it: the import already upserts by shelf code.');
  }
  if (fresh) {
    await Book.deleteMany({});
    await Category.deleteMany({});
    console.log('--fresh: cleared Books and Categories.');
  }

  if (!dryRun) {
    // Legacy plan names fail the Book schema enum, so any save() on those books throws.
    await Book.updateMany({ planAccess: 'NORMAL' }, { $set: { planAccess: [...PLAN_CODES] } });
    await Book.updateMany({ planAccess: 'PREMIUM' }, { $set: { planAccess: ['STAR_READER', 'WONDER_BUNDLE'] } });
  }

  const items = parseWorkbook(WORKBOOK);
  console.log(`Parsed ${items.length} catalogue items.`);

  const categoryNames = new Map(
    (await Category.find({}, 'name')).map((c) => [String(c._id), c.name])
  );
  const newCategories = new Set<string>();

  // Resolve / create categories, cached by name so we hit the DB once each.
  const categoryCache = new Map<string, mongoose.Types.ObjectId>();
  async function resolveCategory(name: string): Promise<mongoose.Types.ObjectId> {
    if (categoryCache.has(name)) return categoryCache.get(name)!;
    const slug = slugify(name);
    if (dryRun) {
      const found = await Category.findOne({ slug });
      const id = (found?._id as mongoose.Types.ObjectId) ?? new mongoose.Types.ObjectId();
      if (!found) newCategories.add(name);
      categoryNames.set(String(id), name);
      categoryCache.set(name, id);
      return id;
    }
    const category = await Category.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug, iconEmoji: emojiForCategory(name) } },
      { new: true, upsert: true }
    );
    categoryCache.set(name, category._id as mongoose.Types.ObjectId);
    return category._id as mongoose.Types.ObjectId;
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const skipped: string[] = [];
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  const changes = new Map<string, string[]>(); // field -> examples
  const fmt = (v: unknown) => {
    const s = JSON.stringify(v ?? null);
    return s.length > 70 ? s.slice(0, 67) + '...' : s;
  };

  for (const item of items) {
    if (!item.shelfCode) {
      skipped.push(`${item.title} — no shelf code`);
      continue;
    }
    if (seen.has(item.shelfCode)) {
      duplicates.push(`${item.shelfCode}: ${seen.get(item.shelfCode)}  vs  "${item.title}" (${item.box})`);
    }
    seen.set(item.shelfCode, `"${item.title}" (${item.box})`);

    const categoryName = normalizeCategoryName(item.categoryName);
    const categoryId = await resolveCategory(categoryName);
    const { min, max } = parseAgeBand(item.ageRaw);

    // Fields we always (re)sync from the spreadsheet. coverImage / images /
    // cloudinaryPublicId are omitted so a re-import never wipes uploaded covers.
    const update = {
      title: item.title,
      description: descriptionFor(item, categoryName),
      ageGroupMin: min,
      ageGroupMax: max,
      categoryId,
      totalCopies: item.totalCopies,
      kind: item.kind,
      box: item.box,
      type: item.categoryName.trim() || categoryName,
      series: item.series,
      author: item.author,
      numPages: item.numPages ?? undefined,
      coverType: normalizeCoverType(item.coverTypeRaw),
      readingAge: item.ageRaw || undefined,
      readingLevel: normalizeReadingLevel(item.readingLevelRaw),
      keywords: parseKeywords(item.keywordsRaw),
      material: item.material ?? undefined,
      pieceCount: item.pieceCount ?? undefined,
      coverImageFile: item.coverImageFile ?? undefined,
      imageFiles: item.imageFiles,
    };

    const existing = await Book.findOne({ shelfCode: item.shelfCode });
    if (!existing) {
      if (!dryRun) await Book.create({ ...update, shelfCode: item.shelfCode });
      created++;
      continue;
    }

    const changed = Object.entries(update).filter(
      ([k, v]) => JSON.stringify(existing.get(k) ?? null) !== JSON.stringify(v ?? null)
    );
    if (changed.length === 0) {
      unchanged++;
      continue;
    }
    for (const [k, v] of changed) {
      const show = (x: unknown) => (k === 'categoryId' ? categoryNames.get(String(x)) : x);
      const list = changes.get(k) ?? [];
      list.push(`${item.shelfCode}: ${fmt(show(existing.get(k)))} -> ${fmt(show(v))}`);
      changes.set(k, list);
    }
    if (!dryRun) {
      Object.assign(existing, update);
      await existing.save();
    }
    updated++;
  }

  // Never deleted automatically: borrows may still point at these.
  const notInSheet = await Book.find({ shelfCode: { $nin: [...seen.keys()] } }, 'shelfCode title box').lean();

  const categories = await Category.countDocuments();
  console.log(dryRun ? '\nDRY RUN — nothing was written.' : '\nImport complete.');
  console.log(`  Categories in DB: ${categories}`);
  if (newCategories.size) console.log(`  New categories: ${[...newCategories].join(', ')}`);
  console.log(`  Items ${dryRun ? 'to create' : 'created'}: ${created}`);
  console.log(`  Items ${dryRun ? 'to update' : 'updated'}: ${updated}`);
  console.log(`  Items unchanged: ${unchanged}`);
  for (const [field, list] of changes) {
    console.log(`\n  ${field} changed on ${list.length}:`);
    list.slice(0, 5).forEach((l) => console.log(`    ${l}`));
    if (list.length > 5) console.log(`    ...and ${list.length - 5} more`);
  }
  if (duplicates.length) {
    console.log(`\n  Duplicate shelf codes (${duplicates.length}) — the later row wins, fix the sheet:`);
    duplicates.forEach((d) => console.log(`    - ${d}`));
  }
  if (notInSheet.length) {
    console.log(`\n  In DB but not in sheet (${notInSheet.length}) — left untouched:`);
    notInSheet.forEach((b) => console.log(`    - ${b.shelfCode} "${b.title}" (${b.box})`));
  }
  if (skipped.length) {
    console.log(`\n  Skipped (${skipped.length}):`);
    skipped.forEach((s) => console.log(`    - ${s}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

importLibrary().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});

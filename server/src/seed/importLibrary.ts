import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Book from '../models/Book.js';
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
// Add `--fresh` to wipe the Books and Categories collections first (a clean rebuild).
const args = process.argv.slice(2);
const fresh = args.includes('--fresh');
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

  if (fresh) {
    await Book.deleteMany({});
    await Category.deleteMany({});
    console.log('--fresh: cleared Books and Categories.');
  }

  const items = parseWorkbook(WORKBOOK);
  console.log(`Parsed ${items.length} catalogue items.`);

  // Resolve / create categories, cached by name so we hit the DB once each.
  const categoryCache = new Map<string, mongoose.Types.ObjectId>();
  async function resolveCategory(name: string): Promise<mongoose.Types.ObjectId> {
    if (categoryCache.has(name)) return categoryCache.get(name)!;
    const slug = slugify(name);
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
  const skipped: string[] = [];

  for (const item of items) {
    if (!item.shelfCode) {
      skipped.push(`${item.title} — no shelf code`);
      continue;
    }

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
      planAccess: ['NORMAL', 'PREMIUM'],
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
    if (existing) {
      Object.assign(existing, update);
      await existing.save();
      updated++;
    } else {
      await Book.create({ ...update, shelfCode: item.shelfCode });
      created++;
    }
  }

  const categories = await Category.countDocuments();
  console.log('\nImport complete.');
  console.log(`  Categories in DB: ${categories}`);
  console.log(`  Items created: ${created}`);
  console.log(`  Items updated: ${updated}`);
  if (skipped.length) {
    console.log(`  Skipped (${skipped.length}):`);
    skipped.forEach((s) => console.log(`    - ${s}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

importLibrary().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});

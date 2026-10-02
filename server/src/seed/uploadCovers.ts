import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import Book from '../models/Book.js';
import { shelfCodeFromFileName } from './catalogueHelpers.js';

/**
 * Usage:
 *   npm run import:covers -- /path/to/Images              (subfolders B1/, B2/... are scanned too)
 *   npm run import:covers -- /path/to/Images --dry-run    (show matches, upload nothing)
 *   npm run import:covers -- /path/to/Images --force      (re-upload even if linked)
 *
 * Primary match: the image file names recorded in the spreadsheet
 * (book.imageFiles / book.coverImageFile), e.g. "B1_01-COVERPAGE.jpg",
 * compared case-insensitively and ignoring the extension.
 * Fallback match: a shelf code derived from the file name (e.g. "B7_01.jpg").
 *
 * Each uploaded file is added to the book's `images` gallery; a cover file
 * (named in the sheet as the cover, or with "cover" in its name) sets `coverImage`.
 * Re-runs skip files already linked, so just re-run after adding new photos.
 */

const CLOUDINARY_FOLDER = 'star-learners-library/books';
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const args = process.argv.slice(2);
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');
const folder = args.find((a) => !a.startsWith('--'));

async function uploadCovers() {
  if (!folder) {
    console.error('Provide the image folder path:\n  npm run import:covers -- /path/to/folder');
    process.exit(1);
  }
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    console.error(`Not a folder: ${folder}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(`Connected to MongoDB. Scanning ${folder}`);

  const books = await Book.find({});

  // The sheet sometimes drops the extension ("B4_04") or changes case, so match on
  // the lowercased base name.
  const baseKey = (name: string) => path.basename(name.trim(), path.extname(name.trim())).toLowerCase();

  // Index: base name -> books that reference it (+ whether it's the cover).
  const byFileName = new Map<string, { book: typeof books[number]; isCover: boolean }[]>();
  // Index: shelf code -> book (for the fallback match).
  const byShelfCode = new Map<string, typeof books[number]>();

  for (const book of books) {
    if (book.shelfCode) byShelfCode.set(book.shelfCode, book);
    // coverImageFile can be a shared series cover that isn't in imageFiles.
    const names = new Set([...(book.imageFiles || []), book.coverImageFile].filter(Boolean) as string[]);
    for (const fileName of names) {
      const key = baseKey(fileName);
      const entry = byFileName.get(key) || [];
      entry.push({ book, isCover: fileName === book.coverImageFile });
      byFileName.set(key, entry);
    }
  }

  // Cover files first, so a cover always wins over an inside page.
  const files = (fs.readdirSync(folder, { recursive: true }) as string[])
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()) && !path.basename(f).startsWith('.'))
    .sort((a, b) => Number(/cover/i.test(b)) - Number(/cover/i.test(a)));

  const publicIdFor = (file: string) =>
    `${CLOUDINARY_FOLDER}/${path.basename(file, path.extname(file)).replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  // Upload each unique file once, then attach its URL to every matching book.
  const uploadCache = new Map<string, { url: string; publicId: string }>();
  async function upload(file: string) {
    if (uploadCache.has(file)) return uploadCache.get(file)!;
    const res = await cloudinary.uploader.upload(path.join(folder!, file), {
      public_id: publicIdFor(file),
      overwrite: true,
      resource_type: 'image',
    });
    const out = { url: res.secure_url, publicId: res.public_id };
    uploadCache.set(file, out);
    return out;
  }

  const touched = new Set<string>();
  let linked = 0;
  const unmatched: string[] = [];

  let alreadyLinked = 0;

  for (const file of files) {
    let matches = byFileName.get(baseKey(file));

    // Fallback: match by shelf code derived from the file name.
    if (!matches) {
      const shelfCode = shelfCodeFromFileName(path.basename(file));
      const book = shelfCode ? byShelfCode.get(shelfCode) : undefined;
      if (book) matches = [{ book, isCover: /cover/i.test(file) }];
    }

    if (!matches || matches.length === 0) {
      unmatched.push(file);
      continue;
    }

    const pending = matches.filter(({ book }) => force || !book.images.some((i) => i.publicId === publicIdFor(file)));
    if (pending.length === 0) {
      alreadyLinked++;
      continue;
    }
    if (dryRun) {
      linked++;
      console.log(`  would link ${file} -> ${pending.map((m) => m.book.shelfCode).join(', ')}`);
      continue;
    }

    const { url, publicId } = await upload(file);
    for (const { book, isCover } of pending) {
      book.images = book.images.filter((image) => image.publicId !== publicId) as typeof book.images;
      book.images.push({ url, publicId });
      if (isCover && (!book.coverImage || force)) {
        book.coverImage = url;
        book.cloudinaryPublicId = publicId;
      }
      // If nothing is flagged as the cover yet, use the first image we find.
      if (!book.coverImage) {
        book.coverImage = url;
        book.cloudinaryPublicId = publicId;
      }
      // Saved per file so a failure halfway keeps everything linked so far.
      // Only validate what we touched: legacy fields elsewhere on the doc shouldn't block a cover.
      await book.save({ validateModifiedOnly: true });
      touched.add(book.id);
    }
    linked++;
    console.log(`  ✓ ${file} -> ${pending.map((m) => m.book.shelfCode).join(', ')}`);
  }

  console.log(dryRun ? '\nDRY RUN — nothing was uploaded.' : '\nCover upload complete.');
  console.log(`  Image files found:     ${files.length}`);
  console.log(`  Already linked:        ${alreadyLinked}`);
  console.log(`  ${(dryRun ? 'Files to link:' : 'Files linked:').padEnd(23)}${linked}`);
  console.log(`  Books updated:         ${touched.size}`);
  if (unmatched.length) {
    console.log(`  No matching book (${unmatched.length}):`);
    unmatched.forEach((u) => console.log(`    - ${u}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

uploadCovers().catch((err) => {
  console.error('Cover upload failed:', err);
  process.exit(1);
});

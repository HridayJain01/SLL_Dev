import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import Book from '../models/Book.js';
import { shelfCodeFromFileName } from './catalogueHelpers.js';

/**
 * Usage:
 *   npm run import:covers -- /path/to/folder-of-pictures
 *   npm run import:covers -- /path/to/folder --force   (re-upload even if linked)
 *
 * Primary match: the exact image file names recorded in the spreadsheet
 * (book.imageFiles / book.coverImageFile), e.g. "B1_01-COVERPAGE.jpg".
 * Fallback match: a shelf code derived from the file name (e.g. "B1-01.jpg").
 *
 * Each uploaded file's URL is added to the book's `images` gallery; the file
 * named as the book's cover also sets `coverImage`.
 */

const CLOUDINARY_FOLDER = 'star-learners-library/books';
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const args = process.argv.slice(2);
const force = args.includes('--force');
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

  // Index: lowercased file name -> books that reference it (+ whether it's the cover).
  const byFileName = new Map<string, { book: typeof books[number]; isCover: boolean }[]>();
  // Index: shelf code -> book (for the fallback match).
  const byShelfCode = new Map<string, typeof books[number]>();

  for (const book of books) {
    if (book.shelfCode) byShelfCode.set(book.shelfCode, book);
    for (const fileName of book.imageFiles || []) {
      const key = fileName.trim().toLowerCase();
      const entry = byFileName.get(key) || [];
      entry.push({ book, isCover: fileName === book.coverImageFile });
      byFileName.set(key, entry);
    }
  }

  const files = fs
    .readdirSync(folder)
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));

  // Upload each unique file once, then attach its URL to every matching book.
  const uploadCache = new Map<string, { url: string; publicId: string }>();
  async function upload(file: string) {
    if (uploadCache.has(file)) return uploadCache.get(file)!;
    const publicId = path.basename(file, path.extname(file)).replace(/[^a-zA-Z0-9_-]/g, '_');
    const res = await cloudinary.uploader.upload(path.join(folder!, file), {
      folder: CLOUDINARY_FOLDER,
      public_id: publicId,
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

  for (const file of files) {
    const key = file.trim().toLowerCase();
    let matches = byFileName.get(key);

    // Fallback: match by shelf code derived from the file name.
    if (!matches) {
      const shelfCode = shelfCodeFromFileName(file);
      const book = shelfCode ? byShelfCode.get(shelfCode) : undefined;
      if (book) matches = [{ book, isCover: true }];
    }

    if (!matches || matches.length === 0) {
      unmatched.push(file);
      continue;
    }

    const { url, publicId } = await upload(file);
    for (const { book, isCover } of matches) {
      if (!book.images.includes(url)) book.images.push(url);
      if (isCover && (!book.coverImage || force)) {
        book.coverImage = url;
        book.cloudinaryPublicId = publicId;
      }
      // If nothing is flagged as the cover yet, use the first image we find.
      if (!book.coverImage) {
        book.coverImage = url;
        book.cloudinaryPublicId = publicId;
      }
      touched.add(book.id);
    }
    linked++;
    console.log(`  ✓ ${file} -> ${matches.map((m) => m.book.shelfCode).join(', ')}`);
  }

  for (const id of touched) {
    const book = books.find((b) => b.id === id);
    if (book) await book.save();
  }

  console.log('\nCover upload complete.');
  console.log(`  Image files found:     ${files.length}`);
  console.log(`  Files linked to books: ${linked}`);
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

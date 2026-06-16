import * as XLSX from 'xlsx';
import { normalizeShelfCode } from './catalogueHelpers.js';

/**
 * Parses the "Library stock" workbook into a flat list of catalogue items.
 *
 * The workbook has one sheet per physical box. Book sheets and puzzle sheets
 * use different columns. Within a book sheet, Category / Sub-category cells are
 * only filled on the first row of a group (merged-cell style) and a "series"
 * is introduced by a header row that has a name but no book code; the rows that
 * follow carry a numeric index in the Book-name column and the real title in
 * the Book-sub-category column. We reproduce all of that here.
 */

export interface ParsedItem {
  shelfCode: string;
  kind: 'book' | 'puzzle';
  box: string;
  title: string;
  description: string;
  categoryName: string;
  ageRaw: string;
  author: string | null;
  numPages: number | null;
  coverTypeRaw: string | null;
  readingLevelRaw: string | null;
  keywordsRaw: string;
  series: { name: string; index: number } | null;
  coverImageFile: string | null;
  imageFiles: string[];
  material: string | null;
  pieceCount: number | null;
  totalCopies: number;
}

const SKIP_SHEETS = new Set(['Categories and sub categories', 'Master Sheet']);

const norm = (s: unknown) =>
  String(s ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const cellStr = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());

const isNumeric = (v: unknown) => cellStr(v) !== '' && !Number.isNaN(Number(v));

function buildHeaderMap(headerRow: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.forEach((cell, i) => {
    const key = norm(cell);
    if (key && !(key in map)) map[key] = i;
  });
  return map;
}

function pick(map: Record<string, number>, row: unknown[], keys: string[]): string {
  for (const key of keys) {
    if (key in map) {
      const v = cellStr(row[map[key]]);
      if (v !== '') return v;
    }
  }
  return '';
}

/** Look for "2 copies" style notes anywhere in the row. */
function detectCopies(row: unknown[]): number {
  for (const cell of row) {
    const m = cellStr(cell).match(/(\d+)\s*cop/i);
    if (m) return Math.max(1, Number(m[1]));
  }
  return 1;
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const keys = rows[i].map(norm);
    if (keys.includes('bookcodenumber')) return i;
  }
  return -1;
}

// NOTE: the "Cover Page" column holds the cover *type* (Soft/Hard), not an
// image — image filenames only live in the Photo/Image columns.
const PHOTO1_KEYS = ['photo1', 'image1'];
const PHOTO2_KEYS = ['photo2', 'image2'];

function parseBookSheet(sheetName: string, rows: unknown[][], headerRow: number): ParsedItem[] {
  const map = buildHeaderMap(rows[headerRow]);
  const items: ParsedItem[] = [];

  let lastCategory = '';
  let lastSubCategory = '';
  let series: { name: string; description: string; cover: string } | null = null;

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((c) => cellStr(c) === '')) continue;

    const catCell = pick(map, row, ['category']);
    const subCell = pick(map, row, ['subcategory', 'subategory']);
    if (catCell) lastCategory = catCell;
    if (subCell) lastSubCategory = subCell;

    const code = pick(map, row, ['bookcodenumber']);
    const bookNameCell = row[map['bookname']];
    const photo1 = pick(map, row, PHOTO1_KEYS);
    const photo2 = pick(map, row, PHOTO2_KEYS);
    const description = pick(map, row, ['bookdiscription', 'bookdescription', 'discription', 'description']);

    // No code => either a series header or a stray row.
    if (!code) {
      if (cellStr(bookNameCell) !== '' && !isNumeric(bookNameCell)) {
        series = {
          name: cellStr(bookNameCell),
          description,
          cover: photo1 || '',
        };
      }
      continue;
    }

    const shelfCode = normalizeShelfCode(code);
    if (!shelfCode) continue;

    let title: string;
    let seriesRef: { name: string; index: number } | null = null;

    if (isNumeric(bookNameCell)) {
      // Series item: real title lives in the "Book sub category" column.
      title = pick(map, row, ['booksubcategory', 'booksubategory']) || cellStr(bookNameCell);
      if (series) seriesRef = { name: series.name, index: Number(bookNameCell) };
    } else {
      title = cellStr(bookNameCell);
      series = null; // a standalone titled book ends the current series
    }

    const imageFiles = [photo1, photo2].filter(Boolean);
    const coverImageFile = photo1 || photo2 || series?.cover || '';

    items.push({
      shelfCode,
      kind: 'book',
      box: sheetName,
      title,
      description: description || series?.description || '',
      categoryName: lastSubCategory || lastCategory || sheetName,
      ageRaw: pick(map, row, ['age']),
      author: pick(map, row, ['author']) || null,
      numPages: isNumeric(row[map['nopages']]) ? Number(row[map['nopages']]) : null,
      coverTypeRaw: pick(map, row, ['coverpage']) || null,
      readingLevelRaw: pick(map, row, ['readinglevel']) || null,
      keywordsRaw: pick(map, row, ['keywords']),
      series: seriesRef,
      coverImageFile: coverImageFile || null,
      imageFiles,
      material: null,
      pieceCount: null,
      totalCopies: detectCopies(row),
    });
  }

  return items;
}

function parsePuzzleSheet(sheetName: string, rows: unknown[][], headerRow: number): ParsedItem[] {
  const map = buildHeaderMap(rows[headerRow]);
  const items: ParsedItem[] = [];
  let current: (ParsedItem & { inside: string[] }) | null = null;

  const flush = () => {
    if (!current) return;
    const inside = current.inside.filter(Boolean);
    const parts: string[] = [];
    if (current.pieceCount) parts.push(`${current.pieceCount} puzzle${current.pieceCount > 1 ? 's' : ''}`);
    if (inside.length) parts.push(`Contents: ${inside.join('; ')}`);
    if (current.material) parts.push(`Material: ${current.material}`);
    current.description = parts.join('. ') || current.title;
    const { inside: _omit, ...item } = current;
    items.push(item);
    current = null;
  };

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((c) => cellStr(c) === '')) continue;

    const code = pick(map, row, ['bookcodenumber']);
    const name = pick(map, row, ['puzzlename']);
    const inside = pick(map, row, ['whatsinside']);

    if (code && name) {
      flush();
      const shelfCode = normalizeShelfCode(code);
      if (!shelfCode) continue;
      const pieces = row[map['noofpuzzles']];
      current = {
        shelfCode,
        kind: 'puzzle',
        box: sheetName,
        title: name,
        description: '',
        categoryName: 'Puzzles',
        ageRaw: pick(map, row, ['solvingage', 'category']),
        author: null,
        numPages: null,
        coverTypeRaw: null,
        readingLevelRaw: pick(map, row, ['solvinglevel']) || null,
        keywordsRaw: pick(map, row, ['keywords']),
        series: null,
        coverImageFile: null,
        imageFiles: [],
        material: pick(map, row, ['material']) || null,
        pieceCount: isNumeric(pieces) ? Number(pieces) : null,
        totalCopies: detectCopies(row),
        inside: [inside],
      };
    } else if (current && inside) {
      current.inside.push(inside);
    }
  }
  flush();
  return items;
}

export function parseWorkbook(filePath: string): ParsedItem[] {
  const wb = XLSX.readFile(filePath);
  const all: ParsedItem[] = [];

  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.has(sheetName)) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
      header: 1,
      defval: '',
    });
    const headerRow = findHeaderRow(rows);
    if (headerRow < 0) continue;

    const isPuzzle = rows[headerRow].map(norm).includes('puzzlename');
    const parsed = isPuzzle
      ? parsePuzzleSheet(sheetName, rows, headerRow)
      : parseBookSheet(sheetName, rows, headerRow);
    all.push(...parsed);
  }

  return all;
}

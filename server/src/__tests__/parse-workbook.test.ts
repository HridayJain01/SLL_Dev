import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as XLSX from 'xlsx';
import { parseWorkbook } from '../seed/parseWorkbook.js';

/**
 * The newer "Library stock" layout moved the age band into the Category column,
 * dropped the Age column, added a "Books - master file" copy of every box, and
 * notes extra copies as "2 books" or a bare "2" in an unlabeled column.
 */
describe('parseWorkbook (new layout)', () => {
  const header = ['sr.no', 'Category', 'Sub category', 'Book name', 'Book sub category', 'Book discription',
    'No pages', 'Author', 'Cover Page', 'Reading level', 'Book Code Number', 'key words', ''];
  const box5 = [
    header,
    [1, '2-4yrs', 'Series', 'Elmer', '', 'Series blurb'],
    ['', '', '', 1, 'Elmer and the stranger', 'A bounce or a jump?', 15, 'David Mckee', 'soft', 'Medium', 'B5/7', 'story', '2 books'],
  ];
  const box7 = [header, [1, 'Grammar', '', 'Noun', '', 'Grammar fun', 16, '', 'Soft', '', 'B7/01', '', 2]];

  const file = path.join(os.tmpdir(), `parse-workbook-${process.pid}.xlsx`);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(box5), 'Box 5');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(box7), 'Box 7');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...box5, ...box7.slice(1)]), 'Books - master file');
  XLSX.writeFile(wb, file);
  const items = parseWorkbook(file);
  fs.rmSync(file);

  it('skips the master sheet', () => {
    expect(items.map((i) => i.shelfCode)).toEqual(['B5/07', 'B7/01']);
  });

  it('reads the age band from Category, not as the category name', () => {
    expect(items[0]).toMatchObject({ ageRaw: '2-4yrs', categoryName: 'Series', series: { name: 'Elmer', index: 1 } });
    expect(items[1]).toMatchObject({ ageRaw: '', categoryName: 'Grammar' });
  });

  it('counts "2 books" and a bare 2 in an unlabeled column as copies', () => {
    expect(items.map((i) => i.totalCopies)).toEqual([2, 2]);
  });
});

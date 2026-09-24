/**
 * The packing slip attached to the admin's new-order email, to be printed and
 * put on the parcel.
 *
 * Written as raw PDF rather than with a library: one A4 page of text and lines
 * in the built-in Helvetica needs no font files, which also keeps it clear of
 * serverless bundling. Orders are capped by plan at 10 items, so one page fits.
 * ponytail: Latin-1 only — a name typed in Devanagari prints as "?". Embed a
 * Unicode font (or switch to pdfkit) if members start using non-Latin names.
 */

export interface PackingSlip {
  orderRef: string;
  placedAt: Date;
  member: { name: string; email?: string; phone?: string; address?: string | null; plan?: string };
  items: { title: string; kind?: string; author?: string; shelfCode?: string }[];
}

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;

/** Helvetica has no glyphs outside WinAnsi; smart punctuation maps, the rest becomes "?". */
function latin1(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

/** Helvetica averages about half an em per character; good enough to keep a cell inside its column. */
function fit(text: string, size: number, width: number): string {
  const max = Math.floor(width / (size * 0.55));
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

/** Word-wraps with the same width estimate, for the address, which must never be cut short. */
function wrap(text: string, size: number, width: number): string[] {
  const max = Math.floor(width / (size * 0.55));
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    if (current && `${current} ${word}`.length > max) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function pdfString(text: string): string {
  return `(${latin1(text).replace(/[\\()]/g, (c) => `\\${c}`)})`;
}

export function renderPackingSlip(slip: PackingSlip): Buffer {
  const ops: string[] = [];
  const text = (x: number, y: number, value: string, size = 10, bold = false) =>
    ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td ${pdfString(value)} Tj ET`);
  const line = (x1: number, y1: number, x2: number, y2: number) => ops.push(`${x1} ${y1} m ${x2} ${y2} l S`);

  const right = PAGE_W - MARGIN;
  let y = PAGE_H - MARGIN - 10;

  text(MARGIN, y, 'Star Learners Library', 18, true);
  text(right - 150, y, 'PACKING SLIP', 14, true);
  y -= 22;
  text(MARGIN, y, `Order ${slip.orderRef}`, 12, true);
  text(right - 150, y, slip.placedAt.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }), 10);
  y -= 14;
  ops.push('0.8 w');
  line(MARGIN, y, right, y);

  // Ship-to block, large enough to read off a parcel.
  y -= 24;
  text(MARGIN, y, 'DELIVER TO', 9, true);
  y -= 20;
  text(MARGIN, y, fit(slip.member.name, 16, right - MARGIN), 16, true);
  const details = [
    slip.member.phone && `Phone: ${slip.member.phone}`,
    slip.member.email && `Email: ${slip.member.email}`,
    `Address: ${slip.member.address || 'No saved address - confirm with member'}`,
    slip.member.plan && `Plan: ${slip.member.plan}`,
  ].filter(Boolean) as string[];
  for (const detail of details) {
    for (const part of wrap(detail, 11, right - MARGIN)) {
      y -= 16;
      text(MARGIN, y, part, 11);
    }
  }

  // Items table.
  y -= 32;
  const cols = { check: MARGIN, n: MARGIN + 26, title: MARGIN + 50, kind: MARGIN + 300, shelf: MARGIN + 360, author: MARGIN + 420 };
  text(MARGIN, y, `ITEMS (${slip.items.length})`, 9, true);
  y -= 18;
  ops.push('0.95 g', `${MARGIN} ${y - 6} ${right - MARGIN} 20 re f`, '0 g');
  text(cols.n, y, '#', 9, true);
  text(cols.title, y, 'Title', 9, true);
  text(cols.kind, y, 'Type', 9, true);
  text(cols.shelf, y, 'Shelf', 9, true);
  text(cols.author, y, 'Author', 9, true);
  y -= 6;

  ops.push('0.4 w');
  slip.items.forEach((item, i) => {
    y -= 24;
    ops.push(`${cols.check} ${y - 2} 11 11 re S`);
    text(cols.n, y, String(i + 1), 10);
    text(cols.title, y, fit(item.title, 10, cols.kind - cols.title - 8), 10, true);
    text(cols.kind, y, item.kind === 'puzzle' ? 'Puzzle' : 'Book', 10);
    text(cols.shelf, y, fit(item.shelfCode || '-', 10, cols.author - cols.shelf - 8), 10);
    text(cols.author, y, fit(item.author || '-', 10, right - cols.author), 10);
    line(MARGIN, y - 8, right, y - 8);
  });

  y -= 48;
  text(MARGIN, y, 'Packed by: ______________________', 10);
  text(MARGIN + 260, y, 'Checked by: ______________________', 10);
  y -= 24;
  text(MARGIN, y, 'The loan period starts on delivery. Please return the full bag together.', 9);

  return assemble(ops.join('\n'));
}

/** Wraps one content stream into a single-page PDF with the byte offsets the xref table needs. */
function assemble(content: string): Buffer {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
  ];

  // Every character is Latin-1 by now, so string length is byte length.
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

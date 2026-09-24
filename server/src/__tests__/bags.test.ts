import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Borrow from '../models/Borrow.js';
import { emailService } from '../lib/email/index.js';
import { renderPackingSlip } from '../lib/packingSlip.js';
import { toWhatsAppNumber } from '../lib/whatsapp.js';
import { makeUser, makeBook, makeMembership, cookieFor } from './helpers.js';

const adminMail = vi.spyOn(emailService, 'adminOrderPlaced');

beforeEach(() => {
  adminMail.mockClear();
  adminMail.mockResolvedValue(true);
});

/** One checkout's worth of loans, sharing an issueDate. */
async function makeBag(userId: unknown, size: number, fulfilment = 'WITH_MEMBER') {
  const issueDate = new Date(Date.now() - Math.floor(Math.random() * 1e6));
  const rows = [];
  for (let i = 0; i < size; i++) {
    const book = await makeBook();
    rows.push(await Borrow.create({
      userId, bookId: book._id, issueDate, cycleMonth: 1, cycleYear: 2026, status: 'ACTIVE', fulfilment,
    }));
  }
  return rows;
}

describe('POST /api/borrows/return-request', () => {
  it('returns the whole bag, and only that bag', async () => {
    const user = await makeUser();
    const bag = await makeBag(user._id, 3);
    const other = await makeBag(user._id, 2);

    const res = await request(app)
      .post('/api/borrows/return-request')
      .set('Cookie', cookieFor(user))
      .send({ orderId: String(bag[1]._id) });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(await Borrow.countDocuments({ _id: { $in: bag.map((b) => b._id) }, fulfilment: 'RETURN_REQUESTED' })).toBe(3);
    expect(await Borrow.countDocuments({ _id: { $in: other.map((b) => b._id) }, fulfilment: 'WITH_MEMBER' })).toBe(2);
  });

  it('refuses a bag that has not been delivered', async () => {
    const user = await makeUser();
    const bag = await makeBag(user._id, 2, 'OUT_FOR_DELIVERY');
    const res = await request(app)
      .post('/api/borrows/return-request')
      .set('Cookie', cookieFor(user))
      .send({ orderId: String(bag[0]._id) });
    expect(res.status).toBe(400);
  });

  it("will not touch someone else's bag", async () => {
    const owner = await makeUser();
    const bag = await makeBag(owner._id, 1);
    const res = await request(app)
      .post('/api/borrows/return-request')
      .set('Cookie', cookieFor(await makeUser()))
      .send({ orderId: String(bag[0]._id) });
    expect(res.status).toBe(404);
  });
});

describe('saved box and wishlist', () => {
  it('keeps each member their own, and counts wishlisters on the book', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const book = await makeBook();

    await request(app).put('/api/users/me/saved').set('Cookie', cookieFor(a))
      .send({ wishlist: [String(book._id)], box: [String(book._id)] });
    await request(app).put('/api/users/me/saved').set('Cookie', cookieFor(b))
      .send({ wishlist: [String(book._id)] });

    const mineA = await request(app).get('/api/users/me/saved').set('Cookie', cookieFor(a));
    const mineB = await request(app).get('/api/users/me/saved').set('Cookie', cookieFor(b));
    expect(mineA.body.box.map((x: any) => x._id)).toEqual([String(book._id)]);
    expect(mineB.body.box).toEqual([]);

    const detail = await request(app).get(`/api/books/${book._id}`);
    expect(detail.body.book.wishlistCount).toBe(2);
  });
});

describe('new order', () => {
  it('emails every admin a packing slip PDF', async () => {
    await makeUser({ role: 'ADMIN' });
    const member = await makeUser({ phone: '98765 43210' });
    await makeMembership(member._id);
    const book = await makeBook({ totalCopies: 2 });

    const res = await request(app).post('/api/borrows/request').set('Cookie', cookieFor(member))
      .send({ bookIds: [String(book._id)] });
    expect(res.status).toBe(201);

    await vi.waitFor(() => expect(adminMail).toHaveBeenCalledOnce());
    const [, order, , slip] = adminMail.mock.calls[0];
    expect(order.ref).toMatch(/^#SL-[0-9A-F]{6}$/);
    expect(slip.subarray(0, 5).toString()).toBe('%PDF-');
  });
});

describe('packing slip PDF', () => {
  it('produces a structurally valid PDF whose xref offsets point at their objects', () => {
    const pdf = renderPackingSlip({
      orderRef: '#SL-ABC123',
      placedAt: new Date(),
      member: { name: 'Aarav (Test) Shah', phone: '9876543210', address: 'Flat 4, “Sunrise” – Pune', plan: 'Star Reader' },
      items: [{ title: 'The Gruffalo \\ back(slash)', kind: 'book' }, { title: 'पहेली', kind: 'puzzle' }],
    }).toString('latin1');

    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
    const startxref = Number(pdf.match(/startxref\n(\d+)/)![1]);
    expect(pdf.slice(startxref, startxref + 4)).toBe('xref');
    const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    offsets.forEach((offset, i) => expect(pdf.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true));
    expect(pdf).toContain('(Aarav \\(Test\\) Shah)');
  });
});

describe('WhatsApp numbers', () => {
  it('normalises the ways Indian numbers get typed', () => {
    expect(toWhatsAppNumber('98765 43210')).toBe('919876543210');
    expect(toWhatsAppNumber('+91-98765-43210')).toBe('919876543210');
    expect(toWhatsAppNumber('098765 43210')).toBe('919876543210');
    expect(toWhatsAppNumber('12345')).toBeNull();
    expect(toWhatsAppNumber(undefined)).toBeNull();
  });
});

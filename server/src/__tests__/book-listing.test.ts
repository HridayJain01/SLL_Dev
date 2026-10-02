import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { makeBook } from './helpers.js';

const titles = (res: request.Response) => res.body.books.map((b: { title: string }) => b.title).sort();

describe('GET /api/books', () => {
  it('lists titles with a photo first by default', async () => {
    await makeBook({ title: 'Old with photo', coverImage: 'https://img/old.jpg' });
    await makeBook({ title: 'New without photo' });

    const res = await request(app).get('/api/books');
    expect(res.body.books.map((b: { title: string }) => b.title)).toEqual(['Old with photo', 'New without photo']);
  });

  // The sheet's bands touch (0-2, 2-4, 4-7, 7-9); touching must not count as overlap.
  it('matches an age band without pulling in the neighbouring bands', async () => {
    const ages: [string, number, number][] = [
      ['0-2', 0, 2], ['2-4', 2, 4], ['4-7', 4, 7], ['6-7', 6, 7],
      ['7-9', 7, 9], ['2-7', 2, 7], ['all ages', 0, 12], ['just 4', 4, 4],
    ];
    for (const [title, ageGroupMin, ageGroupMax] of ages) await makeBook({ title, ageGroupMin, ageGroupMax });

    const band = (min: number, max: number) => request(app).get('/api/books').query({ ageMin: min, ageMax: max });
    expect(titles(await band(2, 4))).toEqual(['2-4', '2-7', 'all ages']);
    expect(titles(await band(4, 7))).toEqual(['2-7', '4-7', '6-7', 'all ages', 'just 4']);
    expect(titles(await band(7, 9))).toEqual(['7-9', 'all ages']);
  });
});

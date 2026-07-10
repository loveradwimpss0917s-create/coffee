import type { Db } from '@coffee-lab/db';
import type { BrewInput } from '@coffee-lab/engine';
import { generateRecipe } from '@coffee-lab/engine';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Brew } from '@/lib/schemas';
import { brewsApp } from './brews';
import { createTestDb, makeTestUser, mountWithUser, readJson, seedUser } from './test-helpers';

type BrewList = { items: Brew[]; nextCursor: string | null };

const sampleInput: BrewInput = {
  bean: { roastLevel: 'light', process: 'washed' },
  equipment: { dripperId: 'hario-v60' },
  taste: { acidity: 0, sweetness: 0, bitterness: 0, body: 0, clarity: 0 },
  strength: 0,
  targetVolumeMl: 250,
  serveStyle: 'hot',
};
const sampleOutput = generateRecipe(sampleInput);

describe('brewsApp', () => {
  let db: Db;

  beforeEach(async () => {
    db = createTestDb();
    await seedUser(db, makeTestUser());
  });

  it('未認証は401', async () => {
    const app = mountWithUser(brewsApp, db, null);
    expect((await app.request('/')).status).toBe(401);
  });

  it('記録→一覧→取得→フィードバック更新→削除ができる', async () => {
    const app = mountWithUser(brewsApp, db, makeTestUser());
    const createRes = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        input: sampleInput,
        output: sampleOutput,
        brewedAt: Date.now(),
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await readJson<Brew>(createRes);
    expect(created.id).toMatch(/^brw_/);

    const listRes = await app.request('/');
    const list = await readJson<BrewList>(listRes);
    expect(list.items).toHaveLength(1);

    const getRes = await app.request(`/${created.id}`);
    expect(getRes.status).toBe(200);

    const patchRes = await app.request(`/${created.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        rating: 4.5,
        tasteFeedback: { acidity: 1, sweetness: 0, bitterness: -1, body: 0, clarity: 1 },
      }),
    });
    expect(patchRes.status).toBe(200);
    const patched = await readJson<Brew>(patchRes);
    expect(patched.rating).toBe(4.5);
    expect(patched.tasteFeedback?.acidity).toBe(1);

    const deleteRes = await app.request(`/${created.id}`, { method: 'DELETE' });
    expect(deleteRes.status).toBe(204);
    expect((await app.request(`/${created.id}`)).status).toBe(404);
  });

  it('PATCHはinput/outputなど記録内容を変更できない(未知キーは無視される)', async () => {
    const app = mountWithUser(brewsApp, db, makeTestUser());
    const createRes = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: sampleInput, output: sampleOutput, brewedAt: Date.now() }),
    });
    const created = await readJson<Brew>(createRes);

    const patchRes = await app.request(`/${created.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: 'メモ', doseG: 1 }),
    });
    expect(patchRes.status).toBe(200);
    const patched = await readJson<Brew>(patchRes);
    expect(patched.notes).toBe('メモ');
    expect(patched.output.doseG).toBe(sampleOutput.doseG);
  });
});

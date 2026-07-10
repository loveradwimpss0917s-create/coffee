import type { Db } from '@coffee-lab/db';
import type { BrewInput, Recipe } from '@coffee-lab/engine';
import { generateRecipe } from '@coffee-lab/engine';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SavedRecipe } from '@/lib/schemas';
import type { Problem } from './middleware/problem';
import { recipesApp } from './recipes';
import { createTestDb, makeTestUser, mountWithUser, readJson, seedUser } from './test-helpers';

type RecipeList = { items: SavedRecipe[]; nextCursor: string | null };

const sampleInput: BrewInput = {
  bean: { roastLevel: 'light', process: 'washed' },
  equipment: { dripperId: 'hario-v60' },
  taste: { acidity: 0, sweetness: 0, bitterness: 0, body: 0, clarity: 0 },
  strength: 0,
  targetVolumeMl: 250,
  serveStyle: 'hot',
};
const sampleOutput = generateRecipe(sampleInput);

describe('recipesApp', () => {
  let db: Db;

  beforeEach(async () => {
    db = createTestDb();
    await seedUser(db, makeTestUser());
  });

  it('POST /generate は未認証でも動く', async () => {
    const app = mountWithUser(recipesApp, db, null);
    const res = await app.request('/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sampleInput),
    });
    expect(res.status).toBe(200);
    const recipe = await readJson<Recipe>(res);
    expect(recipe.dripperId).toBe('hario-v60');
    expect(recipe.engineVersion).toBeTruthy();
  });

  it('未認証のCRUDは401', async () => {
    const app = mountWithUser(recipesApp, db, null);
    const res = await app.request('/');
    expect(res.status).toBe(401);
  });

  it('保存時にクライアントの改竄されたoutputを無視し、サーバー再生成分を保存する', async () => {
    const app = mountWithUser(recipesApp, db, makeTestUser());
    const tamperedOutput = { ...sampleOutput, doseG: 999999 };
    const createRes = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'V60マイレシピ', input: sampleInput, output: tamperedOutput }),
    });
    expect(createRes.status).toBe(201);
    const saved = await readJson<SavedRecipe>(createRes);
    expect(saved.output.doseG).toBe(sampleOutput.doseG);
    expect(saved.output.doseG).not.toBe(999999);
  });

  it('一覧・取得・title更新・削除ができる', async () => {
    const app = mountWithUser(recipesApp, db, makeTestUser());
    const createRes = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'V60マイレシピ', input: sampleInput, output: sampleOutput }),
    });
    expect(createRes.status).toBe(201);
    const created = await readJson<SavedRecipe>(createRes);
    expect(created.id).toMatch(/^rcp_/);

    const listRes = await app.request('/');
    const list = await readJson<RecipeList>(listRes);
    expect(list.items).toHaveLength(1);

    const patchRes = await app.request(`/${created.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '改良版' }),
    });
    expect(patchRes.status).toBe(200);
    expect((await readJson<SavedRecipe>(patchRes)).title).toBe('改良版');

    const deleteRes = await app.request(`/${created.id}`, { method: 'DELETE' });
    expect(deleteRes.status).toBe(204);
    expect((await app.request(`/${created.id}`)).status).toBe(404);
  });

  it('存在しない豆IDを指定すると400', async () => {
    const app = mountWithUser(recipesApp, db, makeTestUser());
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'V60マイレシピ',
        beanId: 'ben_does_not_exist',
        input: sampleInput,
        output: sampleOutput,
      }),
    });
    expect(res.status).toBe(400);
    expect((await readJson<Problem>(res)).type).toBe('validation_error');
  });
});

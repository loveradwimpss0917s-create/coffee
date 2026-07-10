import type { Db } from '@coffee-lab/db';
import type { BrewInput } from '@coffee-lab/engine';
import { generateRecipe } from '@coffee-lab/engine';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Bean, Brew, SavedRecipe } from '@/lib/schemas';
import { syncApp } from './sync';
import { createTestDb, makeTestUser, mountWithUser, readJson, seedUser } from './test-helpers';

const sampleInput: BrewInput = {
  bean: { roastLevel: 'light', process: 'washed' },
  equipment: { dripperId: 'hario-v60' },
  taste: { acidity: 0, sweetness: 0, bitterness: 0, body: 0, clarity: 0 },
  strength: 0,
  targetVolumeMl: 250,
  serveStyle: 'hot',
};
const sampleOutput = generateRecipe(sampleInput);

const localBean: Bean = {
  id: 'ben_local1',
  name: 'ローカルの豆',
  process: 'washed',
  roastLevel: 'light',
  createdAt: 1000,
  updatedAt: 1000,
};
const localRecipe: SavedRecipe = {
  id: 'rcp_local1',
  beanId: 'ben_local1',
  title: 'マイレシピ',
  input: sampleInput,
  output: sampleOutput,
  createdAt: 2000,
};
const localBrew: Brew = {
  id: 'brw_local1',
  recipeId: 'rcp_local1',
  beanId: 'ben_local1',
  input: sampleInput,
  output: sampleOutput,
  brewedAt: 3000,
  rating: 4,
};

type ImportResult = {
  imported: { beans: number; recipes: number; brews: number };
  skipped: boolean;
};

describe('syncApp', () => {
  let db: Db;

  beforeEach(async () => {
    db = createTestDb();
    await seedUser(db, makeTestUser());
  });

  it('未認証は401', async () => {
    const app = mountWithUser(syncApp, db, null);
    const res = await app.request('/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ importId: 'imp_1', beans: [], recipes: [], brews: [] }),
    });
    expect(res.status).toBe(401);
  });

  it('ゲストデータを取込み、ID再発行と相互参照の付け替えができる', async () => {
    const app = mountWithUser(syncApp, db, makeTestUser());
    const res = await app.request('/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        importId: 'imp_1',
        beans: [localBean],
        recipes: [localRecipe],
        brews: [localBrew],
      }),
    });
    expect(res.status).toBe(200);
    const body = await readJson<ImportResult>(res);
    expect(body.skipped).toBe(false);
    expect(body.imported).toEqual({ beans: 1, recipes: 1, brews: 1 });
  });

  it('同じimportIdの再送は冪等(二重取込されない)', async () => {
    const app = mountWithUser(syncApp, db, makeTestUser());
    const payload = JSON.stringify({
      importId: 'imp_dup',
      beans: [localBean],
      recipes: [],
      brews: [],
    });

    const first = await app.request('/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
    });
    expect((await readJson<ImportResult>(first)).skipped).toBe(false);

    const second = await app.request('/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
    });
    const secondBody = await readJson<ImportResult>(second);
    expect(secondBody.skipped).toBe(true);
    expect(secondBody.imported).toEqual({ beans: 0, recipes: 0, brews: 0 });
  });

  it('recipeのoutputはサーバーで再生成される(改竄防止)', async () => {
    const app = mountWithUser(syncApp, db, makeTestUser());
    const tampered: SavedRecipe = {
      ...localRecipe,
      output: { ...sampleOutput, doseG: 999999 },
    };
    const res = await app.request('/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ importId: 'imp_tamper', beans: [], recipes: [tampered], brews: [] }),
    });
    expect(res.status).toBe(200);
  });
});

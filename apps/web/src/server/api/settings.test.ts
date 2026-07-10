import type { Db } from '@coffee-lab/db';
import { beforeEach, describe, expect, it } from 'vitest';
import type { UserSettings } from '@/lib/schemas';
import { settingsApp } from './settings';
import { createTestDb, makeTestUser, mountWithUser, readJson, seedUser } from './test-helpers';

describe('settingsApp', () => {
  let db: Db;

  beforeEach(async () => {
    db = createTestDb();
    await seedUser(db, makeTestUser());
  });

  it('未保存時はDEFAULT_SETTINGSを返す', async () => {
    const app = mountWithUser(settingsApp, db, makeTestUser());
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const body = await readJson<UserSettings>(res);
    expect(body.onboarded).toBe(false);
    expect(body.theme).toBe('system');
  });

  it('PUTで保存し、GETに反映される(upsert)', async () => {
    const app = mountWithUser(settingsApp, db, makeTestUser());
    const putRes = await app.request('/', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ownedDripperIds: ['hario-v60'],
        defaultGrinderId: 'delonghi-kg521',
        grinderCalibrationOffset: 1.5,
        defaultTasteProfile: { acidity: 1, sweetness: 0, bitterness: 0, body: 0, clarity: 0 },
        theme: 'dark',
        onboarded: true,
      }),
    });
    expect(putRes.status).toBe(200);
    const saved = await readJson<UserSettings>(putRes);
    expect(saved.theme).toBe('dark');
    expect(saved.ownedDripperIds).toEqual(['hario-v60']);

    const getRes = await app.request('/');
    const fetched = await readJson<UserSettings>(getRes);
    expect(fetched.theme).toBe('dark');
    expect(fetched.grinderCalibrationOffset).toBe(1.5);

    // 2回目のPUTはupdateとして反映される
    const putAgain = await app.request('/', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ownedDripperIds: ['hario-v60', 'kalita-wave'],
        defaultTasteProfile: { acidity: 0, sweetness: 0, bitterness: 0, body: 0, clarity: 0 },
        theme: 'light',
        onboarded: true,
      }),
    });
    expect(putAgain.status).toBe(200);
    expect((await readJson<UserSettings>(putAgain)).theme).toBe('light');
  });

  it('未認証は401', async () => {
    const app = mountWithUser(settingsApp, db, null);
    expect((await app.request('/')).status).toBe(401);
  });
});

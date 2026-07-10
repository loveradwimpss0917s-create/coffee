import type { Db } from '@coffee-lab/db';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Bean } from '@/lib/schemas';
import { beansApp } from './beans';
import type { Problem } from './middleware/problem';
import { createTestDb, makeTestUser, mountWithUser, readJson, seedUser } from './test-helpers';

type BeanList = { items: Bean[]; nextCursor: string | null };

describe('beansApp', () => {
  let db: Db;

  beforeEach(async () => {
    db = createTestDb();
    await seedUser(db, makeTestUser());
    await seedUser(db, makeTestUser({ id: 'usr_other', email: 'other@example.com' }));
  });

  it('未認証は401を返す', async () => {
    const app = mountWithUser(beansApp, db, null);
    const res = await app.request('/');
    expect(res.status).toBe(401);
    const body = await readJson<Problem>(res);
    expect(body.type).toBe('unauthorized');
  });

  it('作成→一覧→取得→更新→削除の一連が動く', async () => {
    const app = mountWithUser(beansApp, db, makeTestUser());

    const createRes = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'エチオピア イルガチェフェ',
        process: 'washed',
        roastLevel: 'light',
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await readJson<Bean>(createRes);
    expect(created.id).toMatch(/^ben_/);
    expect(created.name).toBe('エチオピア イルガチェフェ');

    const listRes = await app.request('/');
    expect(listRes.status).toBe(200);
    const list = await readJson<BeanList>(listRes);
    expect(list.items).toHaveLength(1);
    expect(list.nextCursor).toBeNull();

    const getRes = await app.request(`/${created.id}`);
    expect(getRes.status).toBe(200);

    const patchRes = await app.request(`/${created.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: '甘い' }),
    });
    expect(patchRes.status).toBe(200);
    const patched = await readJson<Bean>(patchRes);
    expect(patched.notes).toBe('甘い');
    expect(patched.name).toBe('エチオピア イルガチェフェ');

    const deleteRes = await app.request(`/${created.id}`, { method: 'DELETE' });
    expect(deleteRes.status).toBe(204);

    const afterDelete = await app.request(`/${created.id}`);
    expect(afterDelete.status).toBe(404);
  });

  it('不正な入力は400 validation_errorを返す', async () => {
    const app = mountWithUser(beansApp, db, makeTestUser());
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', process: 'washed', roastLevel: 'light' }),
    });
    expect(res.status).toBe(400);
    const body = await readJson<Problem>(res);
    expect(body.type).toBe('validation_error');
    expect(body.errors?.length).toBeGreaterThan(0);
  });

  it('他ユーザーの豆は取得・更新・削除できない', async () => {
    const ownerApp = mountWithUser(beansApp, db, makeTestUser());
    const createRes = await ownerApp.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '豆', process: 'washed', roastLevel: 'light' }),
    });
    const created = await readJson<Bean>(createRes);

    const otherApp = mountWithUser(beansApp, db, makeTestUser({ id: 'usr_other' }));
    const getRes = await otherApp.request(`/${created.id}`);
    expect(getRes.status).toBe(404);

    const deleteRes = await otherApp.request(`/${created.id}`, { method: 'DELETE' });
    expect(deleteRes.status).toBe(404);
  });
});

import 'server-only';
import type { Db } from '@coffee-lab/db';
import { beans } from '@coffee-lab/db';
import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, isNotNull, isNull, lt } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { createId } from '@/lib/id';
import { beanSchema } from '@/lib/schemas';
import type { AppEnv } from './context';
import { requireAuth } from './context';
import { notFound, requireUser } from './lib/guards';
import { buildPage, DEFAULT_PAGE_SIZE, parseCursor } from './lib/pagination';
import { problem } from './middleware/problem';
import { validationHook } from './middleware/validation-hook';

const createBeanSchema = beanSchema.omit({ id: true, createdAt: true, updatedAt: true });
const updateBeanSchema = createBeanSchema.partial();
const listQuerySchema = z.object({
  cursor: z.string().optional(),
  archived: z.enum(['true', 'false']).optional(),
});

function toDto(row: typeof beans.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    roaster: row.roaster ?? undefined,
    origin: row.origin ?? undefined,
    variety: row.variety ?? undefined,
    process: row.process,
    roastLevel: row.roastLevel,
    roastDate: row.roastDate?.getTime(),
    notes: row.notes ?? undefined,
    archivedAt: row.archivedAt?.getTime(),
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

async function findOwned(db: Db, id: string, userId: string) {
  const [row] = await db
    .select()
    .from(beans)
    .where(and(eq(beans.id, id), eq(beans.userId, userId)));
  return row;
}

export const beansApp = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', zValidator('query', listQuerySchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const { cursor, archived } = c.req.valid('query');
    const cursorMs = parseCursor(cursor);

    const conditions = [eq(beans.userId, user.id)];
    if (archived === 'true') conditions.push(isNotNull(beans.archivedAt));
    if (archived === 'false') conditions.push(isNull(beans.archivedAt));
    if (cursorMs !== undefined) conditions.push(lt(beans.createdAt, new Date(cursorMs)));

    const rows = await db
      .select()
      .from(beans)
      .where(and(...conditions))
      .orderBy(desc(beans.createdAt))
      .limit(DEFAULT_PAGE_SIZE + 1);

    const { items, nextCursor } = buildPage(
      rows.map((row) => ({ ...toDto(row), sortKey: row.createdAt.getTime() })),
      DEFAULT_PAGE_SIZE,
    );
    return c.json({ items: items.map(({ sortKey: _sortKey, ...dto }) => dto), nextCursor });
  })
  .post('/', zValidator('json', createBeanSchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const body = c.req.valid('json');
    const now = new Date();
    const [row] = await db
      .insert(beans)
      .values({
        id: createId('ben'),
        userId: user.id,
        name: body.name,
        roaster: body.roaster,
        origin: body.origin,
        variety: body.variety,
        process: body.process,
        roastLevel: body.roastLevel,
        roastDate: body.roastDate !== undefined ? new Date(body.roastDate) : undefined,
        notes: body.notes,
        archivedAt: body.archivedAt !== undefined ? new Date(body.archivedAt) : undefined,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!row) return c.json(problem('internal', '作成に失敗しました', 500), 500);
    return c.json(toDto(row), 201);
  })
  .get('/:id', async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const row = await findOwned(db, c.req.param('id'), user.id);
    if (!row) notFound('豆が見つかりません');
    return c.json(toDto(row));
  })
  .patch('/:id', zValidator('json', updateBeanSchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const body = c.req.valid('json');
    const existing = await findOwned(db, c.req.param('id'), user.id);
    if (!existing) notFound('豆が見つかりません');

    const [row] = await db
      .update(beans)
      .set({
        ...body,
        roastDate: body.roastDate !== undefined ? new Date(body.roastDate) : undefined,
        archivedAt: body.archivedAt !== undefined ? new Date(body.archivedAt) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(beans.id, c.req.param('id')))
      .returning();
    if (!row) return c.json(problem('internal', '更新に失敗しました', 500), 500);
    return c.json(toDto(row));
  })
  .delete('/:id', async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const existing = await findOwned(db, c.req.param('id'), user.id);
    if (!existing) notFound('豆が見つかりません');
    await db.delete(beans).where(eq(beans.id, c.req.param('id')));
    return c.body(null, 204);
  });

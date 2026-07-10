import 'server-only';
import type { Db } from '@coffee-lab/db';
import { brews } from '@coffee-lab/db';
import { brewInputSchema, migrateRecipeJson } from '@coffee-lab/engine';
import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, lt } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { createId } from '@/lib/id';
import { brewSchema } from '@/lib/schemas';
import type { AppEnv } from './context';
import { requireAuth } from './context';
import { notFound, requireUser } from './lib/guards';
import { buildPage, DEFAULT_PAGE_SIZE, parseCursor } from './lib/pagination';
import { problem } from './middleware/problem';
import { validationHook } from './middleware/validation-hook';

const createBrewSchema = brewSchema.omit({ id: true });
const updateBrewSchema = brewSchema
  .pick({
    rating: true,
    tasteFeedback: true,
    tds: true,
    actualTimeSec: true,
    notes: true,
  })
  .partial();
const listQuerySchema = z.object({
  cursor: z.string().optional(),
  beanId: z.string().optional(),
});

function toDto(row: typeof brews.$inferSelect) {
  return {
    id: row.id,
    recipeId: row.recipeId ?? undefined,
    beanId: row.beanId ?? undefined,
    input: brewInputSchema.parse(row.input),
    output: migrateRecipeJson(row.output),
    brewedAt: row.brewedAt.getTime(),
    rating: row.rating ?? undefined,
    tasteFeedback: row.tasteFeedback ?? undefined,
    tds: row.tds ?? undefined,
    actualTimeSec: row.actualTimeSec ?? undefined,
    notes: row.notes ?? undefined,
  };
}

async function findOwned(db: Db, id: string, userId: string) {
  const [row] = await db
    .select()
    .from(brews)
    .where(and(eq(brews.id, id), eq(brews.userId, userId)));
  return row;
}

export const brewsApp = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', zValidator('query', listQuerySchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const { cursor, beanId } = c.req.valid('query');
    const cursorMs = parseCursor(cursor);

    const conditions = [eq(brews.userId, user.id)];
    if (beanId) conditions.push(eq(brews.beanId, beanId));
    if (cursorMs !== undefined) conditions.push(lt(brews.brewedAt, new Date(cursorMs)));

    const rows = await db
      .select()
      .from(brews)
      .where(and(...conditions))
      .orderBy(desc(brews.brewedAt))
      .limit(DEFAULT_PAGE_SIZE + 1);

    const { items, nextCursor } = buildPage(
      rows.map((row) => ({ ...toDto(row), sortKey: row.brewedAt.getTime() })),
      DEFAULT_PAGE_SIZE,
    );
    return c.json({ items: items.map(({ sortKey: _sortKey, ...dto }) => dto), nextCursor });
  })
  .post('/', zValidator('json', createBrewSchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const body = c.req.valid('json');
    const now = new Date();
    const [row] = await db
      .insert(brews)
      .values({
        id: createId('brw'),
        userId: user.id,
        recipeId: body.recipeId,
        beanId: body.beanId,
        input: body.input,
        output: body.output,
        engineVersion: body.output.engineVersion,
        brewedAt: new Date(body.brewedAt ?? now.getTime()),
        rating: body.rating,
        tasteFeedback: body.tasteFeedback,
        tds: body.tds,
        actualTimeSec: body.actualTimeSec,
        notes: body.notes,
      })
      .returning();
    if (!row) return c.json(problem('internal', '記録に失敗しました', 500), 500);
    return c.json(toDto(row), 201);
  })
  .get('/:id', async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const row = await findOwned(db, c.req.param('id'), user.id);
    if (!row) notFound('ログが見つかりません');
    return c.json(toDto(row));
  })
  .patch('/:id', zValidator('json', updateBrewSchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const body = c.req.valid('json');
    const existing = await findOwned(db, c.req.param('id'), user.id);
    if (!existing) notFound('ログが見つかりません');

    const [row] = await db
      .update(brews)
      .set(body)
      .where(eq(brews.id, c.req.param('id')))
      .returning();
    if (!row) return c.json(problem('internal', '更新に失敗しました', 500), 500);
    return c.json(toDto(row));
  })
  .delete('/:id', async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const existing = await findOwned(db, c.req.param('id'), user.id);
    if (!existing) notFound('ログが見つかりません');
    await db.delete(brews).where(eq(brews.id, c.req.param('id')));
    return c.body(null, 204);
  });

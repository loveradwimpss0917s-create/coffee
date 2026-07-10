import 'server-only';
import type { Db } from '@coffee-lab/db';
import { beans, recipes } from '@coffee-lab/db';
import { brewInputSchema, generateRecipe, migrateRecipeJson } from '@coffee-lab/engine';
import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, lt } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { createId } from '@/lib/id';
import { savedRecipeSchema } from '@/lib/schemas';
import type { AppEnv } from './context';
import { requireAuth } from './context';
import { notFound, requireUser } from './lib/guards';
import { buildPage, DEFAULT_PAGE_SIZE, parseCursor } from './lib/pagination';
import { problem } from './middleware/problem';
import { validationHook } from './middleware/validation-hook';

const createRecipeSchema = savedRecipeSchema.omit({ id: true, createdAt: true });
const updateRecipeSchema = z.object({ title: z.string().min(1).max(120).optional() });
const listQuerySchema = z.object({
  cursor: z.string().optional(),
  dripperId: z.string().optional(),
});

function toDto(row: typeof recipes.$inferSelect) {
  return {
    id: row.id,
    beanId: row.beanId ?? undefined,
    title: row.title,
    input: brewInputSchema.parse(row.input),
    output: migrateRecipeJson(row.output),
    createdAt: row.createdAt.getTime(),
  };
}

async function findOwned(db: Db, id: string, userId: string) {
  const [row] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
  return row;
}

const recipesApp = new Hono<AppEnv>()
  .get('/', requireAuth, zValidator('query', listQuerySchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const { cursor, dripperId } = c.req.valid('query');
    const cursorMs = parseCursor(cursor);

    const conditions = [eq(recipes.userId, user.id)];
    if (dripperId) conditions.push(eq(recipes.dripperId, dripperId));
    if (cursorMs !== undefined) conditions.push(lt(recipes.createdAt, new Date(cursorMs)));

    const rows = await db
      .select()
      .from(recipes)
      .where(and(...conditions))
      .orderBy(desc(recipes.createdAt))
      .limit(DEFAULT_PAGE_SIZE + 1);

    const { items, nextCursor } = buildPage(
      rows.map((row) => ({ ...toDto(row), sortKey: row.createdAt.getTime() })),
      DEFAULT_PAGE_SIZE,
    );
    return c.json({ items: items.map(({ sortKey: _sortKey, ...dto }) => dto), nextCursor });
  })
  .post('/', requireAuth, zValidator('json', createRecipeSchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const body = c.req.valid('json');

    if (body.beanId) {
      const [bean] = await db
        .select({ id: beans.id })
        .from(beans)
        .where(and(eq(beans.id, body.beanId), eq(beans.userId, user.id)));
      if (!bean) return c.json(problem('validation_error', '指定した豆が見つかりません', 400), 400);
    }

    // 改竄防止: クライアントの output は信用せず、input からサーバーで再生成した結果を保存する（docs/08 §3）。
    const regenerated = generateRecipe(body.input);
    const isIced = body.input.serveStyle === 'iced';
    const now = new Date();
    const [row] = await db
      .insert(recipes)
      .values({
        id: createId('rcp'),
        userId: user.id,
        beanId: body.beanId,
        title: body.title,
        input: body.input,
        output: regenerated,
        engineVersion: regenerated.engineVersion,
        dripperId: regenerated.dripperId,
        isIced,
        createdAt: now,
      })
      .returning();
    if (!row) return c.json(problem('internal', '保存に失敗しました', 500), 500);
    return c.json(toDto(row), 201);
  })
  .get('/:id', requireAuth, async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const row = await findOwned(db, c.req.param('id'), user.id);
    if (!row) notFound('レシピが見つかりません');
    return c.json(toDto(row));
  })
  .patch('/:id', requireAuth, zValidator('json', updateRecipeSchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const body = c.req.valid('json');
    const existing = await findOwned(db, c.req.param('id'), user.id);
    if (!existing) notFound('レシピが見つかりません');

    const [row] = await db
      .update(recipes)
      .set(body)
      .where(eq(recipes.id, c.req.param('id')))
      .returning();
    if (!row) return c.json(problem('internal', '更新に失敗しました', 500), 500);
    return c.json(toDto(row));
  })
  .delete('/:id', requireAuth, async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const existing = await findOwned(db, c.req.param('id'), user.id);
    if (!existing) notFound('レシピが見つかりません');
    await db.delete(recipes).where(eq(recipes.id, c.req.param('id')));
    return c.body(null, 204);
  })
  .post('/generate', zValidator('json', brewInputSchema, validationHook), (c) => {
    // 未認証可・レートリミット強め（docs/08 §3、KVレートリミットは2-8で導入）
    const input = c.req.valid('json');
    return c.json(generateRecipe(input));
  });

export { recipesApp };

import 'server-only';
import { beans, brews, recipes, syncImports } from '@coffee-lab/db';
import { generateRecipe } from '@coffee-lab/engine';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { createId } from '@/lib/id';
import { beanSchema, brewSchema, savedRecipeSchema } from '@/lib/schemas';
import type { AppEnv } from './context';
import { requireAuth } from './context';
import { requireUser } from './lib/guards';
import { problem } from './middleware/problem';
import { validationHook } from './middleware/validation-hook';

const MAX_BODY_BYTES = 500 * 1024;

/**
 * ゲスト localStorage データの取込envelope（docs/07 §5, docs/08 §3）。
 * サーバーで ID を再発行するため beans/recipes/brews のローカルIDは
 * インポート内の相互参照(beanId/recipeId)解決にのみ使い、保存はしない。
 */
const syncImportSchema = z.object({
  importId: z.string().min(1),
  version: z.number().int().default(1),
  beans: z.array(beanSchema),
  recipes: z.array(savedRecipeSchema),
  brews: z.array(brewSchema),
});

export const syncApp = new Hono<AppEnv>().post(
  '/import',
  requireAuth,
  zValidator('json', syncImportSchema, validationHook),
  async (c) => {
    const contentLength = Number(c.req.header('content-length') ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return c.json(problem('validation_error', 'データが大きすぎます(上限500KB)', 400), 400);
    }

    const db = c.get('db');
    const user = requireUser(c);
    const body = c.req.valid('json');

    const [already] = await db
      .select({ importId: syncImports.importId })
      .from(syncImports)
      .where(eq(syncImports.importId, body.importId));
    if (already) {
      return c.json({ imported: { beans: 0, recipes: 0, brews: 0 }, skipped: true });
    }

    const now = new Date();
    const beanIdMap = new Map<string, string>();
    const recipeIdMap = new Map<string, string>();

    if (body.beans.length > 0) {
      const rows = body.beans.map((bean) => {
        const newId = createId('ben');
        beanIdMap.set(bean.id, newId);
        return {
          id: newId,
          userId: user.id,
          name: bean.name,
          roaster: bean.roaster,
          origin: bean.origin,
          variety: bean.variety,
          process: bean.process,
          roastLevel: bean.roastLevel,
          roastDate: bean.roastDate !== undefined ? new Date(bean.roastDate) : undefined,
          notes: bean.notes,
          archivedAt: bean.archivedAt !== undefined ? new Date(bean.archivedAt) : undefined,
          createdAt: new Date(bean.createdAt),
          updatedAt: new Date(bean.updatedAt),
        };
      });
      await db.insert(beans).values(rows);
    }

    if (body.recipes.length > 0) {
      const rows = body.recipes.map((recipe) => {
        const newId = createId('rcp');
        recipeIdMap.set(recipe.id, newId);
        // 改竄防止のためサーバーで再生成する(POST /recipes と同じ方針、docs/08 §3)
        const regenerated = generateRecipe(recipe.input);
        return {
          id: newId,
          userId: user.id,
          beanId: recipe.beanId ? (beanIdMap.get(recipe.beanId) ?? undefined) : undefined,
          title: recipe.title,
          input: recipe.input,
          output: regenerated,
          engineVersion: regenerated.engineVersion,
          dripperId: regenerated.dripperId,
          isIced: recipe.input.serveStyle === 'iced',
          createdAt: new Date(recipe.createdAt),
        };
      });
      await db.insert(recipes).values(rows);
    }

    if (body.brews.length > 0) {
      const rows = body.brews.map((brew) => ({
        id: createId('brw'),
        userId: user.id,
        recipeId: brew.recipeId ? (recipeIdMap.get(brew.recipeId) ?? undefined) : undefined,
        beanId: brew.beanId ? (beanIdMap.get(brew.beanId) ?? undefined) : undefined,
        input: brew.input,
        output: brew.output,
        engineVersion: brew.output.engineVersion,
        brewedAt: new Date(brew.brewedAt),
        rating: brew.rating,
        tasteFeedback: brew.tasteFeedback,
        tds: brew.tds,
        actualTimeSec: brew.actualTimeSec,
        notes: brew.notes,
      }));
      await db.insert(brews).values(rows);
    }

    await db
      .insert(syncImports)
      .values({ importId: body.importId, userId: user.id, createdAt: now });

    return c.json({
      imported: {
        beans: body.beans.length,
        recipes: body.recipes.length,
        brews: body.brews.length,
      },
      skipped: false,
    });
  },
);

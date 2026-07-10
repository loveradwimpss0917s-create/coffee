import 'server-only';
import { userSettings } from '@coffee-lab/db';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { DEFAULT_SETTINGS, userSettingsSchema } from '@/lib/schemas';
import type { AppEnv } from './context';
import { requireAuth } from './context';
import { requireUser } from './lib/guards';
import { problem } from './middleware/problem';
import { validationHook } from './middleware/validation-hook';

export const settingsApp = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
    if (!row) return c.json(DEFAULT_SETTINGS);
    return c.json(
      userSettingsSchema.parse({
        ownedDripperIds: row.ownedDripperIds,
        defaultGrinderId: row.defaultGrinderId ?? undefined,
        grinderCalibrationOffset: row.grinderCalibrationOffset,
        defaultTasteProfile: row.defaultTasteProfile,
        theme: row.theme,
        onboarded: row.onboarded,
      }),
    );
  })
  .put('/', zValidator('json', userSettingsSchema, validationHook), async (c) => {
    const db = c.get('db');
    const user = requireUser(c);
    const body = c.req.valid('json');
    const values = {
      userId: user.id,
      ownedDripperIds: body.ownedDripperIds,
      defaultGrinderId: body.defaultGrinderId,
      grinderCalibrationOffset: body.grinderCalibrationOffset,
      defaultTasteProfile: body.defaultTasteProfile,
      theme: body.theme,
      onboarded: body.onboarded,
    };
    const [row] = await db
      .insert(userSettings)
      .values(values)
      .onConflictDoUpdate({ target: userSettings.userId, set: values })
      .returning();
    if (!row) return c.json(problem('internal', '保存に失敗しました', 500), 500);
    return c.json(
      userSettingsSchema.parse({
        ownedDripperIds: row.ownedDripperIds,
        defaultGrinderId: row.defaultGrinderId ?? undefined,
        grinderCalibrationOffset: row.grinderCalibrationOffset,
        defaultTasteProfile: row.defaultTasteProfile,
        theme: row.theme,
        onboarded: row.onboarded,
      }),
    );
  });

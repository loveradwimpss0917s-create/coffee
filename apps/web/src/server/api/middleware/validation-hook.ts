import 'server-only';
import type { Hook } from '@hono/zod-validator';
import type { Env } from 'hono';
import { problem } from './problem';

/** zValidator の失敗時フック。Zod のエラーを共通のエラー形式に変換する（docs/08 §2）。 */
export function validationHook<T>(
  result: Parameters<Hook<T, Env, string>>[0],
  c: Parameters<Hook<T, Env, string>>[1],
) {
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return c.json(problem('validation_error', '入力が不正です', 400, errors), 400);
  }
}

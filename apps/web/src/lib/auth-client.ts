'use client';

import { anonymousClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth のクライアント（docs/08 §3、apps/web/src/server/auth.ts と対になる)。
 * baseURL は同一オリジンのため未指定(相対パスで /api/auth/* を叩く)。
 */
export const authClient = createAuthClient({
  plugins: [anonymousClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;

import { hc } from 'hono/client';
import type { AppType } from '@/server/api';

/**
 * Hono RPC クライアント（docs/08 §1）。fetch ラッパーは書かず、型を hc<AppType> から供給する。
 * `AppType` は型のみのインポートなのでランタイムには server/ のコードは含まれない。
 * basePath('/api/v1') は AppType のルート型自体に含まれるため、baseURL は '/' にする。
 */
const client = hc<AppType>('/').api.v1;

export const beansClient = client.beans;
export const recipesClient = client.recipes;
export const brewsClient = client.brews;
export const settingsClient = client.settings;
export const syncClient = client.sync;

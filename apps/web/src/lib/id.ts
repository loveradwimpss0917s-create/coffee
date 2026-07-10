import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);

/** プレフィックス付きID（docs/04 §1.2）。例: ben_x7Kd9Pq2Rs4T */
export type IdPrefix = 'ben' | 'rcp' | 'brw' | 'ugr';

export function createId(prefix: IdPrefix): string {
  return `${prefix}_${nanoid()}`;
}

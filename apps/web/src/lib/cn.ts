import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind クラスの条件結合 + 重複解決（docs/04 §3.3） */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

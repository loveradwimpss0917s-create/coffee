import type { MetadataRoute } from 'next';

/**
 * Web App Manifest（ホーム画面追加用アイコン・スプラッシュ設定）。
 * サービスワーカー等の本格 PWA 対応は M2 ロードマップ 2-8 で行う。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Coffee Recipe Lab',
    short_name: 'Coffee Lab',
    description: '味から逆算する、コーヒードリップレシピ生成アプリ',
    start_url: '/',
    display: 'standalone',
    background_color: '#2b241d',
    theme_color: '#2b241d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

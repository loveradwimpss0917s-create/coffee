import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@coffee-lab/engine', '@coffee-lab/db'],
};

export default nextConfig;

// `next dev` でも D1/KV/R2 等の Cloudflare バインディングにアクセスできるようにする
// （wrangler の Platform Proxy 経由、docs/13 §3）。ビルド/デプロイ時は no-op。
initOpenNextCloudflareForDev();

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeEffect } from './theme-effect';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeEffect />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}

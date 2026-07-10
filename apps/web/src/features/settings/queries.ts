'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keys } from '@/lib/query-keys';
import type { UserSettings } from '@/lib/schemas';
import { settingsRepository } from './repository';

export function useSettings() {
  return useQuery({
    queryKey: keys.settings.all,
    queryFn: () => settingsRepository.get(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<UserSettings>) => Promise.resolve(settingsRepository.update(patch)),
    onSuccess: (settings) => {
      queryClient.setQueryData(keys.settings.all, settings);
    },
  });
}

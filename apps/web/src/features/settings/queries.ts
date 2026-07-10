'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { keys } from '@/lib/query-keys';
import type { UserSettings } from '@/lib/schemas';
import type { SettingsRepository } from './repository';
import { apiSettingsRepository } from './repository.api';
import { localSettingsRepository } from './repository.local';

function useSettingsRepository(): SettingsRepository {
  const { data: session } = useSession();
  return session ? apiSettingsRepository : localSettingsRepository;
}

export function useSettings() {
  const repository = useSettingsRepository();
  return useQuery({
    queryKey: keys.settings.all,
    queryFn: () => repository.get(),
  });
}

export function useUpdateSettings() {
  const repository = useSettingsRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<UserSettings>) => {
      const current =
        queryClient.getQueryData<UserSettings>(keys.settings.all) ?? (await repository.get());
      return repository.save({ ...current, ...patch });
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(keys.settings.all, settings);
    },
  });
}

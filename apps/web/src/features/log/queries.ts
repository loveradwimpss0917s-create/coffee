'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { keys } from '@/lib/query-keys';
import type { CreateBrewInput, LogRepository, UpdateBrewInput } from './repository';
import { apiLogRepository } from './repository.api';
import { localLogRepository } from './repository.local';

function useLogRepository(): LogRepository {
  const { data: session } = useSession();
  return session ? apiLogRepository : localLogRepository;
}

export function useBrews() {
  const repository = useLogRepository();
  return useQuery({ queryKey: keys.brews.list(), queryFn: () => repository.list() });
}

export function useBrew(id: string | undefined) {
  const repository = useLogRepository();
  return useQuery({
    queryKey: keys.brews.detail(id ?? ''),
    queryFn: () => repository.get(id as string),
    enabled: !!id,
  });
}

export function useCreateBrew() {
  const repository = useLogRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBrewInput) => repository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.brews.list() });
    },
  });
}

export function useUpdateBrew() {
  const repository = useLogRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBrewInput }) =>
      repository.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.brews.all });
    },
  });
}

export function useDeleteBrew() {
  const repository = useLogRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.brews.list() });
    },
  });
}

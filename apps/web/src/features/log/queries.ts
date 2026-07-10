'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keys } from '@/lib/query-keys';
import { type CreateBrewInput, logRepository, type UpdateBrewInput } from './repository';

export function useBrews() {
  return useQuery({ queryKey: keys.brews.list(), queryFn: () => logRepository.list() });
}

export function useBrew(id: string | undefined) {
  return useQuery({
    queryKey: keys.brews.detail(id ?? ''),
    queryFn: () => logRepository.get(id as string),
    enabled: !!id,
  });
}

export function useCreateBrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBrewInput) => Promise.resolve(logRepository.create(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.brews.list() });
    },
  });
}

export function useUpdateBrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBrewInput }) =>
      Promise.resolve(logRepository.update(id, patch)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.brews.all });
    },
  });
}

export function useDeleteBrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(logRepository.remove(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.brews.list() });
    },
  });
}

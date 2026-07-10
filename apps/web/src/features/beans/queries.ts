'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keys } from '@/lib/query-keys';
import { beansRepository, type CreateBeanInput, type UpdateBeanInput } from './repository';

export function useBeans() {
  return useQuery({ queryKey: keys.beans.list(), queryFn: () => beansRepository.list() });
}

export function useBean(id: string | undefined) {
  return useQuery({
    queryKey: keys.beans.detail(id ?? ''),
    queryFn: () => beansRepository.get(id as string),
    enabled: !!id,
  });
}

export function useCreateBean() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBeanInput) => Promise.resolve(beansRepository.create(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.beans.list() });
    },
  });
}

export function useUpdateBean() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBeanInput }) =>
      Promise.resolve(beansRepository.update(id, patch)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.beans.all });
    },
  });
}

export function useDeleteBean() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(beansRepository.remove(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.beans.list() });
    },
  });
}

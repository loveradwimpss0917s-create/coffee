'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { keys } from '@/lib/query-keys';
import type { BeansRepository, CreateBeanInput, UpdateBeanInput } from './repository';
import { apiBeansRepository } from './repository.api';
import { localBeansRepository } from './repository.local';

/** ログイン状態(匿名含む)でリポジトリ実装をDIする(docs/09 §4)。UI側は意識しない。 */
function useBeansRepository(): BeansRepository {
  const { data: session } = useSession();
  return session ? apiBeansRepository : localBeansRepository;
}

export function useBeans() {
  const repository = useBeansRepository();
  return useQuery({ queryKey: keys.beans.list(), queryFn: () => repository.list() });
}

export function useBean(id: string | undefined) {
  const repository = useBeansRepository();
  return useQuery({
    queryKey: keys.beans.detail(id ?? ''),
    queryFn: () => repository.get(id as string),
    enabled: !!id,
  });
}

export function useCreateBean() {
  const repository = useBeansRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBeanInput) => repository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.beans.list() });
    },
  });
}

export function useUpdateBean() {
  const repository = useBeansRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBeanInput }) =>
      repository.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.beans.all });
    },
  });
}

export function useDeleteBean() {
  const repository = useBeansRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.beans.list() });
    },
  });
}

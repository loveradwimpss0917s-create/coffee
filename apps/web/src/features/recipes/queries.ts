'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { keys } from '@/lib/query-keys';
import type { CreateSavedRecipeInput, RecipesRepository } from './repository';
import { apiRecipesRepository } from './repository.api';
import { localRecipesRepository } from './repository.local';

function useRecipesRepository(): RecipesRepository {
  const { data: session } = useSession();
  return session ? apiRecipesRepository : localRecipesRepository;
}

export function useSavedRecipes() {
  const repository = useRecipesRepository();
  return useQuery({ queryKey: keys.recipes.list(), queryFn: () => repository.list() });
}

export function useSavedRecipe(id: string | undefined) {
  const repository = useRecipesRepository();
  return useQuery({
    queryKey: keys.recipes.detail(id ?? ''),
    queryFn: () => repository.get(id as string),
    enabled: !!id,
  });
}

export function useCreateSavedRecipe() {
  const repository = useRecipesRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSavedRecipeInput) => repository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.recipes.list() });
    },
  });
}

export function useDeleteSavedRecipe() {
  const repository = useRecipesRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.recipes.list() });
    },
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keys } from '@/lib/query-keys';
import { type CreateSavedRecipeInput, recipesRepository } from './repository';

export function useSavedRecipes() {
  return useQuery({ queryKey: keys.recipes.list(), queryFn: () => recipesRepository.list() });
}

export function useSavedRecipe(id: string | undefined) {
  return useQuery({
    queryKey: keys.recipes.detail(id ?? ''),
    queryFn: () => recipesRepository.get(id as string),
    enabled: !!id,
  });
}

export function useCreateSavedRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSavedRecipeInput) => Promise.resolve(recipesRepository.create(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.recipes.list() });
    },
  });
}

export function useDeleteSavedRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(recipesRepository.remove(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.recipes.list() });
    },
  });
}

/** TanStack Query の queryKey 一元管理（docs/09 §2.3） */
export const keys = {
  beans: {
    all: ['beans'] as const,
    list: () => [...keys.beans.all, 'list'] as const,
    detail: (id: string) => [...keys.beans.all, 'detail', id] as const,
  },
  recipes: {
    all: ['recipes'] as const,
    list: () => [...keys.recipes.all, 'list'] as const,
    detail: (id: string) => [...keys.recipes.all, 'detail', id] as const,
  },
  brews: {
    all: ['brews'] as const,
    list: () => [...keys.brews.all, 'list'] as const,
    detail: (id: string) => [...keys.brews.all, 'detail', id] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
};

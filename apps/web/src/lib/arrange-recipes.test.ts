import { describe, expect, it } from 'vitest';
import { ARRANGE_RECIPES, arrangeRecipeToRecipe } from './arrange-recipes';

describe('arrangeRecipeToRecipe', () => {
  it.each(
    ARRANGE_RECIPES.map((r) => [r.id, r] as const),
  )('%s は有効な Recipe に変換できる（bloom→pour→stir→press）', (_id, arrange) => {
    const recipe = arrangeRecipeToRecipe(arrange);

    expect(recipe.steps.map((s) => s.kind)).toEqual(['bloom', 'pour', 'stir', 'press']);
    expect(recipe.doseG).toBe(arrange.baseRecipe.doseG);
    expect(recipe.waterG).toBe(arrange.baseRecipe.waterG);
    expect(recipe.tempC).toBe(arrange.baseRecipe.tempC);
    expect(recipe.dripperId).toBe('aeropress');

    const lastStep = recipe.steps.at(-1);
    expect(lastStep?.kind).toBe('press');
    if (lastStep?.kind === 'press') {
      expect(recipe.totalTimeSec).toBe(lastStep.atSec + lastStep.durationSec);
    }
  });
});

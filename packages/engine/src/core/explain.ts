import type { DripperSpec } from '../data/types';
import type { BrewInput } from '../schemas/input';
import type { Rationale } from '../schemas/recipe';

/**
 * 生成根拠(Rationale)の組み立て。text 自体は持たず templateId + params のみを返し、
 * UI 側(i18n辞書)で文章化する（docs/10 §5-(8)、docs/05 §6 断定表現を避ける方針）。
 */

export function buildRationale(params: {
  input: BrewInput;
  dripper: DripperSpec;
  targetTds: number;
  targetEy: number;
  tempC: number;
  isIced: boolean;
}): Rationale[] {
  const { input, dripper, targetTds, targetEy, tempC, isIced } = params;
  const rationale: Rationale[] = [];

  rationale.push({
    paramKey: 'strength',
    templateId: 'strength.target',
    params: { tds: targetTds, ey: targetEy },
    sourceRefs: ['sca-brewing-control-chart'],
  });

  if (dripper.brewType === 'coldDrip') {
    rationale.push({
      paramKey: 'general',
      templateId: 'coldDrip.summary',
      params: {},
      sourceRefs: ['kyoto-style-cold-drip'],
    });
    return rationale;
  }

  rationale.push({
    paramKey: 'temperature',
    templateId: 'temperature.byRoastProcess',
    params: { roastLevel: input.bean.roastLevel, process: input.bean.process, tempC },
    sourceRefs: [],
  });

  if (Math.abs(input.taste.bitterness) >= 1 || Math.abs(input.taste.clarity) >= 1) {
    rationale.push({
      paramKey: 'temperature',
      templateId: 'temperature.tasteAdjust',
      params: { bitterness: input.taste.bitterness, clarity: input.taste.clarity },
      sourceRefs: [],
    });
  }

  rationale.push({
    paramKey: 'pours',
    templateId: 'pours.fourSixSummary',
    params: { acidity: input.taste.acidity, sweetness: input.taste.sweetness },
    sourceRefs: ['kasuya-4-6-method'],
  });

  if (dripper.features.includes('valve')) {
    const mode =
      input.taste.clarity >= input.taste.body + 1
        ? 'percolation'
        : input.taste.body >= input.taste.clarity + 1
          ? 'immersion'
          : 'hybrid';
    rationale.push({
      paramKey: 'switchMode',
      templateId: `switchMode.${mode}`,
      params: {},
      sourceRefs: mode === 'hybrid' ? ['kasuya-switch-hybrid-2025'] : [],
    });
  }

  if (isIced) {
    rationale.push({
      paramKey: 'iced',
      templateId: 'iced.dilutionCompensation',
      params: {},
      sourceRefs: [],
    });
  }

  return rationale;
}

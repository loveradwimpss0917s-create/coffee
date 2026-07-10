import type { ServeStyle } from '../schemas/input';
import type { RecipeStep } from '../schemas/recipe';
import type { TasteProfile } from '../schemas/taste';

/**
 * 器具マスタの型。外部入力ではなくコード内データ（docs/11 §1）のため
 * Zod ではなく TS 型で定義する（template 関数を持つため）。
 */
export type BrewType = 'percolation' | 'immersion' | 'hybrid' | 'pressure';
export type Geometry = 'cone' | 'flat' | 'basket' | 'cylinder';
export type FlowClass = 'fast' | 'medium' | 'slow';
export type DripperFeature = 'valve' | 'press' | 'inverted-capable';

export type BuildStepsParams = {
  doseG: number;
  waterG: number;
  tempC: number;
  taste: TasteProfile;
  strength: number;
  targetEy: number;
  daysOffRoast: number | undefined;
  serveStyle: ServeStyle;
};

export type DripperSpec = {
  id: string;
  name: string;
  brewType: BrewType;
  geometry: Geometry;
  /** 250ml 基準の粒度(μm) */
  baseGrindMicron: number;
  grindRangeMicron: [number, number];
  tempOffsetC: number;
  /** 液体保持率 g/g（docs/10 §5-(3)） */
  lrr: number;
  flowModel: { drawdownBaseSec: number; flowClass: FlowClass };
  ratioRange: [number, number];
  features: DripperFeature[];
  buildSteps: (params: BuildStepsParams) => RecipeStep[];
  notes?: string;
};

export type GrinderAdjustment =
  | { type: 'clicks'; micronPerStep: number; zeroOffsetMicron: number; maxSteps: number }
  | {
      type: 'numbered';
      micronPerStep: number;
      zeroOffsetMicron: number;
      minSetting: number;
      maxSetting: number;
      stepSize: number;
    }
  | {
      type: 'rotations';
      micronPerRotation: number;
      clicksPerRotation: number;
      zeroOffsetMicron: number;
    };

export type GrinderConfidence = 'measured' | 'community' | 'estimated';

export type GrinderSpec = {
  id: string;
  name: string;
  burrType: 'conical' | 'flat';
  adjustment: GrinderAdjustment;
  confidence: GrinderConfidence;
};

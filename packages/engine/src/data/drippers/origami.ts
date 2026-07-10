import { buildPercolationSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * ORIGAMI。コーン/フラット両対応のペーパーを使え、リブが細かく均一な流速。
 * V60 に近い挙動だが、やや穏やかな流速で扱いやすい。
 */
export const origami: DripperSpec = {
  id: 'origami',
  name: 'ORIGAMI',
  brewType: 'percolation',
  geometry: 'cone',
  baseGrindMicron: 640,
  grindRangeMicron: [420, 920],
  tempOffsetC: 0,
  lrr: 2.0,
  flowModel: { drawdownBaseSec: 160, flowClass: 'medium' },
  ratioRange: [14, 17],
  features: [],
  buildSteps: (params) =>
    buildPercolationSteps(params, { flowClass: 'medium', drawdownBaseSec: 160 }),
  notes: 'コーン/フラット両対応。V60よりやや穏やかな流速で再現性が高い。',
};

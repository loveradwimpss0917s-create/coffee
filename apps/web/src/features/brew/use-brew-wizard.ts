'use client';

import type { BrewInput } from '@coffee-lab/engine';
import { BALANCED_TASTE_PROFILE } from '@coffee-lab/engine';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const WIZARD_STEPS = ['bean', 'equipment', 'taste', 'volume'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export type WizardInput = {
  beanId: string | undefined;
  bean: BrewInput['bean'];
  equipment: Partial<BrewInput['equipment']>;
  taste: BrewInput['taste'];
  strength: number;
  targetVolumeMl: number;
  serveStyle: BrewInput['serveStyle'];
};

const INITIAL_INPUT: WizardInput = {
  beanId: undefined,
  bean: { roastLevel: 'medium', process: 'washed' },
  equipment: {},
  taste: BALANCED_TASTE_PROFILE,
  strength: 0,
  targetVolumeMl: 250,
  serveStyle: 'hot',
};

type BrewWizardState = {
  stepIndex: number;
  input: WizardInput;
  setField: <K extends keyof WizardInput>(key: K, value: WizardInput[K]) => void;
  goTo: (stepIndex: number) => void;
  next: () => void;
  back: () => void;
  loadFrom: (input: WizardInput) => void;
  reset: () => void;
};

export const useBrewWizardStore = create<BrewWizardState>()(
  persist(
    (set) => ({
      stepIndex: 0,
      input: INITIAL_INPUT,
      setField: (key, value) => set((state) => ({ input: { ...state.input, [key]: value } })),
      goTo: (stepIndex) =>
        set({ stepIndex: Math.min(Math.max(stepIndex, 0), WIZARD_STEPS.length - 1) }),
      next: () =>
        set((state) => ({ stepIndex: Math.min(state.stepIndex + 1, WIZARD_STEPS.length - 1) })),
      back: () => set((state) => ({ stepIndex: Math.max(state.stepIndex - 1, 0) })),
      loadFrom: (input) => set({ input, stepIndex: 0 }),
      reset: () => set({ input: INITIAL_INPUT, stepIndex: 0 }),
    }),
    { name: 'coffee-lab:brew-wizard' },
  ),
);

export function toBrewInput(input: WizardInput): BrewInput | undefined {
  if (!input.equipment.dripperId) return undefined;
  return {
    bean: input.bean,
    equipment: { dripperId: input.equipment.dripperId, grinderId: input.equipment.grinderId },
    taste: input.taste,
    strength: input.strength,
    targetVolumeMl: input.targetVolumeMl,
    serveStyle: input.serveStyle,
  };
}

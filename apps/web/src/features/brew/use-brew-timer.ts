'use client';

import type { Recipe } from '@coffee-lab/engine';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

type BrewTimerState = {
  recipe: Recipe | null;
  startedAt: number | null;
  pausedAt: number | null;
  pausedDurationMs: number;
  finishedAt: number | null;
  currentStepIndex: number;
  status: TimerStatus;
  start: (recipe: Recipe) => void;
  completeStep: () => void;
  pause: () => void;
  resume: () => void;
  finish: () => void;
  abort: () => void;
};

/**
 * 抽出タイマーの状態。経過時間は毎秒 state に書かず、
 * startedAt を基準にビュー側(useSyncExternalStore + rAF)が導出する（docs/09 §2.2）。
 */
export const useBrewTimerStore = create<BrewTimerState>()(
  persist(
    (set) => ({
      recipe: null,
      startedAt: null,
      pausedAt: null,
      pausedDurationMs: 0,
      finishedAt: null,
      currentStepIndex: 0,
      status: 'idle',
      start: (recipe) =>
        set({
          recipe,
          startedAt: Date.now(),
          pausedAt: null,
          pausedDurationMs: 0,
          finishedAt: null,
          currentStepIndex: 0,
          status: 'running',
        }),
      completeStep: () =>
        set((state) => {
          const nextIndex = state.currentStepIndex + 1;
          const isLast = !state.recipe || nextIndex >= state.recipe.steps.length;
          return {
            currentStepIndex: nextIndex,
            status: isLast ? 'done' : state.status,
            finishedAt: isLast ? Date.now() : state.finishedAt,
          };
        }),
      pause: () =>
        set((state) =>
          state.status === 'running' ? { status: 'paused', pausedAt: Date.now() } : state,
        ),
      resume: () =>
        set((state) => {
          if (state.status !== 'paused' || state.pausedAt === null) return state;
          return {
            status: 'running',
            pausedAt: null,
            pausedDurationMs: state.pausedDurationMs + (Date.now() - state.pausedAt),
          };
        }),
      finish: () => set({ status: 'done', finishedAt: Date.now() }),
      abort: () =>
        set({
          recipe: null,
          startedAt: null,
          pausedAt: null,
          pausedDurationMs: 0,
          finishedAt: null,
          currentStepIndex: 0,
          status: 'idle',
        }),
    }),
    { name: 'coffee-lab:brew-timer' },
  ),
);

export function getElapsedSec(state: BrewTimerState, now: number): number {
  if (state.startedAt === null) return 0;
  const effectiveNow = state.status === 'done' && state.finishedAt ? state.finishedAt : now;
  const pauseOffset =
    state.pausedDurationMs +
    (state.status === 'paused' && state.pausedAt ? effectiveNow - state.pausedAt : 0);
  return Math.max(0, (effectiveNow - state.startedAt - pauseOffset) / 1000);
}

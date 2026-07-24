'use client';

import type { Recipe, RecipeStep } from '@coffee-lab/engine';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerStatus = 'idle' | 'ready' | 'running' | 'paused' | 'done';

/**
 * 実時間の経過を伴わない「即時アクション」ステップ（弁の開閉・攪拌・湯温切替）。
 * これらは atSec 上は幅を持たないため、ユーザーがボタンを押すまでの反応時間を
 * 経過時間としてカウントすると以降のステップ全体が後ろにズレる。
 * 該当ステップの間は自動的にクロックを止める（docs/09 §2.2 の一時停止と同じ仕組みを流用）。
 */
function isInstantStep(kind: RecipeStep['kind']): boolean {
  return kind === 'valve' || kind === 'stir' || kind === 'temperatureChange';
}

type BrewTimerState = {
  recipe: Recipe | null;
  startedAt: number | null;
  pausedAt: number | null;
  pausedDurationMs: number;
  stepFrozenAt: number | null;
  finishedAt: number | null;
  currentStepIndex: number;
  status: TimerStatus;
  /** レシピを読み込んでスタート待ち状態にする。クロックはまだ動かさない（docs/06 S04）。 */
  prepare: (recipe: Recipe) => void;
  /** スタートボタン押下時にクロックを動かし始める。 */
  begin: () => void;
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
      stepFrozenAt: null,
      finishedAt: null,
      currentStepIndex: 0,
      status: 'idle',
      prepare: (recipe) =>
        set({
          recipe,
          startedAt: null,
          pausedAt: null,
          pausedDurationMs: 0,
          stepFrozenAt: null,
          finishedAt: null,
          currentStepIndex: 0,
          status: 'ready',
        }),
      begin: () =>
        set((state) => {
          if (state.status !== 'ready' || !state.recipe) return state;
          const firstStep = state.recipe.steps[0];
          return {
            startedAt: Date.now(),
            stepFrozenAt: firstStep && isInstantStep(firstStep.kind) ? Date.now() : null,
            status: 'running',
          };
        }),
      completeStep: () =>
        set((state) => {
          if (!state.recipe) return state;
          const now = Date.now();
          const pausedDurationMs =
            state.pausedDurationMs + (state.stepFrozenAt !== null ? now - state.stepFrozenAt : 0);
          const nextIndex = state.currentStepIndex + 1;
          const nextStep = state.recipe.steps[nextIndex];
          const isLast = nextIndex >= state.recipe.steps.length;
          return {
            currentStepIndex: nextIndex,
            pausedDurationMs,
            stepFrozenAt: !isLast && nextStep && isInstantStep(nextStep.kind) ? now : null,
            status: isLast ? 'done' : state.status,
            finishedAt: isLast ? now : state.finishedAt,
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
          stepFrozenAt: null,
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
    (state.status === 'paused' && state.pausedAt ? effectiveNow - state.pausedAt : 0) +
    (state.stepFrozenAt !== null ? effectiveNow - state.stepFrozenAt : 0);
  return Math.max(0, (effectiveNow - state.startedAt - pauseOffset) / 1000);
}

import { generateRecipe } from '@coffee-lab/engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getElapsedSec, useBrewTimerStore } from './use-brew-timer';

// HARIO Switch + バランス寄りの好みで「ハイブリッド」モード（valveステップ含む）を生成する
const recipe = generateRecipe({
  bean: { roastLevel: 'medium', process: 'washed' },
  equipment: { dripperId: 'hario-switch' },
  taste: { acidity: 0, sweetness: 0, bitterness: 0, body: 0, clarity: 0 },
  strength: 0,
  targetVolumeMl: 250,
  serveStyle: 'hot',
});

function resetStore() {
  useBrewTimerStore.setState({
    recipe: null,
    startedAt: null,
    pausedAt: null,
    pausedDurationMs: 0,
    stepFrozenAt: null,
    finishedAt: null,
    currentStepIndex: 0,
    status: 'idle',
  });
}

describe('useBrewTimerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prepare() だけではクロックが動かず、begin() を押すまでスタート待ちのまま', () => {
    useBrewTimerStore.getState().prepare(recipe);

    const readyState = useBrewTimerStore.getState();
    expect(readyState.status).toBe('ready');
    expect(readyState.startedAt).toBeNull();

    vi.advanceTimersByTime(60_000);
    expect(getElapsedSec(useBrewTimerStore.getState(), Date.now())).toBe(0);

    useBrewTimerStore.getState().begin();
    const runningState = useBrewTimerStore.getState();
    expect(runningState.status).toBe('running');
    expect(runningState.startedAt).not.toBeNull();
  });

  it('valve等の即時アクションステップで足踏みした時間は経過時間に含めない', () => {
    expect(recipe.steps[0]?.kind).toBe('valve');

    useBrewTimerStore.getState().prepare(recipe);
    useBrewTimerStore.getState().begin();
    // 最初のステップ(valve)で10秒フリーズしたまま足踏み
    vi.advanceTimersByTime(10_000);

    const stateBeforeConfirm = useBrewTimerStore.getState();
    expect(getElapsedSec(stateBeforeConfirm, Date.now())).toBe(0);

    // ユーザーが「弁を開いた」ことを確認 → 次のステップへ
    useBrewTimerStore.getState().completeStep();
    const stateAfterConfirm = useBrewTimerStore.getState();
    expect(getElapsedSec(stateAfterConfirm, Date.now())).toBe(0);

    // 通常ステップ(bloom等)では経過時間が普通にカウントされる
    vi.advanceTimersByTime(5_000);
    const stateDuringNormalStep = useBrewTimerStore.getState();
    expect(getElapsedSec(stateDuringNormalStep, Date.now())).toBeCloseTo(5, 1);
  });

  it('手動の一時停止と即時アクションのフリーズは両方経過時間から除外される', () => {
    useBrewTimerStore.getState().prepare(recipe);
    useBrewTimerStore.getState().begin();
    useBrewTimerStore.getState().completeStep(); // valveステップを抜けてbloomへ

    vi.advanceTimersByTime(3_000);
    useBrewTimerStore.getState().pause();
    vi.advanceTimersByTime(7_000);
    useBrewTimerStore.getState().resume();

    const state = useBrewTimerStore.getState();
    expect(getElapsedSec(state, Date.now())).toBeCloseTo(3, 1);
  });
});

export type GameState = 'menu' | 'shop' | 'playing' | 'paused' | 'gameover';

type StateListener = (state: GameState, prev: GameState) => void;

export class State {
  private current: GameState = 'menu';
  private listeners: StateListener[] = [];

  get value(): GameState {
    return this.current;
  }

  set(next: GameState): void {
    if (next === this.current) return;
    const prev = this.current;
    this.current = next;
    for (const l of this.listeners) l(next, prev);
  }

  onChange(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      const i = this.listeners.indexOf(listener);
      if (i >= 0) this.listeners.splice(i, 1);
    };
  }
}

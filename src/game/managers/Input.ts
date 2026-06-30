export type InputAction = 'left' | 'right' | 'jump' | 'slide';

type Listener = (action: InputAction) => void;

export class Input {
  private listeners: Listener[] = [];
  private keydown = (e: KeyboardEvent) => this.handle(e);
  private active = false;

  attach(): void {
    if (this.active) return;
    window.addEventListener('keydown', this.keydown);
    this.attachTouch();
    this.active = true;
  }

  detach(): void {
    if (!this.active) return;
    window.removeEventListener('keydown', this.keydown);
    this.active = false;
  }

  on(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      const i = this.listeners.indexOf(listener);
      if (i >= 0) this.listeners.splice(i, 1);
    };
  }

  private emit(action: InputAction): void {
    for (const l of this.listeners) l(action);
  }

  private handle(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    switch (key) {
      case 'arrowleft':
      case 'q':
      case 'a':
        this.emit('left'); e.preventDefault(); break;
      case 'arrowright':
      case 'd':
        this.emit('right'); e.preventDefault(); break;
      case 'arrowup':
      case 'z':
      case 'w':
      case ' ':
        this.emit('jump'); e.preventDefault(); break;
      case 'arrowdown':
      case 's':
        this.emit('slide'); e.preventDefault(); break;
    }
  }

  // Swipe controls for touch screens
  private touchStartX = 0;
  private touchStartY = 0;
  private touchActive = false;

  private attachTouch(): void {
    window.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      this.touchStartX = t.clientX;
      this.touchStartY = t.clientY;
      this.touchActive = true;
    }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (!this.touchActive) return;
      this.touchActive = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - this.touchStartX;
      const dy = t.clientY - this.touchStartY;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (Math.max(adx, ady) < 24) return;
      if (adx > ady) this.emit(dx > 0 ? 'right' : 'left');
      else this.emit(dy > 0 ? 'slide' : 'jump');
    }, { passive: true });
  }
}

import type { Game } from '../game/Game';
import { DINOS } from '../game/entities/Dinos';
import type { DinoId } from '../game/managers/Storage';

/**
 * Builds and manages the HTML/Tailwind overlay on top of the 3D canvas:
 * home menu, in-game HUD, shop, pause and game-over screens. Talks to the
 * Game instance for state transitions and reads/writes the Storage save.
 */
export class UI {
  private root: HTMLDivElement;
  private game: Game;

  // screen refs
  private menuEl!: HTMLElement;
  private hudEl!: HTMLElement;
  private shopEl!: HTMLElement;
  private gameoverEl!: HTMLElement;
  private pauseEl!: HTMLElement;

  // dynamic refs
  private hudScore!: HTMLElement;
  private hudBones!: HTMLElement;
  private menuHigh!: HTMLElement;
  private goScore!: HTMLElement;
  private goBones!: HTMLElement;
  private goHigh!: HTMLElement;
  private shopBones!: HTMLElement;
  private muteBtn!: HTMLButtonElement;

  constructor(game: Game, container: HTMLElement) {
    this.game = game;
    this.root = document.createElement('div');
    this.root.className = 'ui-layer';
    container.appendChild(this.root);

    this.build();
    this.bindState();
    this.showMenu();
  }

  private build(): void {
    // Vignette overlay
    const vignette = document.createElement('div');
    vignette.className = 'vignette';
    this.root.appendChild(vignette);

    this.menuEl = this.buildMenu();
    this.hudEl = this.buildHUD();
    this.shopEl = this.buildShop();
    this.gameoverEl = this.buildGameOver();
    this.pauseEl = this.buildPause();

    this.root.append(this.menuEl, this.hudEl, this.shopEl, this.gameoverEl, this.pauseEl);
  }

  private bindState(): void {
    this.game.setCallbacks({
      onRunStats: (s) => {
        this.hudScore.textContent = `${s.score} m`;
        this.hudBones.textContent = `${s.bones}`;
      },
      onGameOver: (s) => {
        this.goScore.textContent = `${s.score} m`;
        this.goBones.textContent = `${s.bones}`;
        const high = this.game.storage.get().highscore;
        this.goHigh.innerHTML = s.newHighscore
          ? `<span class="text-amber-300 glow">Nouveau record ! ${high} m</span>`
          : `Record : ${high} m`;
        this.showGameOver();
      },
    });
  }

  // ── Screen visibility ────────────────────────────────────────────────
  private hideAll(): void {
    for (const el of [this.menuEl, this.hudEl, this.shopEl, this.gameoverEl, this.pauseEl]) {
      el.classList.add('hidden-screen');
    }
  }
  private showMenu(): void {
    this.hideAll();
    this.menuEl.classList.remove('hidden-screen');
    this.menuEl.classList.add('fade-in');
    this.menuHigh.textContent = `${this.game.storage.get().highscore} m`;
  }
  private showHUD(): void {
    this.hideAll();
    this.hudEl.classList.remove('hidden-screen');
  }
  private showShop(): void {
    this.hideAll();
    this.shopEl.classList.remove('hidden-screen');
    this.shopEl.classList.add('fade-in');
    this.refreshShop();
  }
  private showGameOver(): void {
    this.hideAll();
    this.gameoverEl.classList.remove('hidden-screen');
    this.gameoverEl.classList.add('fade-in');
  }

  // ── Menu ─────────────────────────────────────────────────────────────
  private buildMenu(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'absolute inset-0 flex flex-col items-center justify-between py-10';
    el.innerHTML = `
      <div class="text-center mt-10 fade-in">
        <h1 class="title-font text-6xl md:text-7xl font-extrabold text-orange-300 glow tracking-wide">DINO RUNNER</h1>
        <p class="text-orange-200/70 mt-2 text-lg tracking-widest uppercase">Endless Prehistoric Escape</p>
      </div>
      <div class="flex flex-col items-center gap-4 mb-8">
        <div class="panel rounded-xl px-6 py-2 text-center mb-2">
          <span class="text-orange-200/60 text-sm">Meilleur score</span>
          <div class="text-2xl font-extrabold text-amber-200" data-ref="high">0 m</div>
        </div>
        <button data-ref="play" class="btn-primary text-white font-extrabold text-2xl px-16 py-4 rounded-2xl">JOUER</button>
        <button data-ref="shop" class="btn-secondary text-orange-100 font-bold text-lg px-10 py-3 rounded-xl">🦴 Boutique</button>
        <p class="text-orange-100/40 text-sm mt-3 text-center max-w-md">
          <span class="key-hint">←</span><span class="key-hint">→</span> changer de voie ·
          <span class="key-hint">↑</span>/<span class="key-hint">Espace</span> sauter ·
          <span class="key-hint">↓</span> glisser
        </p>
      </div>
    `;
    this.menuHigh = el.querySelector('[data-ref="high"]')!;
    el.querySelector('[data-ref="play"]')!.addEventListener('click', () => this.game.startRun());
    el.querySelector('[data-ref="shop"]')!.addEventListener('click', () => this.game.state.set('shop'));
    return el;
  }

  // ── HUD ──────────────────────────────────────────────────────────────
  private buildHUD(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'absolute inset-0';
    el.innerHTML = `
      <div class="absolute top-4 left-4 hud-pill rounded-xl px-4 py-2 flex items-center gap-2">
        <span class="bone-icon"></span>
        <span class="text-2xl font-extrabold text-amber-200" data-ref="bones">0</span>
      </div>
      <div class="absolute top-4 right-4 hud-pill rounded-xl px-4 py-2 text-right">
        <div class="text-xs text-orange-200/60 uppercase tracking-wider">Distance</div>
        <span class="text-2xl font-extrabold text-orange-100" data-ref="score">0 m</span>
      </div>
      <div class="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
        <button data-ref="pause" class="hud-pill rounded-lg w-10 h-10 text-orange-100 text-lg">⏸</button>
        <button data-ref="mute" class="hud-pill rounded-lg w-10 h-10 text-orange-100 text-lg">🔊</button>
      </div>
    `;
    this.hudScore = el.querySelector('[data-ref="score"]')!;
    this.hudBones = el.querySelector('[data-ref="bones"]')!;
    this.muteBtn = el.querySelector('[data-ref="mute"]')!;
    el.querySelector('[data-ref="pause"]')!.addEventListener('click', () => {
      this.game.pause();
      this.hideAll();
      this.pauseEl.classList.remove('hidden-screen');
    });
    this.muteBtn.addEventListener('click', () => {
      const muted = this.game.sound.toggleMute();
      this.muteBtn.textContent = muted ? '🔇' : '🔊';
    });
    return el;
  }

  // ── Pause ────────────────────────────────────────────────────────────
  private buildPause(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'absolute inset-0 flex items-center justify-center bg-black/40';
    el.innerHTML = `
      <div class="panel rounded-2xl p-8 text-center w-80">
        <h2 class="title-font text-3xl font-extrabold text-orange-200 mb-6">Pause</h2>
        <button data-ref="resume" class="btn-primary text-white font-bold text-xl px-10 py-3 rounded-xl w-full mb-3">Reprendre</button>
        <button data-ref="menu" class="btn-secondary text-orange-100 font-bold px-10 py-3 rounded-xl w-full">Menu principal</button>
      </div>
    `;
    el.querySelector('[data-ref="resume"]')!.addEventListener('click', () => {
      this.game.resume();
      this.showHUD();
    });
    el.querySelector('[data-ref="menu"]')!.addEventListener('click', () => this.game.returnToMenu());
    return el;
  }

  // ── Shop ─────────────────────────────────────────────────────────────
  private buildShop(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'absolute inset-0 flex flex-col bg-black/55 p-4 md:p-8 overflow-auto';
    el.innerHTML = `
      <div class="flex items-center justify-between mb-6 max-w-4xl mx-auto w-full">
        <button data-ref="back" class="btn-secondary text-orange-100 font-bold px-5 py-2 rounded-xl">← Retour</button>
        <h2 class="title-font text-4xl font-extrabold text-orange-300 glow">Boutique</h2>
        <div class="panel rounded-xl px-4 py-2 flex items-center gap-2">
          <span class="bone-icon"></span>
          <span class="text-xl font-extrabold text-amber-200" data-ref="bones">0</span>
        </div>
      </div>
      <div data-ref="grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto w-full"></div>
    `;
    this.shopBones = el.querySelector('[data-ref="bones"]')!;
    el.querySelector('[data-ref="back"]')!.addEventListener('click', () => this.game.state.set('menu'));
    return el;
  }

  private refreshShop(): void {
    const save = this.game.storage.get();
    this.shopBones.textContent = `${save.totalBones}`;
    const grid = this.shopEl.querySelector('[data-ref="grid"]') as HTMLElement;
    grid.innerHTML = '';

    (Object.keys(DINOS) as DinoId[]).forEach((id) => {
      const cfg = DINOS[id];
      const unlocked = save.unlocked.includes(id);
      const equipped = save.equipped === id;
      const card = document.createElement('div');
      card.className = `dino-card panel rounded-2xl p-4 flex flex-col items-center text-center ${unlocked ? '' : 'locked'} ${equipped ? 'equipped' : ''}`;

      const colorHex = '#' + Number(cfg.body).toString(16).padStart(6, '0');
      const accentHex = '#' + Number(cfg.bodyAccent).toString(16).padStart(6, '0');

      card.innerHTML = `
        <div class="w-24 h-24 rounded-xl mb-3 flex items-center justify-center"
             style="background: radial-gradient(circle at 40% 30%, ${colorHex}, ${accentHex});
                    box-shadow: inset 0 2px 8px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3);">
          <span style="font-size:42px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🦖</span>
        </div>
        <h3 class="font-extrabold text-orange-100 text-lg">${cfg.name}</h3>
        <p class="text-orange-200/50 text-xs mt-1 mb-3 leading-snug h-12">${cfg.description}</p>
        <div data-ref="action" class="w-full"></div>
      `;

      const action = card.querySelector('[data-ref="action"]') as HTMLElement;
      if (equipped) {
        action.innerHTML = `<div class="text-amber-300 font-bold py-2">✓ Équipé</div>`;
      } else if (unlocked) {
        const btn = document.createElement('button');
        btn.className = 'btn-secondary text-orange-100 font-bold py-2 rounded-lg w-full';
        btn.textContent = 'Équiper';
        btn.addEventListener('click', () => {
          this.game.storage.equip(id);
          this.game.setDino(id);
          this.refreshShop();
        });
        action.appendChild(btn);
      } else {
        const btn = document.createElement('button');
        const affordable = save.totalBones >= cfg.price;
        btn.className = `font-bold py-2 rounded-lg w-full ${affordable ? 'btn-primary text-white' : 'btn-secondary text-orange-100/50 cursor-not-allowed'}`;
        btn.innerHTML = `🦴 ${cfg.price}`;
        if (affordable) {
          btn.addEventListener('click', () => {
            if (this.game.storage.spendBones(cfg.price)) {
              this.game.storage.unlock(id);
              this.game.storage.equip(id);
              this.game.setDino(id);
              this.refreshShop();
            }
          });
        }
        action.appendChild(btn);
      }
      grid.appendChild(card);
    });
  }

  // ── Game Over ─────────────────────────────────────────────────────────
  private buildGameOver(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'absolute inset-0 flex items-center justify-center bg-black/55';
    el.innerHTML = `
      <div class="panel rounded-3xl p-8 text-center w-96">
        <h2 class="title-font text-5xl font-extrabold text-red-400 glow mb-1">Game Over</h2>
        <p class="text-orange-200/50 mb-6 text-sm" data-ref="high">Record : 0 m</p>
        <div class="flex justify-around mb-6">
          <div>
            <div class="text-xs text-orange-200/60 uppercase tracking-wider">Distance</div>
            <div class="text-3xl font-extrabold text-orange-100" data-ref="score">0 m</div>
          </div>
          <div>
            <div class="text-xs text-orange-200/60 uppercase tracking-wider">Os récoltés</div>
            <div class="text-3xl font-extrabold text-amber-200"><span class="bone-icon"></span><span data-ref="bones">0</span></div>
          </div>
        </div>
        <button data-ref="retry" class="btn-primary text-white font-extrabold text-xl px-10 py-3 rounded-xl w-full mb-3">Recommencer</button>
        <button data-ref="menu" class="btn-secondary text-orange-100 font-bold px-10 py-3 rounded-xl w-full">Retour au menu</button>
      </div>
    `;
    this.goScore = el.querySelector('[data-ref="score"]')!;
    this.goBones = el.querySelector('[data-ref="bones"]')!;
    this.goHigh = el.querySelector('[data-ref="high"]')!;
    el.querySelector('[data-ref="retry"]')!.addEventListener('click', () => this.game.startRun());
    el.querySelector('[data-ref="menu"]')!.addEventListener('click', () => this.game.returnToMenu());
    return el;
  }

  /** Hook this up to game state so screens follow transitions. */
  attachStateSync(): void {
    this.game.state.onChange((next) => {
      switch (next) {
        case 'menu': this.showMenu(); break;
        case 'shop': this.showShop(); break;
        case 'playing': this.showHUD(); break;
        case 'gameover': /* handled by callback */ break;
        case 'paused': /* handled inline */ break;
      }
    });
  }
}

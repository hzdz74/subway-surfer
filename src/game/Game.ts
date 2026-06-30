import * as THREE from 'three';
import {
  MAX_SPEED, SPEED_RAMP, START_SPEED,
} from './constants';
import { Environment } from './Environment';
import { Track } from './Track';
import { Player } from './entities/Player';
import { ProceduralGeneration } from './managers/ProceduralGeneration';
import { resolveCollisions } from './managers/Collision';
import { Input } from './managers/Input';
import { State } from './managers/State';
import { Sound } from './managers/Sound';
import { Storage } from './managers/Storage';
import type { DinoId } from './managers/Storage';

export interface RunStats {
  score: number;
  bones: number;
}

export interface GameCallbacks {
  onRunStats?: (stats: RunStats) => void;
  onGameOver?: (stats: RunStats & { newHighscore: boolean }) => void;
}

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();

  readonly env: Environment;
  readonly track: Track;
  readonly gen: ProceduralGeneration;
  player: Player;

  readonly input = new Input();
  readonly state = new State();
  readonly sound = new Sound();
  readonly storage = new Storage();

  private speed = START_SPEED;
  private distance = 0;
  private runBones = 0;
  private elapsed = 0;
  private callbacks: GameCallbacks = {};
  private rafId = 0;
  private detachInput: (() => void) | null = null;
  private cameraShake = 0;

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 4.2, -7.5);
    this.camera.lookAt(0, 1.5, 8);

    this.env = new Environment(this.scene);
    this.scene.add(this.env.group);

    this.track = new Track();
    this.scene.add(this.track.group);

    this.gen = new ProceduralGeneration();
    this.scene.add(this.gen.group);

    this.player = new Player(this.storage.get().equipped);
    this.scene.add(this.player.group);
    this.player.reset();

    window.addEventListener('resize', this.onResize);

    // Idle menu camera/scene runs even before play.
    this.loop();
  }

  setCallbacks(cb: GameCallbacks): void {
    this.callbacks = cb;
  }

  setDino(id: DinoId): void {
    this.player.setDino(id);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // ── Public control ───────────────────────────────────────────────────
  startRun(): void {
    this.player.setDino(this.storage.get().equipped);
    this.player.reset();
    this.gen.reset();
    this.speed = START_SPEED;
    this.distance = 0;
    this.runBones = 0;
    this.elapsed = 0;
    this.cameraShake = 0;
    this.state.set('playing');
    this.input.attach();
    this.detachInput?.();
    this.detachInput = this.input.on(this.handleInput);
    this.sound.resume();
    this.sound.startRumble();
    this.emitStats();
  }

  pause(): void {
    if (this.state.value === 'playing') this.state.set('paused');
  }
  resume(): void {
    if (this.state.value === 'paused') this.state.set('playing');
  }

  returnToMenu(): void {
    this.state.set('menu');
    this.input.detach();
    this.detachInput?.();
    this.detachInput = null;
    this.sound.stopRumble();
    this.gen.reset();
    this.player.reset();
  }

  private handleInput = (action: 'left' | 'right' | 'jump' | 'slide') => {
    if (this.state.value !== 'playing') return;
    switch (action) {
      case 'left': this.player.moveLane(-1); this.sound.lane(); break;
      case 'right': this.player.moveLane(1); this.sound.lane(); break;
      case 'jump': if (!this.player.jumping) this.sound.jump(); this.player.jump(); break;
      case 'slide': if (!this.player.sliding) this.sound.slide(); this.player.slide(); break;
    }
  };

  private gameOver(): void {
    this.sound.crash();
    this.sound.stopRumble();
    this.cameraShake = 0.6;
    this.input.detach();
    this.detachInput?.();
    this.detachInput = null;
    const score = Math.floor(this.distance);
    const newHigh = this.storage.setHighscoreIfBetter(score);
    this.storage.addBones(this.runBones);
    this.state.set('gameover');
    this.callbacks.onGameOver?.({ score, bones: this.runBones, newHighscore: newHigh });
  }

  private emitStats(): void {
    this.callbacks.onRunStats?.({ score: Math.floor(this.distance), bones: this.runBones });
  }

  // ── Main loop ────────────────────────────────────────────────────────
  private loop = () => {
    this.rafId = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05); // clamp to avoid huge jumps
    const playing = this.state.value === 'playing';

    // Environment always animates for ambience
    this.env.update(dt);

    if (playing) {
      this.elapsed += dt;
      // Linear, progressive speed ramp capped at MAX_SPEED.
      this.speed = Math.min(MAX_SPEED, START_SPEED + this.elapsed * SPEED_RAMP);
      this.distance += this.speed * dt;

      this.track.update(dt, this.speed, this.elapsed);
      this.gen.update(dt, this.speed);
      this.player.update(dt, this.speed);

      const res = resolveCollisions(this.player, this.gen);
      if (res.bonesCollected > 0) {
        this.runBones += res.bonesCollected;
        this.sound.coin();
        this.emitStats();
      }
      if (res.hitObstacle) {
        this.gameOver();
      } else {
        // Update score HUD ~ every frame but throttle emission
        if (Math.floor(this.distance) !== this.lastEmittedScore) {
          this.lastEmittedScore = Math.floor(this.distance);
          this.emitStats();
        }
      }
    } else {
      // Idle ambience: slowly scroll track + spin player on menu
      this.track.update(dt, 6, this.elapsed + dt);
      this.elapsed += dt;
      if (this.state.value === 'menu') {
        this.player.group.rotation.y += dt * 0.6;
      }
    }

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private lastEmittedScore = -1;

  private updateCamera(dt: number): void {
    const playing = this.state.value === 'playing';
    if (playing) {
      // Follow player's lane with smoothing + speed-based pull-back & FOV.
      const targetX = this.player.group.position.x * 0.55;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 6, dt);
      const speedT = (this.speed - START_SPEED) / (MAX_SPEED - START_SPEED);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 4.2 + speedT * 0.6, 4, dt);
      const targetFov = 62 + speedT * 8;
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4, dt);
      this.camera.updateProjectionMatrix();

      // Camera shake on crash
      if (this.cameraShake > 0) {
        this.cameraShake = Math.max(0, this.cameraShake - dt * 1.5);
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      }
      this.camera.lookAt(this.player.group.position.x * 0.3, 1.5, 10);
    } else if (this.state.value === 'menu') {
      // Slow orbit-ish hero shot of the dino
      const a = this.elapsed * 0.25;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, Math.sin(a) * 3.5, 3, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 3.2, 3, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, -6.5, 3, dt);
      this.camera.lookAt(0, 1.4, 0);
    } else {
      // gameover / paused: keep last framing but settle shake
      if (this.cameraShake > 0) {
        this.cameraShake = Math.max(0, this.cameraShake - dt * 1.5);
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      }
      this.camera.lookAt(this.player.group.position.x * 0.3, 1.5, 10);
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    this.input.detach();
    this.renderer.dispose();
  }
}

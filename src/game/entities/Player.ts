import * as THREE from 'three';
import {
  GRAVITY, JUMP_VELOCITY, LANE_SWITCH_DURATION, LANE_X,
  PLAYER_BASE_HEIGHT, PLAYER_SLIDE_HEIGHT, PLAYER_WIDTH, SLIDE_DURATION,
} from '../constants';
import { animateDino, buildDino, DINOS } from './Dinos';
import type { DinoId } from '../managers/Storage';

export class Player {
  public readonly group = new THREE.Group();
  private dino: THREE.Group;
  public lane: 0 | 1 | 2 = 1;
  private targetLane: 0 | 1 | 2 = 1;
  private laneStartX = 0;
  private laneTargetX = 0;
  private laneT = 1;

  public y = 0;
  public vy = 0;
  public jumping = false;
  public sliding = false;
  private slideTimer = 0;
  private elapsed = 0;

  constructor(dinoId: DinoId) {
    this.dino = buildDino(DINOS[dinoId]);
    this.group.add(this.dino);
  }

  setDino(dinoId: DinoId): void {
    this.group.remove(this.dino);
    this.dino = buildDino(DINOS[dinoId]);
    this.group.add(this.dino);
  }

  reset(): void {
    this.lane = 1;
    this.targetLane = 1;
    this.laneStartX = LANE_X[1];
    this.laneTargetX = LANE_X[1];
    this.laneT = 1;
    this.y = 0;
    this.vy = 0;
    this.jumping = false;
    this.sliding = false;
    this.slideTimer = 0;
    this.group.position.set(LANE_X[1], 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
  }

  moveLane(dir: -1 | 1): void {
    const next = this.targetLane + dir;
    if (next < 0 || next > 2) return;
    this.targetLane = next as 0 | 1 | 2;
    this.laneStartX = this.group.position.x;
    this.laneTargetX = LANE_X[this.targetLane];
    this.laneT = 0;
  }

  jump(): void {
    if (this.jumping) return;
    if (this.sliding) {
      this.sliding = false;
      this.slideTimer = 0;
    }
    this.jumping = true;
    this.vy = JUMP_VELOCITY;
  }

  slide(): void {
    if (this.jumping) {
      // Snap downward to land into a slide
      this.vy = -JUMP_VELOCITY;
      return;
    }
    if (this.sliding) return;
    this.sliding = true;
    this.slideTimer = SLIDE_DURATION;
  }

  update(dt: number, speed: number): void {
    this.elapsed += dt;

    // Lane interpolation
    if (this.laneT < 1) {
      this.laneT = Math.min(1, this.laneT + dt / LANE_SWITCH_DURATION);
      const k = easeOutCubic(this.laneT);
      this.group.position.x = THREE.MathUtils.lerp(this.laneStartX, this.laneTargetX, k);
      this.lane = this.laneT >= 1 ? this.targetLane : this.lane;
    }

    // Vertical (jump / gravity)
    if (this.jumping) {
      this.vy -= GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.jumping = false;
      }
    }
    this.group.position.y = this.y;

    // Slide squash
    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.sliding = false;
    }
    const targetScaleY = this.sliding ? PLAYER_SLIDE_HEIGHT / PLAYER_BASE_HEIGHT : 1.0;
    this.dino.scale.y = THREE.MathUtils.damp(this.dino.scale.y, targetScaleY, 14, dt);
    const targetRot = this.sliding ? -0.6 : 0;
    this.dino.rotation.x = THREE.MathUtils.damp(this.dino.rotation.x, targetRot, 12, dt);
    this.dino.position.z = this.sliding ? 0.2 : 0;

    // Mascot face-forward (camera-towards). Dino model is built facing +Z;
    // we want it facing +Z too (away from camera) so it runs into the screen.
    // Apply a slight tilt during jump for life.
    const tilt = this.jumping ? -0.08 : 0;
    this.dino.rotation.x += tilt * 0.5;

    animateDino(this.dino, this.elapsed, speed, this.jumping, this.sliding);
  }

  getAABB(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const x = this.group.position.x;
    const z = this.group.position.z;
    const yBottom = this.group.position.y;
    const height = this.sliding ? PLAYER_SLIDE_HEIGHT : PLAYER_BASE_HEIGHT * 1.7;
    const halfW = PLAYER_WIDTH / 2;
    const halfL = 0.5;
    return {
      min: new THREE.Vector3(x - halfW, yBottom + 0.05, z - halfL),
      max: new THREE.Vector3(x + halfW, yBottom + height, z + halfL),
    };
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

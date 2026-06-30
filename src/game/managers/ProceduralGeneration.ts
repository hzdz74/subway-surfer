import * as THREE from 'three';
import { DESPAWN_DISTANCE_BEHIND, LANE_X, SPAWN_DISTANCE_AHEAD } from '../constants';
import { buildObstacle, type ObstacleInstance, type ObstacleKind } from '../entities/Obstacles';
import { Bone } from '../entities/Bone';

interface ActiveObstacle {
  inst: ObstacleInstance;
  lane: 0 | 1 | 2;
}

const LOW_KINDS: ObstacleKind[] = ['lava', 'log', 'pit'];
const HIGH_KINDS: ObstacleKind[] = ['pterodactyl', 'arch'];
const BLOCK_KINDS: ObstacleKind[] = ['stego', 'triceratops'];

/**
 * Spawns obstacles and bone trails ahead of the player and recycles them
 * once they pass behind. Guarantees at least one safe lane per "row" so the
 * run is always survivable.
 */
export class ProceduralGeneration {
  public readonly group = new THREE.Group();
  public activeObstacles: ActiveObstacle[] = [];
  public activeBones: Bone[] = [];

  private obstaclePool: Map<ObstacleKind, ObstacleInstance[]> = new Map();
  private bonePool: Bone[] = [];

  private nextSpawnZ = 0;
  private distanceTravelled = 0;
  private t = 0;

  reset(): void {
    for (const o of this.activeObstacles) this.recycleObstacle(o);
    for (const b of this.activeBones) this.recycleBone(b);
    this.activeObstacles = [];
    this.activeBones = [];
    this.nextSpawnZ = 40;
    this.distanceTravelled = 0;
    this.t = 0;
  }

  private getObstacle(kind: ObstacleKind): ObstacleInstance {
    const pool = this.obstaclePool.get(kind) ?? [];
    const reused = pool.pop();
    if (reused) {
      reused.mesh.visible = true;
      return reused;
    }
    return buildObstacle(kind);
  }

  private recycleObstacle(o: ActiveObstacle): void {
    o.inst.mesh.visible = false;
    this.group.remove(o.inst.mesh);
    const pool = this.obstaclePool.get(o.inst.kind) ?? [];
    pool.push(o.inst);
    this.obstaclePool.set(o.inst.kind, pool);
  }

  private getBone(): Bone {
    const reused = this.bonePool.pop();
    if (reused) return reused;
    return new Bone();
  }

  private recycleBone(b: Bone): void {
    b.mesh.visible = false;
    this.group.remove(b.mesh);
    this.bonePool.push(b);
  }

  update(dt: number, speed: number): void {
    this.t += dt;
    const dz = speed * dt;
    this.distanceTravelled += dz;
    this.nextSpawnZ -= dz;

    // Move everything toward the camera
    for (const o of this.activeObstacles) {
      o.inst.mesh.position.z -= dz;
      o.inst.update?.(dt, this.t);
    }
    for (const b of this.activeBones) {
      b.mesh.position.z -= dz;
      b.update(dt, this.t);
    }

    // Recycle passed entities
    this.activeObstacles = this.activeObstacles.filter((o) => {
      if (o.inst.mesh.position.z < -DESPAWN_DISTANCE_BEHIND) {
        this.recycleObstacle(o);
        return false;
      }
      return true;
    });
    this.activeBones = this.activeBones.filter((b) => {
      if (b.mesh.position.z < -DESPAWN_DISTANCE_BEHIND || b.collected) {
        this.recycleBone(b);
        return false;
      }
      return true;
    });

    // Spawn new rows until we've filled the look-ahead window
    while (this.nextSpawnZ < SPAWN_DISTANCE_AHEAD) {
      this.spawnRow(this.nextSpawnZ);
      // Difficulty: rows get denser as distance grows
      const gap = THREE.MathUtils.clamp(16 - this.distanceTravelled * 0.002, 9, 16);
      this.nextSpawnZ += gap + Math.random() * 5;
    }
  }

  private spawnRow(z: number): void {
    const difficulty = Math.min(1, this.distanceTravelled / 3000);
    const roll = Math.random();

    // 35% chance of a pure bone wave (breather)
    if (roll < 0.35) {
      this.spawnBoneWave(z);
      return;
    }

    // Decide an obstacle pattern. Always leave at least one free lane.
    const lanes: (0 | 1 | 2)[] = [0, 1, 2];
    const occupy = this.pickOccupiedLanes(difficulty);

    for (const lane of occupy) {
      const kind = this.pickKind(difficulty);
      this.spawnObstacle(kind, lane, z);
    }

    // Place bones on a free lane to reward the correct path
    const freeLanes = lanes.filter((l) => !occupy.includes(l));
    if (freeLanes.length && Math.random() < 0.7) {
      const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
      this.spawnBoneLine(lane, z, 4 + Math.floor(Math.random() * 3));
    }
  }

  private pickOccupiedLanes(difficulty: number): (0 | 1 | 2)[] {
    const r = Math.random();
    // More double-blocks as difficulty rises
    const doubleChance = 0.15 + difficulty * 0.4;
    if (r < doubleChance) {
      // occupy two lanes, leaving one free
      const free = Math.floor(Math.random() * 3) as 0 | 1 | 2;
      return ([0, 1, 2] as (0 | 1 | 2)[]).filter((l) => l !== free);
    }
    // single lane
    return [Math.floor(Math.random() * 3) as 0 | 1 | 2];
  }

  private pickKind(difficulty: number): ObstacleKind {
    const r = Math.random();
    // Distribution: low (jump), high (slide), blockers
    const blockerChance = 0.25 + difficulty * 0.1;
    if (r < blockerChance) return rand(BLOCK_KINDS);
    if (r < blockerChance + 0.35) return rand(HIGH_KINDS);
    return rand(LOW_KINDS);
  }

  private spawnObstacle(kind: ObstacleKind, lane: 0 | 1 | 2, z: number): void {
    const inst = this.getObstacle(kind);
    inst.mesh.position.set(LANE_X[lane], 0, z);
    inst.mesh.rotation.y = 0;
    this.group.add(inst.mesh);
    this.activeObstacles.push({ inst, lane });
  }

  private spawnBoneLine(lane: 0 | 1 | 2, z: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const b = this.getBone();
      b.reset(LANE_X[lane], 1.0, z + i * 1.6);
      this.group.add(b.mesh);
      this.activeBones.push(b);
    }
  }

  private spawnBoneWave(z: number): void {
    // Bones arranged in an arc inviting a jump, across center lane.
    const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
    const count = 6;
    for (let i = 0; i < count; i++) {
      const b = this.getBone();
      const arc = Math.sin((i / (count - 1)) * Math.PI);
      b.reset(LANE_X[lane], 1.0 + arc * 1.6, z + i * 1.5);
      this.group.add(b.mesh);
      this.activeBones.push(b);
    }
  }
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

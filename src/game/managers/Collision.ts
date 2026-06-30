import * as THREE from 'three';
import type { Player } from '../entities/Player';
import type { ProceduralGeneration } from './ProceduralGeneration';
import type { Bone } from '../entities/Bone';

export interface CollisionResult {
  hitObstacle: boolean;
  bonesCollected: number;
}

const COLLECT_RADIUS = 1.0;

/**
 * Resolves collisions for the current frame.
 *
 * Obstacles use AABB overlap, but whether an overlap is *lethal* depends on
 * the player's action vs the obstacle's clearance:
 *  - jumpable: cleared if the player's lower body is above the obstacle top.
 *  - slidable: cleared if the player is sliding (low profile).
 *  - blocker: always lethal when in the same lane and overlapping in Z.
 */
export function resolveCollisions(player: Player, gen: ProceduralGeneration): CollisionResult {
  const result: CollisionResult = { hitObstacle: false, bonesCollected: 0 };
  const pAABB = player.getAABB();
  const px = player.group.position.x;

  for (const o of gen.activeObstacles) {
    const oz = o.inst.mesh.position.z;
    const ox = o.inst.mesh.position.x;
    const c = o.inst.clearance;

    // Z overlap test (player sits near z=0, depth ~0.5)
    const dz = Math.abs(oz);
    if (dz > c.halfDepth + 0.6) continue;

    // X overlap test
    const dx = Math.abs(px - ox);
    if (dx > c.halfWidth + 0.45) continue;

    // We overlap horizontally + in depth. Now decide if it's lethal.
    if (c.blocker) {
      result.hitObstacle = true;
      return result;
    }
    if (c.jumpable) {
      // Cleared if player's feet are above obstacle top.
      if (pAABB.min.y >= c.yMax - 0.05) continue;
      result.hitObstacle = true;
      return result;
    }
    if (c.slidable) {
      // Cleared if player's head is below the obstacle's underside.
      if (player.sliding && pAABB.max.y <= c.yMin + 0.1) continue;
      // Also cleared if somehow jumping over the whole thing (rare).
      if (pAABB.min.y >= c.yMax) continue;
      result.hitObstacle = true;
      return result;
    }
  }

  // Bones — sphere proximity
  const pPos = new THREE.Vector3(px, player.group.position.y + 0.8, 0);
  for (const b of gen.activeBones) {
    if (b.collected) continue;
    const d = distanceXZ(pPos, b.mesh.position) + Math.abs(pPos.y - b.mesh.position.y) * 0.5;
    if (d < COLLECT_RADIUS) {
      b.collect();
      result.bonesCollected++;
    }
  }

  return result;
}

function distanceXZ(a: THREE.Vector3, b: THREE.Vector3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// Re-export for callers that want to animate magnetized bones later.
export type { Bone };

import * as THREE from 'three';

/**
 * A collectible bone. Modeled as a shaft with two rounded knobs at each end
 * (classic cartoon bone). Spins on its own axis and bobs gently.
 */
let sharedGeo: THREE.BufferGeometry | null = null;
let sharedMat: THREE.MeshStandardMaterial | null = null;

function getBoneGeometry(): THREE.BufferGeometry {
  if (sharedGeo) return sharedGeo;
  const parts: THREE.BufferGeometry[] = [];

  const shaft = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 10);
  shaft.rotateZ(Math.PI / 2);
  parts.push(shaft);

  const knobPositions = [
    [-0.3, 0.1, 0], [-0.3, -0.1, 0],
    [0.3, 0.1, 0], [0.3, -0.1, 0],
  ];
  for (const [x, y, z] of knobPositions) {
    const knob = new THREE.SphereGeometry(0.12, 10, 8);
    knob.translate(x, y, z);
    parts.push(knob);
  }

  sharedGeo = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return sharedGeo;
}

function getBoneMaterial(): THREE.MeshStandardMaterial {
  if (sharedMat) return sharedMat;
  sharedMat = new THREE.MeshStandardMaterial({
    color: 0xf3ead0,
    emissive: 0xffcf60,
    emissiveIntensity: 0.25,
    roughness: 0.5,
    metalness: 0.2,
  });
  return sharedMat;
}

/** Minimal geometry merge (positions + normals) to avoid extra deps. */
function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // De-index first so we can size buffers from the *expanded* vertex counts.
  const posArrays: Float32Array[] = [];
  const norArrays: Float32Array[] = [];
  let totalLen = 0;
  for (const g of geos) {
    const ni = g.index ? g.toNonIndexed() : g;
    const pos = ni.attributes.position as THREE.BufferAttribute;
    const nor = ni.attributes.normal as THREE.BufferAttribute | undefined;
    const posArr = pos.array as Float32Array;
    posArrays.push(posArr);
    norArrays.push(nor ? (nor.array as Float32Array) : new Float32Array(posArr.length));
    totalLen += posArr.length;
    if (ni !== g) ni.dispose();
  }

  const positions = new Float32Array(totalLen);
  const normals = new Float32Array(totalLen);
  let offset = 0;
  for (let i = 0; i < posArrays.length; i++) {
    positions.set(posArrays[i], offset);
    normals.set(norArrays[i], offset);
    offset += posArrays[i].length;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return merged;
}

export class Bone {
  public readonly mesh: THREE.Mesh;
  public collected = false;
  private phase: number;

  constructor() {
    this.mesh = new THREE.Mesh(getBoneGeometry(), getBoneMaterial());
    this.mesh.castShadow = true;
    this.phase = Math.random() * Math.PI * 2;
  }

  reset(x: number, y: number, z: number): void {
    this.collected = false;
    this.mesh.visible = true;
    this.mesh.position.set(x, y, z);
    this.mesh.scale.setScalar(1);
  }

  update(dt: number, t: number): void {
    this.mesh.rotation.y += dt * 3;
    this.mesh.position.y += Math.sin(t * 3 + this.phase) * dt * 0.3;
  }

  collect(): void {
    this.collected = true;
    this.mesh.visible = false;
  }
}

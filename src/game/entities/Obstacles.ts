import * as THREE from 'three';

export type ObstacleKind =
  | 'lava'        // low: must JUMP
  | 'log'         // low: must JUMP
  | 'pit'         // low: must JUMP (gap in ground)
  | 'pterodactyl' // high: must SLIDE
  | 'arch'        // high: must SLIDE
  | 'stego'       // blocker: must change lane
  | 'triceratops';// blocker: must change lane

export interface ObstacleClearance {
  /** Cleared by jumping over it. */
  jumpable: boolean;
  /** Cleared by sliding under it. */
  slidable: boolean;
  /** Solid wall — must switch lane (cannot jump/slide through). */
  blocker: boolean;
  /** AABB half extents and center offset (relative to mesh origin at lane). */
  halfWidth: number;
  halfDepth: number;
  yMin: number;
  yMax: number;
}

export interface ObstacleInstance {
  mesh: THREE.Group;
  kind: ObstacleKind;
  clearance: ObstacleClearance;
  update?: (dt: number, t: number) => void;
}

const rockMat = () => new THREE.MeshStandardMaterial({ color: 0x2c1810, roughness: 1, metalness: 0 });
const charMat = () => new THREE.MeshStandardMaterial({ color: 0x12100e, roughness: 1, metalness: 0 });
const lavaMat = () => new THREE.MeshBasicMaterial({ color: 0xff4810 });
const dinoSkin = (c: THREE.ColorRepresentation) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0.05 });

function jumpClear(halfWidth: number, halfDepth: number, yMax: number): ObstacleClearance {
  return { jumpable: true, slidable: false, blocker: false, halfWidth, halfDepth, yMin: 0, yMax };
}
function slideClear(halfWidth: number, halfDepth: number, yMin: number, yMax: number): ObstacleClearance {
  return { jumpable: false, slidable: true, blocker: false, halfWidth, halfDepth, yMin, yMax };
}
function blockClear(halfWidth: number, halfDepth: number, yMax: number): ObstacleClearance {
  return { jumpable: false, slidable: false, blocker: true, halfWidth, halfDepth, yMin: 0, yMax };
}

export function buildObstacle(kind: ObstacleKind): ObstacleInstance {
  switch (kind) {
    case 'lava':       return buildLava();
    case 'log':        return buildLog();
    case 'pit':        return buildPit();
    case 'pterodactyl':return buildPterodactyl();
    case 'arch':       return buildArch();
    case 'stego':      return buildStego();
    case 'triceratops':return buildTriceratops();
  }
}

// ── LOW (jump) ──────────────────────────────────────────────────────────
function buildLava(): ObstacleInstance {
  const g = new THREE.Group();
  const pool = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 1.6), lavaMat());
  pool.position.y = 0.09;
  g.add(pool);
  // crusty rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.18, 8, 20), charMat());
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.12;
  rim.scale.set(1, 0.85, 1);
  g.add(rim);
  // emissive glow light
  const glow = new THREE.PointLight(0xff5010, 2.2, 6, 2);
  glow.position.y = 0.5;
  g.add(glow);
  let t0 = 0;
  return {
    mesh: g, kind: 'lava',
    clearance: jumpClear(0.95, 0.85, 0.5),
    update: (_dt, t) => {
      t0 = t;
      (pool.material as THREE.MeshBasicMaterial).color.setHSL(0.04, 1, 0.4 + Math.sin(t0 * 5) * 0.12);
      glow.intensity = 2 + Math.sin(t0 * 6) * 0.8;
    },
  };
}

function buildLog(): ObstacleInstance {
  const g = new THREE.Group();
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.0, 12), charMat());
  log.rotation.z = Math.PI / 2;
  log.position.y = 0.42;
  log.castShadow = true;
  g.add(log);
  // charred cracks
  const crackMat = new THREE.MeshBasicMaterial({ color: 0xff5212 });
  for (let i = 0; i < 5; i++) {
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.8), crackMat);
    const a = (i / 5) * Math.PI * 2;
    crack.position.set(0, 0.42 + Math.sin(a) * 0.3, 0);
    crack.rotation.z = Math.PI / 2;
    g.add(crack);
  }
  // broken stumps
  for (const s of [-1, 1]) {
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.5, 10), charMat());
    stump.position.set(s * 0.95, 0.25, 0);
    g.add(stump);
  }
  return { mesh: g, kind: 'log', clearance: jumpClear(1.0, 0.5, 0.9) };
}

function buildPit(): ObstacleInstance {
  const g = new THREE.Group();
  // A dark gap with glowing magma at the bottom.
  const hole = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.05, 2.2),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  hole.position.y = -0.02;
  g.add(hole);
  const magma = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 2.0),
    new THREE.MeshBasicMaterial({ color: 0xff3808 }),
  );
  magma.rotation.x = -Math.PI / 2;
  magma.position.y = -1.2;
  g.add(magma);
  // jagged edges
  const edgeMat = charMat();
  for (let i = 0; i < 8; i++) {
    const edge = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 5), edgeMat);
    const a = (i / 8) * Math.PI * 2;
    edge.position.set(Math.cos(a) * 1.0, 0.1, Math.sin(a) * 1.05);
    g.add(edge);
  }
  const glow = new THREE.PointLight(0xff4008, 2, 6, 2);
  glow.position.y = -0.5;
  g.add(glow);
  return { mesh: g, kind: 'pit', clearance: jumpClear(1.0, 1.0, 0.6) };
}

// ── HIGH (slide) ─────────────────────────────────────────────────────────
function buildPterodactyl(): ObstacleInstance {
  const g = new THREE.Group();
  const skin = dinoSkin(0x4a3a2a);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), skin);
  body.scale.set(0.8, 0.8, 1.4);
  body.castShadow = true;
  g.add(body);
  // head + crest + beak
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 8), skin);
  head.rotation.x = Math.PI / 2;
  head.position.set(0, 0.05, 0.6);
  g.add(head);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), skin);
  crest.position.set(0, 0.25, 0.45);
  crest.rotation.x = -0.6;
  g.add(crest);
  // wings
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, side: THREE.DoubleSide, roughness: 0.9 });
  const wingL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.7), wingMat);
  const wingR = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.7), wingMat);
  wingL.position.set(-0.9, 0, 0);
  wingR.position.set(0.9, 0, 0);
  wingL.rotation.y = 0.3;
  wingR.rotation.y = -0.3;
  g.add(wingL, wingR);
  // Hover low so the player must slide under it.
  g.position.y = 1.35;
  let t0 = 0;
  return {
    mesh: g, kind: 'pterodactyl',
    clearance: slideClear(1.1, 0.7, 0.95, 2.2),
    update: (_dt, t) => {
      t0 = t;
      const flap = Math.sin(t0 * 10) * 0.5;
      wingL.rotation.z = flap;
      wingR.rotation.z = -flap;
      g.position.y = 1.35 + Math.sin(t0 * 3) * 0.12;
    },
  };
}

function buildArch(): ObstacleInstance {
  const g = new THREE.Group();
  const mat = rockMat();
  // Two pillars + a low spanning rock the player must slide under.
  for (const s of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.4, 8), mat);
    pillar.position.set(s * 1.0, 1.2, 0);
    pillar.castShadow = true;
    g.add(pillar);
  }
  const span = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.7, 1.0), mat);
  span.position.y = 1.7;
  span.castShadow = true;
  // tilt for "unstable" look
  span.rotation.z = 0.06;
  g.add(span);
  // dangling rubble
  const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3), mat);
  rubble.position.set(0.2, 1.25, 0);
  g.add(rubble);
  return { mesh: g, kind: 'arch', clearance: slideClear(1.35, 0.6, 1.0, 2.4) };
}

// ── BLOCKERS (lane change) ─────────────────────────────────────────────
function buildStego(): ObstacleInstance {
  const g = new THREE.Group();
  const skin = dinoSkin(0x4a6a3a);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), skin);
  body.scale.set(1.0, 0.9, 1.7);
  body.position.y = 1.0;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), skin);
  head.position.set(0, 0.8, 1.5);
  g.add(head);
  // legs
  for (const sx of [-0.45, 0.45]) {
    for (const sz of [-0.8, 0.8]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 1.0, 8), skin);
      leg.position.set(sx, 0.5, sz);
      leg.castShadow = true;
      g.add(leg);
    }
  }
  // dorsal plates
  const plateMat = dinoSkin(0x7a4a2a);
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const plate = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.6 + Math.sin(t * Math.PI) * 0.3, 4), plateMat);
    plate.position.set((i % 2 === 0 ? 0.12 : -0.12), 1.7, -1.2 + t * 2.4);
    g.add(plate);
  }
  // tail spikes (thagomizer)
  for (let i = 0; i < 4; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 6), plateMat);
    const a = (i / 4) * Math.PI;
    spike.position.set(Math.cos(a) * 0.2, 0.9 + Math.sin(a) * 0.2, -1.6);
    spike.rotation.z = a;
    g.add(spike);
  }
  return { mesh: g, kind: 'stego', clearance: blockClear(1.0, 1.6, 2.2) };
}

function buildTriceratops(): ObstacleInstance {
  const g = new THREE.Group();
  const skin = dinoSkin(0x8a5a3a);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), skin);
  body.scale.set(1.0, 0.95, 1.6);
  body.position.y = 1.0;
  body.castShadow = true;
  g.add(body);
  // big head with frill
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), skin);
  head.scale.set(1, 0.9, 1.2);
  head.position.set(0, 1.0, 1.4);
  g.add(head);
  const frill = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.15, 16, 1, false, -Math.PI / 2, Math.PI), dinoSkin(0x6a4226));
  frill.rotation.set(Math.PI / 2, 0, 0);
  frill.position.set(0, 1.3, 1.0);
  g.add(frill);
  // horns
  const hornMat = dinoSkin(0xc7b08a);
  const noseHorn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 8), hornMat);
  noseHorn.position.set(0, 1.1, 2.0);
  noseHorn.rotation.x = 0.5;
  g.add(noseHorn);
  for (const s of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.8, 8), hornMat);
    brow.position.set(s * 0.3, 1.4, 1.6);
    brow.rotation.x = 0.3;
    g.add(brow);
  }
  // legs
  for (const sx of [-0.5, 0.5]) {
    for (const sz of [-0.7, 0.7]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 1.0, 8), skin);
      leg.position.set(sx, 0.5, sz);
      leg.castShadow = true;
      g.add(leg);
    }
  }
  return { mesh: g, kind: 'triceratops', clearance: blockClear(1.0, 1.5, 2.4) };
}

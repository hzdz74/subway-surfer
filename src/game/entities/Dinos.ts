import * as THREE from 'three';
import type { DinoId } from '../managers/Storage';

export interface DinoConfig {
  id: DinoId;
  name: string;
  description: string;
  price: number;
  body: THREE.ColorRepresentation;
  bodyAccent: THREE.ColorRepresentation;
  belly: THREE.ColorRepresentation;
  scale: number;
  hasFrill?: boolean;       // Triceratops collar
  hasSail?: boolean;        // Spinosaurus sail
  hasHornNose?: boolean;    // Triceratops nose horn
  hasSickleClaw?: boolean;  // Velociraptor claw
  legLength?: number;
  armScale?: number;
  tailLength?: number;
  snoutLength?: number;
}

export const DINOS: Record<DinoId, DinoConfig> = {
  'baby-trex': {
    id: 'baby-trex',
    name: 'Bébé T-Rex',
    description: 'Le prédateur emblématique. Gueule large, petits bras, rugissement intimidant.',
    price: 0,
    body: 0x6f7a3a,
    bodyAccent: 0x3a4220,
    belly: 0xd9c98a,
    scale: 1.0,
    legLength: 1.0,
    armScale: 0.45,
    tailLength: 1.0,
    snoutLength: 1.0,
  },
  'baby-triceratops': {
    id: 'baby-triceratops',
    name: 'Bébé Tricératops',
    description: 'Herbivore robuste à la collerette osseuse et trois cornes.',
    price: 100,
    body: 0x8b6a3f,
    bodyAccent: 0x4d3a22,
    belly: 0xc7b08a,
    scale: 1.05,
    hasFrill: true,
    hasHornNose: true,
    legLength: 0.9,
    armScale: 0.9,
    tailLength: 0.7,
    snoutLength: 1.15,
  },
  'baby-velociraptor': {
    id: 'baby-velociraptor',
    name: 'Bébé Vélociraptor',
    description: 'Rapide, agile, plumes sombres et redoutable griffe en faucille.',
    price: 250,
    body: 0x3b3a4a,
    bodyAccent: 0x14141c,
    belly: 0x9aa1b0,
    scale: 0.9,
    hasSickleClaw: true,
    legLength: 1.15,
    armScale: 0.7,
    tailLength: 1.25,
    snoutLength: 0.95,
  },
  'baby-spinosaurus': {
    id: 'baby-spinosaurus',
    name: 'Bébé Spinosaure',
    description: 'Géant semi-aquatique, voile dorsale spectaculaire.',
    price: 500,
    body: 0x2f5a6e,
    bodyAccent: 0x123040,
    belly: 0xc9d8df,
    scale: 1.1,
    hasSail: true,
    legLength: 1.05,
    armScale: 0.7,
    tailLength: 1.35,
    snoutLength: 1.4,
  },
};

function skinMat(color: THREE.ColorRepresentation, rough = 0.85): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: 0.05,
    flatShading: false,
  });
}

/**
 * Build a parametric baby dinosaur. Origin is at the feet (y=0).
 * Faces +Z (forward = camera away). Returns a Group with named subparts
 * so animations can target them.
 */
export function buildDino(cfg: DinoConfig): THREE.Group {
  const g = new THREE.Group();
  g.name = `dino-${cfg.id}`;

  const bodyMat = skinMat(cfg.body);
  const accentMat = skinMat(cfg.bodyAccent);
  const bellyMat = skinMat(cfg.belly, 0.9);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfff7c0, emissive: 0x442200, emissiveIntensity: 0.4, roughness: 0.4 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x080404, roughness: 0.2 });
  const clawMat = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.35, metalness: 0.2 });

  const legLen = (cfg.legLength ?? 1) * 0.55;
  const armScale = cfg.armScale ?? 0.5;
  const tailLen = (cfg.tailLength ?? 1) * 1.4;
  const snoutLen = (cfg.snoutLength ?? 1) * 0.55;

  // ── Pelvis / torso ────────────────────────────────────────────────────
  const torso = new THREE.Group();
  torso.position.y = legLen + 0.45;
  g.add(torso);

  const bodyGeo = new THREE.SphereGeometry(0.55, 18, 14);
  bodyGeo.scale(1.0, 0.85, 1.4); // ellipsoid: longer Z (body length)
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  torso.add(body);

  // Belly underside
  const bellyGeo = new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.45);
  bellyGeo.scale(0.95, 0.7, 1.35);
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.position.y = -0.05;
  belly.castShadow = true;
  torso.add(belly);

  // Back stripe / accent
  const back = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    accentMat,
  );
  back.scale.set(0.5, 0.3, 1.7);
  back.position.set(0, 0.35, 0.05);
  torso.add(back);

  // ── Sail (Spinosaurus) ────────────────────────────────────────────────
  if (cfg.hasSail) {
    const sailGeo = new THREE.BoxGeometry(0.08, 0.95, 1.4);
    const sail = new THREE.Mesh(sailGeo, accentMat);
    sail.position.set(0, 0.75, 0.1);
    sail.castShadow = true;
    torso.add(sail);
    const sailHL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 1.1), bellyMat);
    sailHL.position.set(0, 0.7, 0.1);
    torso.add(sailHL);
  }

  // ── Head ──────────────────────────────────────────────────────────────
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.6, 0.7);
  torso.add(head);

  const skullGeo = new THREE.SphereGeometry(0.32, 16, 12);
  skullGeo.scale(0.95, 0.95, 1.1);
  const skull = new THREE.Mesh(skullGeo, bodyMat);
  skull.castShadow = true;
  head.add(skull);

  // Snout
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.28, snoutLen),
    bodyMat,
  );
  snout.position.set(0, -0.05, snoutLen / 2 + 0.18);
  snout.castShadow = true;
  head.add(snout);

  // Lower jaw (slight gap)
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.1, snoutLen * 0.95),
    bellyMat,
  );
  jaw.position.set(0, -0.16, snoutLen / 2 + 0.18);
  head.add(jaw);

  // Teeth
  const teethGeo = new THREE.BoxGeometry(0.32, 0.04, snoutLen * 0.9);
  const teeth = new THREE.Mesh(teethGeo, new THREE.MeshStandardMaterial({ color: 0xf5ecd6, roughness: 0.5 }));
  teeth.position.set(0, -0.1, snoutLen / 2 + 0.18);
  head.add(teeth);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.07, 10, 8);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.18, 0.1, 0.18);
  eyeR.position.set(0.18, 0.1, 0.18);
  head.add(eyeL, eyeR);
  const pupGeo = new THREE.SphereGeometry(0.03, 8, 6);
  const pupL = new THREE.Mesh(pupGeo, pupilMat);
  const pupR = new THREE.Mesh(pupGeo, pupilMat);
  pupL.position.set(-0.18, 0.1, 0.245);
  pupR.position.set(0.18, 0.1, 0.245);
  head.add(pupL, pupR);

  // Nose horn (Triceratops)
  if (cfg.hasHornNose) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 8), bellyMat);
    horn.position.set(0, 0.05, snoutLen + 0.05);
    horn.rotation.x = -0.3;
    head.add(horn);
    // Brow horns
    const browL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 8), bellyMat);
    const browR = browL.clone();
    browL.position.set(-0.18, 0.28, 0.05);
    browR.position.set(0.18, 0.28, 0.05);
    browL.rotation.x = -0.2;
    browR.rotation.x = -0.2;
    head.add(browL, browR);
  }

  // Frill (Triceratops)
  if (cfg.hasFrill) {
    const frillGeo = new THREE.CylinderGeometry(0.6, 0.45, 0.1, 16, 1, false, -Math.PI / 2, Math.PI);
    const frill = new THREE.Mesh(frillGeo, accentMat);
    frill.rotation.x = Math.PI / 2;
    frill.rotation.y = Math.PI / 2;
    frill.position.set(0, 0.25, -0.18);
    frill.scale.set(1, 1.2, 1);
    head.add(frill);
  }

  // ── Neck ──────────────────────────────────────────────────────────────
  const neckGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.45, 12);
  const neck = new THREE.Mesh(neckGeo, bodyMat);
  neck.rotation.x = -0.4;
  neck.position.set(0, 0.4, 0.45);
  neck.castShadow = true;
  torso.add(neck);

  // ── Tail ──────────────────────────────────────────────────────────────
  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.set(0, 0.1, -0.55);
  torso.add(tail);
  let prevTailR = 0.28;
  const segs = 6;
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const r0 = prevTailR;
    const r1 = THREE.MathUtils.lerp(0.28, 0.05, (i + 1) / segs);
    const segLen = tailLen / segs;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen, 10), bodyMat);
    seg.rotation.x = Math.PI / 2 + 0.05;
    seg.position.set(0, -t * 0.05, -i * segLen - segLen / 2);
    seg.castShadow = true;
    tail.add(seg);
    prevTailR = r1;
  }

  // ── Legs ──────────────────────────────────────────────────────────────
  const legGroupL = new THREE.Group(); legGroupL.name = 'legL';
  const legGroupR = new THREE.Group(); legGroupR.name = 'legR';
  legGroupL.position.set(-0.32, legLen, 0.1);
  legGroupR.position.set(0.32, legLen, 0.1);
  g.add(legGroupL, legGroupR);

  function buildLeg(group: THREE.Group, mirror = false) {
    // thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, legLen * 0.55, 10), bodyMat);
    thigh.position.y = -legLen * 0.27;
    thigh.castShadow = true;
    group.add(thigh);
    // shin
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, legLen * 0.55, 10), bodyMat);
    shin.position.set(0, -legLen * 0.78, 0.05);
    shin.castShadow = true;
    group.add(shin);
    // foot
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.4), bodyMat);
    foot.position.set(0, -legLen * 1.02, 0.12);
    foot.castShadow = true;
    group.add(foot);
    // claws
    for (let i = -1; i <= 1; i++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), clawMat);
      claw.position.set(i * 0.07, -legLen * 1.05, 0.3);
      claw.rotation.x = Math.PI / 2;
      group.add(claw);
    }
    // Velociraptor sickle claw
    if (cfg.hasSickleClaw) {
      const sickle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 12, Math.PI), clawMat);
      sickle.position.set(0, -legLen * 0.95, 0.18);
      sickle.rotation.set(Math.PI / 2, mirror ? Math.PI : 0, 0);
      group.add(sickle);
    }
  }
  buildLeg(legGroupL, false);
  buildLeg(legGroupR, true);

  // ── Arms ──────────────────────────────────────────────────────────────
  const armGroupL = new THREE.Group(); armGroupL.name = 'armL';
  const armGroupR = new THREE.Group(); armGroupR.name = 'armR';
  armGroupL.position.set(-0.42, legLen + 0.55, 0.35);
  armGroupR.position.set(0.42, legLen + 0.55, 0.35);
  g.add(armGroupL, armGroupR);

  function buildArm(group: THREE.Group) {
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.35 * armScale, 8), bodyMat);
    upper.position.y = -0.18 * armScale;
    upper.castShadow = true;
    group.add(upper);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.3 * armScale, 8), bodyMat);
    fore.position.set(0, -0.42 * armScale, 0.06);
    fore.castShadow = true;
    group.add(fore);
    // tiny claws
    for (let i = -1; i <= 1; i++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), clawMat);
      claw.position.set(i * 0.04, -0.6 * armScale, 0.12);
      claw.rotation.x = Math.PI / 2;
      group.add(claw);
    }
    group.rotation.x = 0.4;
  }
  buildArm(armGroupL);
  buildArm(armGroupR);

  // Apply scale at the end
  g.scale.setScalar(cfg.scale);
  return g;
}

/**
 * Run / jump / slide animation update. Pass total elapsed time and
 * boolean states. Drives leg cycle, head bob, tail sway, arm pump.
 */
export function animateDino(dino: THREE.Group, t: number, speed: number, jumping: boolean, sliding: boolean): void {
  const cycle = t * speed * 0.5;
  const legL = dino.getObjectByName('legL') as THREE.Group | undefined;
  const legR = dino.getObjectByName('legR') as THREE.Group | undefined;
  const armL = dino.getObjectByName('armL') as THREE.Group | undefined;
  const armR = dino.getObjectByName('armR') as THREE.Group | undefined;
  const head = dino.getObjectByName('head') as THREE.Group | undefined;
  const tail = dino.getObjectByName('tail') as THREE.Group | undefined;

  if (jumping) {
    if (legL) legL.rotation.x = -0.4;
    if (legR) legR.rotation.x = -0.4;
    if (armL) armL.rotation.x = -0.6;
    if (armR) armR.rotation.x = -0.6;
  } else if (sliding) {
    if (legL) legL.rotation.x = 0.9;
    if (legR) legR.rotation.x = 0.9;
    if (armL) armL.rotation.x = 1.0;
    if (armR) armR.rotation.x = 1.0;
  } else {
    const phase = Math.sin(cycle * 6);
    if (legL) legL.rotation.x = phase * 0.7;
    if (legR) legR.rotation.x = -phase * 0.7;
    if (armL) armL.rotation.x = 0.4 - phase * 0.4;
    if (armR) armR.rotation.x = 0.4 + phase * 0.4;
  }

  if (head) {
    head.rotation.y = Math.sin(cycle * 3) * 0.08;
    head.rotation.x = -0.05 + Math.sin(cycle * 6) * 0.04;
  }
  if (tail) {
    tail.rotation.y = Math.sin(cycle * 5) * 0.35;
  }
}

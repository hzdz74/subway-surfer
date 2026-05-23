'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { AnatomyLayer, Gender } from '@/types';
import { BODY_SPECS, LAYER_MATERIALS, buildTorsoProfile, BodySpec } from '@/lib/bodySpec';

type LayerMat = (typeof LAYER_MATERIALS)[keyof typeof LAYER_MATERIALS];

interface SkinMaterialProps {
  mat: LayerMat;
  highlighted?: boolean;
  hovered?: boolean;
}

function SkinMat({ mat, highlighted, hovered }: SkinMaterialProps) {
  const c = highlighted ? '#38bdf8' : hovered ? '#7dd3fc' : mat.body;
  const e = highlighted ? '#0369a1' : hovered ? '#0284c7' : mat.emissive;
  const ei = highlighted ? 0.45 : hovered ? 0.25 : mat.emissiveIntensity;

  // Read extended PBR fields (present in new palette, fallback to safe defaults)
  const extMat = mat as LayerMat & {
    sheen?: number; sheenRoughness?: number; sheenColor?: string;
    clearcoat?: number; clearcoatRoughness?: number;
  };

  return (
    <meshPhysicalMaterial
      color={c}
      emissive={e}
      emissiveIntensity={ei}
      metalness={mat.metalness}
      roughness={mat.roughness}
      transparent={mat.opacity < 1}
      opacity={mat.opacity}
      side={mat.opacity < 1 ? THREE.DoubleSide : THREE.FrontSide}
      depthWrite={mat.opacity >= 1}
      clearcoat={extMat.clearcoat ?? 0.08}
      clearcoatRoughness={extMat.clearcoatRoughness ?? 0.5}
      sheen={extMat.sheen ?? 0.15}
      sheenRoughness={extMat.sheenRoughness ?? 0.6}
      sheenColor={new THREE.Color(extMat.sheenColor ?? '#ffddcc')}
    />
  );
}

interface ZoneProps {
  zoneId: string;
  selectedId: string | null;
  onSelect: (id: string, p: THREE.Vector3) => void;
  children: React.ReactNode;
}

function Zone({ zoneId, selectedId, onSelect, children }: ZoneProps) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const selected = selectedId === zoneId;

  useFrame(() => {
    if (!ref.current) return;
    const target = selected ? 1.04 : hovered ? 1.02 : 1;
    const lerp = 0.1;
    ref.current.scale.x += (target - ref.current.scale.x) * lerp;
    ref.current.scale.y += (target - ref.current.scale.y) * lerp;
    ref.current.scale.z += (target - ref.current.scale.z) * lerp;
  });

  // Inject hovered/selected state into children via React.cloneElement is brittle.
  // Instead, we use CSS-like context via the closest Zone — we propagate via prop drilling on the parent group.
  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(zoneId, e.point);
      }}
      userData={{ zoneId, hovered, selected }}
    >
      {children}
    </group>
  );
}

// ============================================================
// HEAD
// ============================================================
function Head({ spec, layer, gender, isSel, isHov }: { spec: BodySpec; layer: AnatomyLayer; gender: Gender; isSel: boolean; isHov: boolean }) {
  const mat = LAYER_MATERIALS[layer];
  const headCY = (spec.topHead + spec.chin) / 2;
  const skullScale = useMemo(() => new THREE.Vector3(spec.headWidth, spec.headHeight * 0.55, spec.headDepth), [spec]);
  const jawScale = useMemo(() => new THREE.Vector3(spec.headWidth * 0.85, spec.headHeight * 0.35, spec.headDepth * 0.85), [spec]);

  return (
    <group>
      {/* Cranium (upper skull) */}
      <mesh position={[0, headCY + spec.headHeight * 0.18, 0]} scale={skullScale} castShadow>
        <sphereGeometry args={[1, 48, 48]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Jaw / chin area */}
      <mesh position={[0, headCY - spec.headHeight * 0.2, spec.headDepth * 0.05]} scale={jawScale} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Brow ridge */}
      {layer === 'skin' && (
        <mesh position={[0, headCY + spec.headHeight * 0.1, spec.headDepth * 0.7]} scale={[spec.headWidth * 0.9, spec.headHeight * 0.06, spec.headDepth * 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={mat.accent} roughness={0.6} />
        </mesh>
      )}

      {/* Eyes */}
      {layer !== 'skeleton' && (
        <>
          <mesh position={[-spec.headWidth * 0.4, headCY + spec.headHeight * 0.05, spec.headDepth * 0.78]}>
            <sphereGeometry args={[spec.headWidth * 0.16, 16, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          <mesh position={[-spec.headWidth * 0.4, headCY + spec.headHeight * 0.05, spec.headDepth * 0.88]}>
            <sphereGeometry args={[spec.headWidth * 0.07, 12, 12]} />
            <meshStandardMaterial color="#4a3220" roughness={0.3} />
          </mesh>
          <mesh position={[-spec.headWidth * 0.4, headCY + spec.headHeight * 0.05, spec.headDepth * 0.92]}>
            <sphereGeometry args={[spec.headWidth * 0.025, 8, 8]} />
            <meshStandardMaterial color="#000" />
          </mesh>

          <mesh position={[spec.headWidth * 0.4, headCY + spec.headHeight * 0.05, spec.headDepth * 0.78]}>
            <sphereGeometry args={[spec.headWidth * 0.16, 16, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          <mesh position={[spec.headWidth * 0.4, headCY + spec.headHeight * 0.05, spec.headDepth * 0.88]}>
            <sphereGeometry args={[spec.headWidth * 0.07, 12, 12]} />
            <meshStandardMaterial color="#4a3220" roughness={0.3} />
          </mesh>
          <mesh position={[spec.headWidth * 0.4, headCY + spec.headHeight * 0.05, spec.headDepth * 0.92]}>
            <sphereGeometry args={[spec.headWidth * 0.025, 8, 8]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        </>
      )}

      {/* Nose */}
      <mesh position={[0, headCY - spec.headHeight * 0.02, spec.headDepth * 0.95]} rotation={[0, 0, 0]}>
        <coneGeometry args={[spec.headWidth * 0.1, spec.headHeight * 0.25, 8]} />
        <meshStandardMaterial color={mat.accent} roughness={0.55} />
      </mesh>

      {/* Mouth */}
      {layer === 'skin' && (
        <mesh position={[0, headCY - spec.headHeight * 0.22, spec.headDepth * 0.82]} scale={[spec.headWidth * 0.4, spec.headHeight * 0.04, spec.headDepth * 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#a85048" roughness={0.4} />
        </mesh>
      )}

      {/* Ears */}
      <mesh position={[-spec.headWidth * 0.95, headCY + spec.headHeight * 0.0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[spec.headWidth * 0.12, spec.headWidth * 0.05, 8, 12]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>
      <mesh position={[spec.headWidth * 0.95, headCY + spec.headHeight * 0.0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[spec.headWidth * 0.12, spec.headWidth * 0.05, 8, 12]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Hair */}
      {layer !== 'skeleton' && <Hair spec={spec} gender={gender} headCY={headCY} />}
    </group>
  );
}

function Hair({ spec, gender, headCY }: { spec: BodySpec; gender: Gender; headCY: number }) {
  if (gender === 'male') {
    return (
      <group>
        {/* Short hair cap */}
        <mesh position={[0, headCY + spec.headHeight * 0.35, -spec.headDepth * 0.05]} scale={[spec.headWidth * 1.05, spec.headHeight * 0.5, spec.headDepth * 1.05]}>
          <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          <meshStandardMaterial color={spec.hairColor} roughness={0.95} metalness={0.05} />
        </mesh>
      </group>
    );
  }
  // Female: long hair
  return (
    <group>
      {/* Top hair cap */}
      <mesh position={[0, headCY + spec.headHeight * 0.32, -spec.headDepth * 0.05]} scale={[spec.headWidth * 1.12, spec.headHeight * 0.55, spec.headDepth * 1.15]}>
        <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
        <meshStandardMaterial color={spec.hairColor} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Long hair behind shoulders */}
      <mesh position={[0, headCY - spec.headHeight * 0.6, -spec.headDepth * 0.5]} scale={[spec.headWidth * 1.3, spec.headHeight * 2.5, spec.headDepth * 0.5]}>
        <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
        <meshStandardMaterial color={spec.hairColor} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Side fringe */}
      <mesh position={[-spec.headWidth * 0.6, headCY + spec.headHeight * 0.1, spec.headDepth * 0.4]} rotation={[0, 0, 0.4]} scale={[spec.headWidth * 0.35, spec.headHeight * 0.5, spec.headDepth * 0.3]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={spec.hairColor} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ============================================================
// NECK
// ============================================================
function Neck({ spec, layer, isSel, isHov }: { spec: BodySpec; layer: AnatomyLayer; isSel: boolean; isHov: boolean }) {
  const mat = LAYER_MATERIALS[layer];
  const cy = (spec.chin + spec.neckBase) / 2;
  const h = spec.chin - spec.neckBase;
  return (
    <group>
      <mesh position={[0, cy, 0]} castShadow>
        <cylinderGeometry args={[spec.neckRadius * 0.85, spec.neckRadius * 1.05, h, 24]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>
      {/* Trachea suggestion */}
      {layer === 'skin' && (
        <mesh position={[0, cy, spec.neckRadius * 0.7]} scale={[spec.neckRadius * 0.3, h * 0.7, spec.neckRadius * 0.15]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color={mat.detail} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ============================================================
// TORSO (Lathe profile + chest/bust)
// ============================================================
function Torso({ spec, layer, gender, isSel, isHov, zone }: { spec: BodySpec; layer: AnatomyLayer; gender: Gender; isSel: boolean; isHov: boolean; zone: 'chest' | 'abdomen' }) {
  const mat = LAYER_MATERIALS[layer];
  const profile = useMemo(() => buildTorsoProfile(spec), [spec]);

  return (
    <group position={[0, spec.hipY, 0]}>
      {/* Main torso lathe */}
      <mesh castShadow scale={[1, 1, 0.78]}>
        <latheGeometry args={[profile, 48]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Chest definition */}
      {gender === 'male' && layer === 'skin' && (
        <>
          {/* Pectorals */}
          <mesh position={[-spec.chestWidth * 0.22, spec.chestY - spec.hipY - 0.04, spec.chestDepth * 0.78]} scale={[spec.chestWidth * 0.22, 0.06, 0.07]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color={mat.body} roughness={0.55} />
          </mesh>
          <mesh position={[spec.chestWidth * 0.22, spec.chestY - spec.hipY - 0.04, spec.chestDepth * 0.78]} scale={[spec.chestWidth * 0.22, 0.06, 0.07]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color={mat.body} roughness={0.55} />
          </mesh>
        </>
      )}

      {/* Female bust */}
      {gender === 'female' && spec.bustSize > 0 && (
        <>
          <mesh position={[-spec.chestWidth * 0.28, spec.bustY - spec.hipY, spec.chestDepth * 0.75]}>
            <sphereGeometry args={[spec.bustSize, 24, 24]} />
            <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
          </mesh>
          <mesh position={[spec.chestWidth * 0.28, spec.bustY - spec.hipY, spec.chestDepth * 0.75]}>
            <sphereGeometry args={[spec.bustSize, 24, 24]} />
            <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
          </mesh>
        </>
      )}

      {/* Abs definition (subtle) */}
      {gender === 'male' && layer === 'skin' && spec.muscleDefinition > 0.5 && (
        <>
          {[0, 1, 2].map((row) => (
            <group key={row}>
              <mesh position={[-spec.waistWidth * 0.18, spec.bustY - spec.hipY - 0.15 - row * 0.08, spec.waistDepth * 0.75]} scale={[0.04, 0.025, 0.015]}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial color={mat.accent} roughness={0.6} />
              </mesh>
              <mesh position={[spec.waistWidth * 0.18, spec.bustY - spec.hipY - 0.15 - row * 0.08, spec.waistDepth * 0.75]} scale={[0.04, 0.025, 0.015]}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial color={mat.accent} roughness={0.6} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {/* Back muscles definition (subtle) */}
      {layer === 'muscle' && (
        <mesh position={[0, spec.chestY - spec.hipY, -spec.chestDepth * 0.55]} scale={[spec.chestWidth * 0.6, 0.15, spec.chestDepth * 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={mat.accent} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ============================================================
// SHOULDER + ARM
// ============================================================
function Arm({ spec, layer, side, isSel, isHov }: { spec: BodySpec; layer: AnatomyLayer; side: 'left' | 'right'; isSel: boolean; isHov: boolean }) {
  const mat = LAYER_MATERIALS[layer];
  const dir = side === 'left' ? -1 : 1;
  const shoulderX = dir * spec.shoulderWidth * 0.5;
  const shoulderY = spec.shoulderY - 0.02;
  const armStartY = shoulderY - 0.05;

  return (
    <group>
      {/* Deltoid (shoulder muscle) */}
      <mesh position={[shoulderX, shoulderY, 0]} castShadow>
        <sphereGeometry args={[spec.upperArmRadius * 1.6, 24, 24]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Upper arm */}
      <mesh position={[shoulderX + dir * 0.01, armStartY - spec.upperArmLength * 0.5, 0]} rotation={[0, 0, dir * 0.05]} castShadow>
        <capsuleGeometry args={[spec.upperArmRadius, spec.upperArmLength * 0.9, 8, 20]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Bicep bump (muscle definition) */}
      {layer === 'muscle' && (
        <mesh position={[shoulderX + dir * 0.02, armStartY - spec.upperArmLength * 0.35, 0.02]} scale={[spec.upperArmRadius * 0.9, spec.upperArmLength * 0.35, spec.upperArmRadius * 0.7]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={mat.accent} roughness={0.5} />
        </mesh>
      )}

      {/* Elbow */}
      <mesh position={[shoulderX + dir * 0.02, armStartY - spec.upperArmLength, 0]} castShadow>
        <sphereGeometry args={[spec.upperArmRadius * 0.95, 20, 20]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Forearm */}
      <mesh position={[shoulderX + dir * 0.03, armStartY - spec.upperArmLength - spec.forearmLength * 0.5, 0]} castShadow>
        <capsuleGeometry args={[spec.forearmRadius, spec.forearmLength * 0.9, 8, 20]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Wrist */}
      <mesh position={[shoulderX + dir * 0.04, armStartY - spec.upperArmLength - spec.forearmLength, 0]} castShadow>
        <sphereGeometry args={[spec.wristRadius, 16, 16]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Hand (palm) */}
      <mesh position={[shoulderX + dir * 0.04, armStartY - spec.upperArmLength - spec.forearmLength - spec.handLength * 0.4, 0]} scale={[spec.wristRadius * 1.1, spec.handLength * 0.5, spec.wristRadius * 1.5]} castShadow>
        <sphereGeometry args={[1, 20, 20]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Fingers (4 capsules) */}
      {[-1.5, -0.5, 0.5, 1.5].map((off, i) => {
        const fingerLen = spec.handLength * (i === 0 ? 0.32 : i === 3 ? 0.3 : 0.4);
        return (
          <mesh
            key={i}
            position={[
              shoulderX + dir * 0.04 + off * spec.wristRadius * 0.4,
              armStartY - spec.upperArmLength - spec.forearmLength - spec.handLength * 0.75 - fingerLen * 0.5 + spec.handLength * 0.25,
              0,
            ]}
            castShadow
          >
            <capsuleGeometry args={[spec.wristRadius * 0.18, fingerLen, 6, 8]} />
            <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
          </mesh>
        );
      })}

      {/* Thumb */}
      <mesh
        position={[shoulderX + dir * (0.04 + 0.7 * spec.wristRadius), armStartY - spec.upperArmLength - spec.forearmLength - 0.02, spec.wristRadius * 0.5]}
        rotation={[0, 0, dir * -0.6]}
        castShadow
      >
        <capsuleGeometry args={[spec.wristRadius * 0.2, spec.handLength * 0.32, 6, 8]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>
    </group>
  );
}

// ============================================================
// LEG
// ============================================================
function Leg({ spec, layer, side, isSel, isHov }: { spec: BodySpec; layer: AnatomyLayer; side: 'left' | 'right'; isSel: boolean; isHov: boolean }) {
  const mat = LAYER_MATERIALS[layer];
  const dir = side === 'left' ? -1 : 1;
  const hipX = dir * spec.hipWidth * 0.28;
  const hipTop = spec.crotchY + 0.05;
  const kneeY = spec.kneeY;
  const ankleY = spec.ankleY;

  return (
    <group>
      {/* Hip joint suggestion */}
      <mesh position={[hipX, hipTop, 0]} castShadow>
        <sphereGeometry args={[spec.thighRadius * 1.1, 24, 24]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Thigh (capsule) */}
      <mesh position={[hipX, (hipTop + kneeY) / 2, 0]} castShadow>
        <capsuleGeometry args={[spec.thighRadius, hipTop - kneeY - spec.thighRadius * 0.4, 8, 24]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Quadriceps bump */}
      {layer === 'muscle' && (
        <mesh position={[hipX, (hipTop + kneeY) / 2 + 0.05, spec.thighRadius * 0.4]} scale={[spec.thighRadius * 0.85, (hipTop - kneeY) * 0.35, spec.thighRadius * 0.6]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={mat.accent} roughness={0.5} />
        </mesh>
      )}

      {/* Knee */}
      <mesh position={[hipX, kneeY, 0]} castShadow>
        <sphereGeometry args={[spec.thighRadius * 0.95, 24, 24]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Shin (capsule) */}
      <mesh position={[hipX, (kneeY + ankleY) / 2, 0]} castShadow>
        <capsuleGeometry args={[spec.shinRadius, kneeY - ankleY - spec.shinRadius * 0.5, 8, 24]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Calf bump */}
      {layer === 'muscle' && (
        <mesh position={[hipX, (kneeY + ankleY) / 2 + 0.05, -spec.shinRadius * 0.5]} scale={[spec.shinRadius * 0.75, (kneeY - ankleY) * 0.3, spec.shinRadius * 0.6]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={mat.accent} roughness={0.5} />
        </mesh>
      )}

      {/* Ankle */}
      <mesh position={[hipX, ankleY, 0]} castShadow>
        <sphereGeometry args={[spec.ankleRadius, 16, 16]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>

      {/* Foot */}
      <mesh position={[hipX, spec.footY + 0.025, spec.footLength * 0.25]} castShadow>
        <boxGeometry args={[spec.footWidth, 0.05, spec.footLength]} />
        <SkinMat mat={mat} highlighted={isSel} hovered={isHov} />
      </mesh>
    </group>
  );
}

// ============================================================
// SKELETON layer extras (visible ribs, spine, pelvis)
// ============================================================
function SkeletalDetails({ spec, gender }: { spec: BodySpec; gender: Gender }) {
  return (
    <group>
      {/* Spine vertebrae */}
      {Array.from({ length: 12 }).map((_, i) => {
        const t = i / 11;
        const y = spec.hipY + 0.05 + t * (spec.shoulderY - spec.hipY - 0.05);
        return (
          <mesh key={i} position={[0, y, -spec.chestDepth * 0.35]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshStandardMaterial color="#e5d9c4" roughness={0.7} />
          </mesh>
        );
      })}
      {/* Ribs (left/right) */}
      {Array.from({ length: 7 }).map((_, i) => {
        const y = spec.bustY - 0.02 - i * 0.04;
        return (
          <group key={i}>
            <mesh position={[-spec.chestWidth * 0.3, y, 0]} rotation={[0, 0, -0.1]}>
              <torusGeometry args={[spec.chestWidth * 0.35, 0.012, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#f2eada" roughness={0.7} />
            </mesh>
          </group>
        );
      })}
      {/* Pelvis */}
      <mesh position={[0, spec.hipY - 0.02, 0]} scale={[spec.hipWidth * 0.55, 0.08, spec.hipDepth * 0.55]}>
        <torusGeometry args={[1, 0.25, 12, 32]} />
        <meshStandardMaterial color="#e5d9c4" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ============================================================
// NERVOUS SYSTEM extras
// ============================================================
function NervousDetails({ spec }: { spec: BodySpec }) {
  return (
    <group>
      {/* Spinal cord */}
      <mesh position={[0, (spec.hipY + spec.shoulderY) / 2 + 0.05, -spec.chestDepth * 0.25]}>
        <cylinderGeometry args={[0.015, 0.015, spec.shoulderY - spec.hipY + 0.3, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.4} />
      </mesh>
      {/* Sciatic nerves */}
      <mesh position={[-spec.hipWidth * 0.18, spec.hipY - 0.05, -0.05]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[spec.hipWidth * 0.18, spec.hipY - 0.05, -0.05]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
      {/* Brachial plexus */}
      <mesh position={[-spec.shoulderWidth * 0.3, spec.shoulderY - 0.05, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.5, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[spec.shoulderWidth * 0.3, spec.shoulderY - 0.05, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.5, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ============================================================
// ORGANS layer extras
// ============================================================
function OrganDetails({ spec }: { spec: BodySpec }) {
  return (
    <group>
      {/* Heart */}
      <mesh position={[-spec.chestWidth * 0.1, spec.chestY - 0.02, spec.chestDepth * 0.4]} scale={[0.08, 0.1, 0.06]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.3} roughness={0.4} />
      </mesh>
      {/* Lungs */}
      <mesh position={[-spec.chestWidth * 0.22, spec.chestY + 0.02, 0.05]} scale={[0.075, 0.13, 0.07]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.15} roughness={0.5} />
      </mesh>
      <mesh position={[spec.chestWidth * 0.22, spec.chestY + 0.02, 0.05]} scale={[0.075, 0.13, 0.07]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.15} roughness={0.5} />
      </mesh>
      {/* Liver */}
      <mesh position={[spec.waistWidth * 0.15, spec.navelY + 0.05, 0.05]} scale={[0.13, 0.07, 0.08]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color="#7c2d12" emissive="#431407" emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
      {/* Stomach */}
      <mesh position={[-spec.waistWidth * 0.18, spec.navelY + 0.04, 0.05]} scale={[0.07, 0.08, 0.06]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color="#fbbf24" emissive="#92400e" emissiveIntensity={0.15} roughness={0.5} />
      </mesh>
      {/* Intestines */}
      <mesh position={[0, spec.navelY - 0.05, 0.04]} scale={[0.16, 0.08, 0.07]}>
        <torusGeometry args={[0.6, 0.4, 12, 24]} />
        <meshStandardMaterial color="#a16207" emissive="#451a03" emissiveIntensity={0.15} roughness={0.55} />
      </mesh>
    </group>
  );
}

// ============================================================
// MAIN MODEL
// ============================================================
interface RealisticHumanModelProps {
  activeLayer: AnatomyLayer;
  gender: Gender;
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string, position: THREE.Vector3) => void;
}

export default function RealisticHumanModel({ activeLayer, gender, selectedZoneId, onZoneSelect }: RealisticHumanModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spec = BODY_SPECS[gender];

  // Subtle breathing animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const breathe = 1 + Math.sin(t * 0.8) * 0.005;
    groupRef.current.scale.x = breathe;
    groupRef.current.scale.z = breathe;
  });

  const handleSelect = useCallback(
    (zoneId: string, position: THREE.Vector3) => {
      onZoneSelect(zoneId, position);
    },
    [onZoneSelect]
  );

  const isZ = (id: string) => selectedZoneId === id;

  return (
    <group ref={groupRef} position={[0, -0.85, 0]}>
      {/* HEAD zone */}
      <Zone zoneId="head" selectedId={selectedZoneId} onSelect={handleSelect}>
        <Head spec={spec} layer={activeLayer} gender={gender} isSel={isZ('head')} isHov={false} />
      </Zone>

      {/* NECK zone */}
      <Zone zoneId="neck" selectedId={selectedZoneId} onSelect={handleSelect}>
        <Neck spec={spec} layer={activeLayer} isSel={isZ('neck')} isHov={false} />
      </Zone>

      {/* CHEST zone */}
      <Zone zoneId="chest" selectedId={selectedZoneId} onSelect={handleSelect}>
        <Torso spec={spec} layer={activeLayer} gender={gender} isSel={isZ('chest') || isZ('heart') || isZ('lungs')} isHov={false} zone="chest" />
      </Zone>

      {/* Left arm */}
      <Zone zoneId="left_shoulder" selectedId={selectedZoneId} onSelect={handleSelect}>
        <Arm spec={spec} layer={activeLayer} side="left" isSel={isZ('left_shoulder')} isHov={false} />
      </Zone>

      {/* Right arm */}
      <Zone zoneId="right_shoulder" selectedId={selectedZoneId} onSelect={handleSelect}>
        <Arm spec={spec} layer={activeLayer} side="right" isSel={isZ('right_shoulder')} isHov={false} />
      </Zone>

      {/* Left leg */}
      <Zone zoneId="left_knee" selectedId={selectedZoneId} onSelect={handleSelect}>
        <Leg spec={spec} layer={activeLayer} side="left" isSel={isZ('left_knee') || isZ('hip')} isHov={false} />
      </Zone>

      {/* Right leg */}
      <Zone zoneId="right_knee" selectedId={selectedZoneId} onSelect={handleSelect}>
        <Leg spec={spec} layer={activeLayer} side="right" isSel={isZ('right_knee') || isZ('hip')} isHov={false} />
      </Zone>

      {/* Layer-specific overlays */}
      {activeLayer === 'skeleton' && <SkeletalDetails spec={spec} gender={gender} />}
      {activeLayer === 'nervous' && <NervousDetails spec={spec} />}
      {activeLayer === 'organs' && <OrganDetails spec={spec} />}
    </group>
  );
}

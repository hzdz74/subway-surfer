'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AnatomyLayer, Gender } from '@/types';

const MODEL_PATH = '/models/xbot.glb';

interface Props {
  activeLayer: AnatomyLayer;
  gender: Gender;
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string, position: THREE.Vector3) => void;
}

// Layer materials
const LAYER_MATERIALS = {
  skin: { color: '#e8b89e', emissive: '#3a1a10', metalness: 0.05, roughness: 0.55, opacity: 1 },
  muscle: { color: '#b53a30', emissive: '#400804', metalness: 0.1, roughness: 0.45, opacity: 1 },
  skeleton: { color: '#f2eada', emissive: '#181410', metalness: 0.15, roughness: 0.7, opacity: 1 },
  nervous: { color: '#e8b89e', emissive: '#1a0d05', metalness: 0.05, roughness: 0.55, opacity: 0.6 },
  organs: { color: '#e8b89e', emissive: '#1a0d05', metalness: 0.05, roughness: 0.55, opacity: 0.45 },
} as const;

// Anatomical zones positions (relative to model bounding box)
// Will be used for invisible click hitboxes
interface ZoneBox {
  id: string;
  pos: [number, number, number];
  size: [number, number, number];
}

const ZONE_BOXES: ZoneBox[] = [
  { id: 'head', pos: [0, 1.62, 0], size: [0.22, 0.28, 0.22] },
  { id: 'neck', pos: [0, 1.42, 0], size: [0.15, 0.12, 0.15] },
  { id: 'chest', pos: [0, 1.18, 0], size: [0.42, 0.3, 0.3] },
  { id: 'abdomen', pos: [0, 0.92, 0], size: [0.35, 0.25, 0.28] },
  { id: 'hip', pos: [0, 0.73, 0], size: [0.4, 0.18, 0.3] },
  { id: 'left_shoulder', pos: [-0.22, 1.32, 0], size: [0.18, 0.18, 0.18] },
  { id: 'right_shoulder', pos: [0.22, 1.32, 0], size: [0.18, 0.18, 0.18] },
  { id: 'left_knee', pos: [-0.1, 0.4, 0], size: [0.18, 0.32, 0.18] },
  { id: 'right_knee', pos: [0.1, 0.4, 0], size: [0.18, 0.32, 0.18] },
  { id: 'lower_back', pos: [0, 0.95, -0.12], size: [0.3, 0.2, 0.1] },
];

function ZoneHitbox({ box, selectedId, onSelect }: { box: ZoneBox; selectedId: string | null; onSelect: (id: string, p: THREE.Vector3) => void }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Mesh>(null);
  const selected = selectedId === box.id;

  useFrame(() => {
    if (!ref.current) return;
    const targetOpacity = selected ? 0.45 : hovered ? 0.25 : 0;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    if (m && 'opacity' in m) {
      m.opacity += (targetOpacity - m.opacity) * 0.12;
    }
  });

  return (
    <mesh
      ref={ref}
      position={box.pos}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(box.id, e.point); }}
    >
      <boxGeometry args={box.size} />
      <meshStandardMaterial
        color="#0ea5e9"
        emissive="#0284c7"
        emissiveIntensity={selected ? 0.8 : hovered ? 0.5 : 0}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function GLTFHumanModel({ activeLayer, gender, selectedZoneId, onZoneSelect }: Props) {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);

  // Clone, pose to natural standing (arms down), compute scale to fit
  const { cloned, fitScale, fitOffset } = useMemo(() => {
    const c = scene.clone(true);

    // Try to bring arms down from T-pose using Mixamo bone names
    const leftArm = c.getObjectByName('mixamorig:LeftArm') || c.getObjectByName('mixamorigLeftArm');
    const rightArm = c.getObjectByName('mixamorig:RightArm') || c.getObjectByName('mixamorigRightArm');
    const leftForeArm = c.getObjectByName('mixamorig:LeftForeArm') || c.getObjectByName('mixamorigLeftForeArm');
    const rightForeArm = c.getObjectByName('mixamorig:RightForeArm') || c.getObjectByName('mixamorigRightForeArm');

    if (leftArm) leftArm.rotation.z = THREE.MathUtils.degToRad(75);
    if (rightArm) rightArm.rotation.z = THREE.MathUtils.degToRad(-75);
    if (leftForeArm) leftForeArm.rotation.y = THREE.MathUtils.degToRad(-15);
    if (rightForeArm) rightForeArm.rotation.y = THREE.MathUtils.degToRad(15);

    // Force matrix update on the whole scene so bounding box is accurate
    c.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const target = 1.85;
    const s = target / size.y;
    const center = new THREE.Vector3();
    box.getCenter(center);
    const yOffset = -box.min.y * s;
    return {
      cloned: c,
      fitScale: s,
      fitOffset: new THREE.Vector3(-center.x * s, yOffset, -center.z * s),
    };
  }, [scene]);

  // Apply layer-specific material
  useEffect(() => {
    const mat = LAYER_MATERIALS[activeLayer];
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const newMat = new THREE.MeshPhysicalMaterial({
          color: mat.color,
          emissive: mat.emissive,
          emissiveIntensity: 0.08,
          metalness: mat.metalness,
          roughness: mat.roughness,
          transparent: mat.opacity < 1,
          opacity: mat.opacity,
          clearcoat: 0.15,
          clearcoatRoughness: 0.4,
          sheen: 0.2,
          sheenColor: new THREE.Color('#ffdfd0'),
        });
        child.material = newMat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [activeLayer, cloned]);

  // Gender-based proportions (scale on top of fit)
  const genderScale = useMemo(() => {
    return gender === 'male'
      ? new THREE.Vector3(1.0, 1.0, 1.0)
      : new THREE.Vector3(0.85, 0.96, 0.85);
  }, [gender]);

  // Subtle breathing
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const breathe = 1 + Math.sin(t * 0.8) * 0.003;
    groupRef.current.scale.set(
      genderScale.x * breathe,
      genderScale.y,
      genderScale.z * breathe
    );
  });

  const handleSelect = useCallback(
    (zoneId: string, position: THREE.Vector3) => {
      onZoneSelect(zoneId, position);
    },
    [onZoneSelect]
  );

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={genderScale}>
      <primitive object={cloned} position={fitOffset} scale={fitScale} />

      {/* Invisible hitboxes for raycasting / zone selection */}
      {ZONE_BOXES.map((box) => (
        <ZoneHitbox key={box.id} box={box} selectedId={selectedZoneId} onSelect={handleSelect} />
      ))}

      {/* Layer-specific anatomical overlays */}
      {activeLayer === 'organs' && <OrganDetails />}
      {activeLayer === 'nervous' && <NervousDetails />}
      {activeLayer === 'skeleton' && <SkeletonDetails />}

      {/* Female chest overlay */}
      {gender === 'female' && (activeLayer === 'skin' || activeLayer === 'muscle') && (
        <>
          <mesh position={[-0.075, 1.22, 0.13]}>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshPhysicalMaterial
              color={LAYER_MATERIALS[activeLayer].color}
              emissive={LAYER_MATERIALS[activeLayer].emissive}
              emissiveIntensity={0.08}
              roughness={0.55}
              clearcoat={0.15}
              sheen={0.2}
              sheenColor={new THREE.Color('#ffdfd0')}
            />
          </mesh>
          <mesh position={[0.075, 1.22, 0.13]}>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshPhysicalMaterial
              color={LAYER_MATERIALS[activeLayer].color}
              emissive={LAYER_MATERIALS[activeLayer].emissive}
              emissiveIntensity={0.08}
              roughness={0.55}
              clearcoat={0.15}
              sheen={0.2}
              sheenColor={new THREE.Color('#ffdfd0')}
            />
          </mesh>
        </>
      )}

      {/* Long hair for female */}
      {gender === 'female' && (
        <>
          <mesh position={[0, 1.62, -0.05]} scale={[0.13, 0.16, 0.14]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color="#4a2c1e" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.42, -0.13]} scale={[0.13, 0.32, 0.06]}>
            <capsuleGeometry args={[0.4, 1, 8, 16]} />
            <meshStandardMaterial color="#4a2c1e" roughness={0.85} />
          </mesh>
        </>
      )}

      {/* Short hair for male */}
      {gender === 'male' && (
        <mesh position={[0, 1.66, -0.01]} scale={[0.115, 0.1, 0.13]}>
          <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
          <meshStandardMaterial color="#3a2618" roughness={0.92} />
        </mesh>
      )}
    </group>
  );
}

function OrganDetails() {
  return (
    <group>
      {/* Heart */}
      <mesh position={[-0.05, 1.22, 0.1]} scale={[0.07, 0.08, 0.06]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
      {/* Lungs */}
      <mesh position={[-0.11, 1.25, 0.05]} scale={[0.06, 0.12, 0.06]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0.11, 1.25, 0.05]} scale={[0.06, 0.12, 0.06]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
      {/* Liver */}
      <mesh position={[0.08, 1.02, 0.06]} scale={[0.11, 0.06, 0.07]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color="#7c2d12" emissive="#431407" emissiveIntensity={0.25} roughness={0.5} />
      </mesh>
      {/* Stomach */}
      <mesh position={[-0.09, 1.0, 0.06]} scale={[0.06, 0.07, 0.05]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color="#fbbf24" emissive="#92400e" emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
      {/* Intestines */}
      <mesh position={[0, 0.88, 0.05]} scale={[0.13, 0.07, 0.06]}>
        <torusGeometry args={[0.6, 0.4, 12, 24]} />
        <meshStandardMaterial color="#a16207" emissive="#451a03" emissiveIntensity={0.2} roughness={0.55} />
      </mesh>
    </group>
  );
}

function NervousDetails() {
  return (
    <group>
      {/* Spinal cord */}
      <mesh position={[0, 1.15, -0.1]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
      </mesh>
      {/* Sciatic nerves */}
      <mesh position={[-0.08, 0.55, -0.04]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.45, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.08, 0.55, -0.04]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.45, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
      </mesh>
      {/* Brachial plexus */}
      <mesh position={[-0.18, 1.28, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.18, 1.28, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function SkeletonDetails() {
  return (
    <group>
      {/* Ribs */}
      {Array.from({ length: 7 }).map((_, i) => {
        const y = 1.32 - i * 0.04;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.13 - i * 0.005, 0.011, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#f2eada" roughness={0.75} />
          </mesh>
        );
      })}
      {/* Spine vertebrae */}
      {Array.from({ length: 14 }).map((_, i) => {
        const t = i / 13;
        const y = 0.78 + t * 0.6;
        return (
          <mesh key={i} position={[0, y, -0.1]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshStandardMaterial color="#e5d9c4" roughness={0.7} />
          </mesh>
        );
      })}
      {/* Pelvis */}
      <mesh position={[0, 0.73, 0]} scale={[0.2, 0.06, 0.13]}>
        <torusGeometry args={[1, 0.25, 12, 32]} />
        <meshStandardMaterial color="#e5d9c4" roughness={0.7} />
      </mesh>
    </group>
  );
}

// Preload the model
useGLTF.preload(MODEL_PATH);

'use client';

import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Capsule } from '@react-three/drei';
import * as THREE from 'three';
import { AnatomyLayer } from '@/types';

interface BodyPartProps {
  position: [number, number, number];
  scale?: [number, number, number] | number;
  color: string;
  hoverColor?: string;
  zoneId: string;
  onSelect: (zoneId: string, position: THREE.Vector3) => void;
  isSelected: boolean;
  geometry?: 'sphere' | 'capsule' | 'cylinder';
  args?: [number, number?, number?];
}

function BodyPart({
  position,
  scale = 1,
  color,
  hoverColor = '#38bdf8',
  zoneId,
  onSelect,
  isSelected,
  geometry = 'capsule',
  args = [0.1, 0.3],
}: BodyPartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    const targetScale = isSelected ? 1.08 : hovered ? 1.04 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
  });

  const resolvedColor = isSelected ? '#0ea5e9' : hovered ? hoverColor : color;

  const commonProps = {
    ref: meshRef,
    position: position as [number, number, number],
    scale: Array.isArray(scale) ? (scale as [number, number, number]) : [scale, scale, scale] as [number, number, number],
    onClick: (e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
      e.stopPropagation();
      onSelect(zoneId, e.point);
    },
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setHovered(true);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      setHovered(false);
      document.body.style.cursor = 'default';
    },
  };

  const material = (
    <meshStandardMaterial
      color={resolvedColor}
      roughness={0.4}
      metalness={isSelected ? 0.3 : 0.1}
      transparent
      opacity={isSelected ? 1 : hovered ? 0.9 : 0.85}
      emissive={isSelected ? '#0369a1' : hovered ? '#0284c7' : '#000000'}
      emissiveIntensity={isSelected ? 0.4 : hovered ? 0.2 : 0}
    />
  );

  if (geometry === 'sphere') {
    return (
      <Sphere {...commonProps} args={[args[0], 32, 32]}>
        {material}
      </Sphere>
    );
  }
  if (geometry === 'cylinder') {
    return (
      <Cylinder {...commonProps} args={[args[0], args[1] ?? args[0], args[2] ?? 0.3, 16]}>
        {material}
      </Cylinder>
    );
  }
  return (
    <Capsule {...commonProps} args={[args[0], args[1] ?? 0.3, 8, 16]}>
      {material}
    </Capsule>
  );
}

interface HumanModelProps {
  activeLayer: AnatomyLayer;
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string, position: THREE.Vector3) => void;
}

const LAYER_COLORS: Record<AnatomyLayer, { body: string; accent: string }> = {
  skin: { body: '#f5c5a3', accent: '#e8a87c' },
  muscle: { body: '#c0392b', accent: '#e74c3c' },
  skeleton: { body: '#ecf0f1', accent: '#bdc3c7' },
  nervous: { body: '#f39c12', accent: '#e67e22' },
  organs: { body: '#8e44ad', accent: '#9b59b6' },
};

export default function HumanModel({ activeLayer, selectedZoneId, onZoneSelect }: HumanModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = LAYER_COLORS[activeLayer];

  const handleSelect = useCallback(
    (zoneId: string, position: THREE.Vector3) => {
      onZoneSelect(zoneId, position);
    },
    [onZoneSelect]
  );

  const partProps = (zoneId: string) => ({
    zoneId,
    onSelect: handleSelect,
    isSelected: selectedZoneId === zoneId,
    color: colors.body,
    hoverColor: colors.accent,
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <BodyPart
        {...partProps('head')}
        position={[0, 1.75, 0]}
        geometry="sphere"
        args={[0.22]}
        scale={1}
      />

      {/* Neck */}
      <BodyPart
        {...partProps('neck')}
        position={[0, 1.52, 0]}
        geometry="cylinder"
        args={[0.07, 0.07, 0.18]}
        scale={1}
      />

      {/* Torso */}
      <BodyPart
        {...partProps('chest')}
        position={[0, 1.15, 0]}
        geometry="capsule"
        args={[0.22, 0.45]}
        scale={1}
      />

      {/* Heart (organ layer) */}
      {(activeLayer === 'organs' || activeLayer === 'cardiaque' as AnatomyLayer) && (
        <BodyPart
          {...partProps('heart')}
          position={[-0.08, 1.3, 0.15]}
          geometry="sphere"
          args={[0.08]}
          color="#e74c3c"
          scale={1}
        />
      )}

      {/* Lungs */}
      {activeLayer === 'organs' && (
        <>
          <BodyPart
            {...partProps('lungs')}
            position={[0.1, 1.25, 0.1]}
            geometry="capsule"
            args={[0.07, 0.2]}
            color="#a78bfa"
            scale={1}
          />
          <BodyPart
            {...partProps('lungs')}
            position={[-0.1, 1.25, 0.1]}
            geometry="capsule"
            args={[0.07, 0.2]}
            color="#a78bfa"
            scale={1}
          />
        </>
      )}

      {/* Abdomen */}
      <BodyPart
        {...partProps('abdomen')}
        position={[0, 0.92, 0]}
        geometry="capsule"
        args={[0.2, 0.28]}
        scale={1}
      />

      {/* Spine (back) */}
      {(activeLayer === 'skeleton' || activeLayer === 'nervous') && (
        <BodyPart
          {...partProps('spine')}
          position={[0, 1.1, -0.08]}
          geometry="cylinder"
          args={[0.04, 0.04, 0.7]}
          color={activeLayer === 'nervous' ? '#f59e0b' : '#e2e8f0'}
          scale={1}
        />
      )}

      {/* Lower back */}
      <BodyPart
        {...partProps('lower_back')}
        position={[0, 0.82, -0.09]}
        geometry="capsule"
        args={[0.06, 0.14]}
        scale={1}
      />

      {/* Pelvis/Hip */}
      <BodyPart
        {...partProps('hip')}
        position={[0, 0.72, 0]}
        geometry="capsule"
        args={[0.18, 0.1]}
        scale={1}
      />

      {/* Left shoulder */}
      <BodyPart
        {...partProps('left_shoulder')}
        position={[-0.38, 1.38, 0]}
        geometry="sphere"
        args={[0.1]}
        scale={1}
      />

      {/* Right shoulder */}
      <BodyPart
        {...partProps('right_shoulder')}
        position={[0.38, 1.38, 0]}
        geometry="sphere"
        args={[0.1]}
        scale={1}
      />

      {/* Left upper arm */}
      <BodyPart
        {...partProps('left_shoulder')}
        position={[-0.42, 1.2, 0]}
        geometry="capsule"
        args={[0.07, 0.25]}
        scale={1}
      />

      {/* Right upper arm */}
      <BodyPart
        {...partProps('right_shoulder')}
        position={[0.42, 1.2, 0]}
        geometry="capsule"
        args={[0.07, 0.25]}
        scale={1}
      />

      {/* Left forearm */}
      <BodyPart
        {...partProps('left_shoulder')}
        position={[-0.44, 0.96, 0]}
        geometry="capsule"
        args={[0.055, 0.22]}
        scale={1}
      />

      {/* Right forearm */}
      <BodyPart
        {...partProps('right_shoulder')}
        position={[0.44, 0.96, 0]}
        geometry="capsule"
        args={[0.055, 0.22]}
        scale={1}
      />

      {/* Left thigh */}
      <BodyPart
        {...partProps('hip')}
        position={[-0.18, 0.52, 0]}
        geometry="capsule"
        args={[0.1, 0.28]}
        scale={1}
      />

      {/* Right thigh */}
      <BodyPart
        {...partProps('hip')}
        position={[0.18, 0.52, 0]}
        geometry="capsule"
        args={[0.1, 0.28]}
        scale={1}
      />

      {/* Left knee */}
      <BodyPart
        {...partProps('left_knee')}
        position={[-0.18, 0.33, 0]}
        geometry="sphere"
        args={[0.08]}
        scale={1}
      />

      {/* Right knee */}
      <BodyPart
        {...partProps('right_knee')}
        position={[0.18, 0.33, 0]}
        geometry="sphere"
        args={[0.08]}
        scale={1}
      />

      {/* Left shin */}
      <BodyPart
        {...partProps('left_knee')}
        position={[-0.18, 0.16, 0]}
        geometry="capsule"
        args={[0.07, 0.24]}
        scale={1}
      />

      {/* Right shin */}
      <BodyPart
        {...partProps('right_knee')}
        position={[0.18, 0.16, 0]}
        geometry="capsule"
        args={[0.07, 0.24]}
        scale={1}
      />

      {/* Sciatic nerve visualization */}
      {activeLayer === 'nervous' && (
        <>
          <BodyPart
            {...partProps('sciatic_nerve')}
            position={[0.12, 0.6, 0.05]}
            geometry="cylinder"
            args={[0.015, 0.015, 0.5]}
            color="#fbbf24"
            scale={1}
          />
          <BodyPart
            {...partProps('sciatic_nerve')}
            position={[-0.12, 0.6, 0.05]}
            geometry="cylinder"
            args={[0.015, 0.015, 0.5]}
            color="#fbbf24"
            scale={1}
          />
        </>
      )}
    </group>
  );
}

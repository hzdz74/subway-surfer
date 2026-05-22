'use client';

import { useRef, useCallback, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { getZoneById } from '@/lib/bodyZones';
import GLTFHumanModel from './GLTFHumanModel';
import LayerControls from './LayerControls';
import GenderToggle from './GenderToggle';

function CameraController({ targetPosition }: { targetPosition: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const animating = useRef(false);

  if (targetPosition && !animating.current) {
    animating.current = true;
    const start = camera.position.clone();
    const target = new THREE.Vector3(
      targetPosition.x * 0.5,
      targetPosition.y,
      2.5
    );
    let t = 0;
    const animate = () => {
      t += 0.04;
      camera.position.lerpVectors(start, target, Math.min(t, 1));
      camera.lookAt(new THREE.Vector3(0, targetPosition.y, 0));
      if (t < 1) requestAnimationFrame(animate);
      else animating.current = false;
    };
    animate();
  }

  return null;
}

function SceneContent() {
  const { selectedZone, activeLayer, gender, setSelectedZone } = useAppStore();
  const targetPos = useRef<THREE.Vector3 | null>(null);

  const handleZoneSelect = useCallback(
    (zoneId: string, position: THREE.Vector3) => {
      const zone = getZoneById(zoneId);
      if (zone) {
        setSelectedZone(zone);
        targetPos.current = position;
      }
    },
    [setSelectedZone]
  );

  return (
    <>
      {/* Studio lighting setup */}
      <ambientLight intensity={0.35} color="#f0f4ff" />

      {/* Key light (warm) */}
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.4}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {/* Fill light (cool blue) */}
      <directionalLight position={[-4, 3, 2]} intensity={0.55} color="#a0c4ff" />

      {/* Rim light from behind */}
      <directionalLight position={[0, 4, -5]} intensity={0.8} color="#bfdbfe" />

      {/* Subsurface scattering simulation */}
      <pointLight position={[0, 1.2, 1.5]} intensity={0.3} color="#ffd0c0" distance={3} />

      <CameraController targetPosition={targetPos.current} />

      <Suspense fallback={<Html center><span className="text-white text-sm">Chargement...</span></Html>}>
        <GLTFHumanModel
          activeLayer={activeLayer}
          gender={gender}
          selectedZoneId={selectedZone?.id ?? null}
          onZoneSelect={handleZoneSelect}
        />
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.55}
          scale={4}
          blur={2.5}
          far={4}
          color="#000033"
        />
        <hemisphereLight color="#b3d9ff" groundColor="#1a1a2e" intensity={0.4} />
      </Suspense>
    </>
  );
}

export default function AnatomyCanvas() {
  const { selectedZone, setSelectedZone } = useAppStore();

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 1.0, 3.5], fov: 38, near: 0.1, far: 100 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        style={{ background: 'transparent' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedZone(null);
        }}
      >
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={6}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.95}
          autoRotate={!selectedZone}
          autoRotateSpeed={0.4}
          target={[0, 0.95, 0]}
          enableDamping
          dampingFactor={0.08}
        />
        <SceneContent />
      </Canvas>

      <LayerControls />
      <GenderToggle />

      {selectedZone && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-sky-500/90 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg border border-sky-400/50 animate-fade-in">
            {selectedZone.label}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-white/50 text-xs font-light tracking-wide">
          Cliquez sur une zone · Rotation 360°
        </p>
      </div>
    </div>
  );
}

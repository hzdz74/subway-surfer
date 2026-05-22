'use client';

import { useRef, useCallback, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { getZoneById } from '@/lib/bodyZones';
import HumanModel from './HumanModel';
import LayerControls from './LayerControls';

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
  const { selectedZone, activeLayer, setSelectedZone } = useAppStore();
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#b3d9ff" />
      <pointLight position={[0, 3, 3]} intensity={0.5} color="#e0f2fe" />

      <CameraController targetPosition={targetPos.current} />

      <Suspense fallback={<Html center><span className="text-white text-sm">Chargement...</span></Html>}>
        <HumanModel
          activeLayer={activeLayer}
          selectedZoneId={selectedZone?.id ?? null}
          onZoneSelect={handleZoneSelect}
        />
        <ContactShadows
          position={[0, -0.3, 0]}
          opacity={0.4}
          scale={3}
          blur={2}
          far={4}
        />
        <hemisphereLight color="#b3d9ff" groundColor="#1a1a2e" intensity={0.5} />
      </Suspense>
    </>
  );
}

export default function AnatomyCanvas() {
  const { selectedZone, setSelectedZone } = useAppStore();

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 1.1, 3], fov: 45, near: 0.1, far: 100 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
        style={{ background: 'transparent' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedZone(null);
        }}
      >
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={5}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.9}
          autoRotate={!selectedZone}
          autoRotateSpeed={0.5}
          target={[0, 1.0, 0]}
        />
        <SceneContent />
      </Canvas>

      <LayerControls />

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

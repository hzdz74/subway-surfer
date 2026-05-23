'use client';

import { useRef, useCallback, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { getZoneById } from '@/lib/bodyZones';
import RealisticHumanModel from './RealisticHumanModel';
import LayerControls from './LayerControls';
import GenderToggle from './GenderToggle';

function CameraController({ targetPosition }: { targetPosition: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const animating = useRef(false);

  if (targetPosition && !animating.current) {
    animating.current = true;
    const start = camera.position.clone();
    const target = new THREE.Vector3(targetPosition.x * 0.4, targetPosition.y, 2.8);
    let t = 0;
    const animate = () => {
      t += 0.035;
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
      {/* Clinical studio lighting — even, neutral white */}
      <ambientLight intensity={0.55} color="#f8faff" />

      {/* Key light top-front */}
      <directionalLight
        position={[2, 5, 3]}
        intensity={1.6}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={12}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2.5}
        shadow-camera-bottom={-2.5}
        shadow-bias={-0.0002}
      />

      {/* Fill — cool, opposite side */}
      <directionalLight position={[-3, 2, 2]} intensity={0.65} color="#ddeeff" />

      {/* Rim from behind */}
      <directionalLight position={[0, 3, -4]} intensity={0.5} color="#e8f0ff" />

      {/* Under-fill lifts base shadows */}
      <directionalLight position={[0, -2, 2]} intensity={0.2} color="#f0f4ff" />

      {/* Subsurface warmth */}
      <pointLight position={[0, 0.8, 1.8]} intensity={0.32} color="#ffe8d8" distance={4} decay={2} />

      <CameraController targetPosition={targetPos.current} />

      <Suspense fallback={<Html center><span className="text-white text-sm">Chargement…</span></Html>}>
        <RealisticHumanModel
          activeLayer={activeLayer}
          gender={gender}
          selectedZoneId={selectedZone?.id ?? null}
          onZoneSelect={handleZoneSelect}
        />
        <ContactShadows
          position={[0, -0.86, 0]}
          opacity={0.4}
          scale={3}
          blur={3.5}
          far={3}
          color="#000030"
        />
        <hemisphereLight color="#e8f0ff" groundColor="#1a1a30" intensity={0.3} />
      </Suspense>

      {/* Medical-grade post-processing */}
      <EffectComposer enableNormalPass={true} multisampling={0}>
        <N8AO aoRadius={0.07} intensity={3} quality="ultra" distanceFalloff={1} screenSpaceRadius={false} />
        <Bloom luminanceThreshold={0.88} luminanceSmoothing={0.25} intensity={0.15} mipmapBlur />
        <Vignette offset={0.22} darkness={0.52} eskil={false} />
        <SMAA />
      </EffectComposer>
    </>
  );
}

export default function AnatomyCanvas() {
  const { selectedZone, setSelectedZone } = useAppStore();

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0.9, 3.2], fov: 40, near: 0.05, far: 60 }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: 'transparent' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedZone(null);
        }}
      >
        <OrbitControls
          enablePan={false}
          minDistance={1.2}
          maxDistance={5.5}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.95}
          autoRotate={!selectedZone}
          autoRotateSpeed={0.35}
          target={[0, 0.9, 0]}
          enableDamping
          dampingFactor={0.07}
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
        <p className="text-white/40 text-xs font-light tracking-wide">
          Cliquez sur une zone · Rotation 360°
        </p>
      </div>
    </div>
  );
}

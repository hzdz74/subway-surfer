'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import { getZoneById } from '@/lib/bodyZones';
import LayerControls from './LayerControls';
import GenderToggle from './GenderToggle';
import { AnatomyLayer, Gender } from '@/types';

// Fallback: improved Three.js viewer (always works, no credentials needed)
const AnatomyCanvas = dynamic(() => import('./AnatomyCanvas'), { ssr: false });

const HUMAN_API_SRC = 'https://human-api.biodigital.com/build/1.2.1/human-api-1.2.1.min.js';
const IFRAME_ID = 'bd-human-viewer';

const MODELS: Record<Gender, string> = {
  male: 'production/maleAdult/male_complete_anatomy_16',
  female: 'production/femaleAdult/female_complete_anatomy_10',
};

// Which displayNames to show per layer — everything else is hidden (replace:true)
const LAYER_SHOW: Record<AnatomyLayer, RegExp> = {
  skin: /integumentary|skin|dermis/i,
  muscle: /muscul|skeletal|bone|osseous/i,
  skeleton: /skeletal|bone|osseous|cartilage/i,
  nervous: /nervous|neural|nerve|brain|spinal cord|skeletal|bone/i,
  organs: /cardiovascular|respiratory|digestive|urinary|endocrine|hepat|pulmonary|cardiac|skeletal|bone/i,
};

// displayName patterns → our body zone IDs
const NAME_TO_ZONE: Array<[RegExp, string]> = [
  [/\bheart\b/i, 'heart'],
  [/lung/i, 'lungs'],
  [/\bbrain\b/i, 'head'],
  [/\bhead\b/i, 'head'],
  [/\bneck\b/i, 'neck'],
  [/spinal cord/i, 'spine'],
  [/vertebr|spine\b/i, 'spine'],
  [/lumbar/i, 'lowerBack'],
  [/\bhip\b|pelvi/i, 'hip'],
  [/sciatic/i, 'sciaticNerve'],
  [/left knee/i, 'leftKnee'],
  [/right knee/i, 'rightKnee'],
  [/left shoulder/i, 'leftShoulder'],
  [/right shoulder/i, 'rightShoulder'],
  [/stomach|liver|kidney|intestin|abdom|colon/i, 'abdomen'],
  [/\bchest\b|thorax/i, 'chest'],
];

type BdObject = { objectId: string; displayName: string; fmaId?: string };
type BdHuman = {
  on(event: string, cb: (data?: unknown) => void): void;
  pick: { on(event: string, cb: (e: { objectId?: string }) => void): void };
  camera: { flyTo(opts: { eye?: number[]; look?: number[]; velocity?: number }): void };
  scene: {
    getObjects(cb: (objs: Record<string, BdObject>) => void): void;
    showObjects(params: { objectIds: Record<string, boolean>; replace?: boolean }, cb?: () => void): void;
  };
};

declare global {
  interface Window {
    HumanAPI: { Human: new (iframeId: string) => BdHuman };
  }
}

function buildSrc(gender: Gender): string {
  const key = process.env.NEXT_PUBLIC_BIODIGITAL_KEY ?? '';
  const p = new URLSearchParams({
    m: MODELS[gender],
    dk: key,
    'ui-anatomy-descriptions': 'false',
    'ui-audio': 'false',
    'ui-chapter-list': 'false',
    'ui-fullscreen': 'false',
    'ui-help': 'false',
    'ui-info': 'false',
    'ui-label-list': 'false',
    'ui-layers': 'false',
    'ui-loader': 'true',
    'ui-menu': 'false',
    'ui-nav': 'false',
    'ui-search': 'false',
    'ui-tools': 'false',
    'ui-tutorial': 'false',
    'ui-undo': 'false',
    'ui-whiteboard': 'false',
  });
  return `https://human.biodigital.com/widget/?${p}`;
}

// ── Setup screen (no API key configured) ────────────────────────────────────
function SetupScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-3xl">
        🧬
      </div>
      <div>
        <h2 className="text-white font-bold text-xl mb-2">Configurez BioDigital Human</h2>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs">
          Pour afficher le modèle anatomique médical ultra-réaliste, ajoutez votre clé API BioDigital.
        </p>
      </div>
      <div className="w-full max-w-xs bg-slate-900/80 border border-white/10 rounded-xl p-5 text-left space-y-3">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Étapes de configuration</p>
        {[
          ['1', 'Créez un compte sur developer.biodigital.com'],
          ['2', 'Créez une app et copiez votre Developer Key'],
          ['3', 'Ajoutez NEXT_PUBLIC_BIODIGITAL_KEY dans Vercel'],
          ['4', 'Redéployez l\'application'],
        ].map(([n, text]) => (
          <div key={n} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
            <span className="text-white/55 text-xs leading-relaxed">{text}</span>
          </div>
        ))}
      </div>
      <a
        href="https://developer.biodigital.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-sky-400 hover:text-sky-300 transition-colors underline"
      >
        Ouvrir le portail développeur →
      </a>
    </div>
  );
}

// ── Loading overlay ──────────────────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#07111f] z-20 pointer-events-none">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 animate-spin" style={{ borderTopColor: '#0ea5e9' }} />
        <div className="absolute inset-3 rounded-full border-2 border-sky-400/15 animate-spin" style={{ borderTopColor: '#38bdf8', animationDelay: '-0.5s', animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🫀</div>
      </div>
      <p className="text-sky-400/70 text-sm font-medium tracking-wide animate-pulse">
        Chargement du modèle anatomique…
      </p>
      <p className="text-white/25 text-xs">Données médicales BioDigital Human</p>
    </div>
  );
}

// ── Main viewer ──────────────────────────────────────────────────────────────
export default function BioDigitalViewer() {
  const { gender, activeLayer, selectedZone, setSelectedZone } = useAppStore();

  const humanRef = useRef<BdHuman | null>(null);
  const objectsRef = useRef<Record<string, BdObject>>({});
  const pendingLayerRef = useRef<AnatomyLayer | null>(null);
  const sdkReadyRef = useRef(false);

  const [viewerReady, setViewerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [iframeSrc, setIframeSrc] = useState(() => buildSrc(gender));

  const hasKey = !!process.env.NEXT_PUBLIC_BIODIGITAL_KEY;

  // Apply layer visibility to BioDigital scene
  const applyLayer = useCallback((layer: AnatomyLayer) => {
    const human = humanRef.current;
    const objects = objectsRef.current;
    if (!human || Object.keys(objects).length === 0) {
      pendingLayerRef.current = layer;
      return;
    }

    const showRe = LAYER_SHOW[layer];
    const objectIds: Record<string, boolean> = {};
    Object.entries(objects).forEach(([id, obj]) => {
      objectIds[id] = showRe.test(obj.displayName);
    });

    human.scene.showObjects({ objectIds, replace: true });
  }, []);

  // Init HumanAPI against the current iframe
  const initHuman = useCallback(() => {
    if (!window.HumanAPI || !sdkReadyRef.current) return;

    const human = new window.HumanAPI.Human(IFRAME_ID);
    humanRef.current = human;
    objectsRef.current = {};
    setViewerReady(false);

    human.on('ready', () => {
      human.scene.getObjects((objects) => {
        objectsRef.current = objects;
        setLoading(false);
        setViewerReady(true);

        // Apply any pending layer change
        const pending = pendingLayerRef.current;
        if (pending) {
          pendingLayerRef.current = null;
          applyLayer(pending);
        } else {
          applyLayer(activeLayer);
        }
      });
    });

    // Zone selection via click
    human.pick.on('picked', (e) => {
      if (!e?.objectId) return;
      const obj = objectsRef.current[e.objectId];
      if (!obj) return;

      const match = NAME_TO_ZONE.find(([re]) => re.test(obj.displayName));
      if (match) {
        const zone = getZoneById(match[1]);
        if (zone) setSelectedZone(zone);
      }
    });
  }, [applyLayer, activeLayer, setSelectedZone]);

  // SDK loaded callback
  const onSdkLoad = useCallback(() => {
    sdkReadyRef.current = true;
    initHuman();
  }, [initHuman]);

  // Gender change → reload iframe
  useEffect(() => {
    const newSrc = buildSrc(gender);
    setIframeSrc(newSrc);
    setLoading(true);
    setViewerReady(false);
    humanRef.current = null;
    objectsRef.current = {};

    // Reinit after a short delay to allow iframe to reload
    const t = setTimeout(() => {
      if (sdkReadyRef.current) initHuman();
    }, 600);
    return () => clearTimeout(t);
  }, [gender, initHuman]);

  // Layer change
  useEffect(() => {
    if (viewerReady) {
      applyLayer(activeLayer);
    } else {
      pendingLayerRef.current = activeLayer;
    }
  }, [activeLayer, viewerReady, applyLayer]);

  // No BioDigital key → fall back to the improved Three.js parametric viewer
  if (!hasKey) {
    return <AnatomyCanvas />;
  }

  return (
    <div className="relative w-full h-full bg-[#07111f]">
      <Script src={HUMAN_API_SRC} strategy="afterInteractive" onLoad={onSdkLoad} />

      {/* BioDigital iframe */}
      <iframe
        id={IFRAME_ID}
        src={iframeSrc}
        className="w-full h-full border-0 block"
        allowFullScreen
        allow="fullscreen"
        title="BioDigital Human Anatomy Viewer"
        onLoad={() => {
          if (sdkReadyRef.current) {
            setTimeout(() => initHuman(), 300);
          }
        }}
      />

      {loading && <LoadingOverlay />}

      {/* UI controls overlay — pointer-events: auto so they capture clicks before iframe */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          <LayerControls />
          <GenderToggle />
        </div>

        {selectedZone && (
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2">
            <div className="bg-sky-500/90 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg border border-sky-400/50 animate-fade-in">
              {selectedZone.label}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
          <p className="text-white/40 text-xs font-light tracking-wide">
            Modèle anatomique · BioDigital Human · Rotation 360°
          </p>
        </div>
      </div>
    </div>
  );
}

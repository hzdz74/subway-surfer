'use client';

import { AnatomyLayer } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { LAYER_LABELS } from '@/lib/bodyZones';

const LAYERS: AnatomyLayer[] = ['skin', 'muscle', 'skeleton', 'nervous', 'organs'];

const LAYER_ICONS: Record<AnatomyLayer, string> = {
  skin: '🫧',
  muscle: '💪',
  skeleton: '🦴',
  nervous: '⚡',
  organs: '🫀',
};

export default function LayerControls() {
  const { activeLayer, setActiveLayer } = useAppStore();

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
      {LAYERS.map((layer) => {
        const active = activeLayer === layer;
        return (
          <button
            key={layer}
            onClick={() => setActiveLayer(layer)}
            title={LAYER_LABELS[layer]}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium',
              'backdrop-blur-md border transition-all duration-200',
              'shadow-sm hover:shadow-md',
              active
                ? 'bg-sky-500/90 border-sky-400 text-white shadow-sky-500/30'
                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white'
            )}
          >
            <span className="text-base leading-none">{LAYER_ICONS[layer]}</span>
            <span className="hidden group-hover:inline sm:inline whitespace-nowrap">
              {LAYER_LABELS[layer]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

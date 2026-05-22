'use client';

import { MessageSquare, MapPin, ShoppingBag, X, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import ChatPanel from '@/components/chat/ChatPanel';
import MapsModule from '@/components/maps/MapsModule';
import ShopModule from '@/components/shop/ShopModule';

type Panel = 'chat' | 'maps' | 'shop';

const TABS: { id: Panel; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chat', label: 'IA Médicale', icon: MessageSquare },
  { id: 'maps', label: 'Professionnels', icon: MapPin },
  { id: 'shop', label: 'Matériel', icon: ShoppingBag },
];

export default function SidePanel() {
  const { activePanel, setActivePanel, selectedZone } = useAppStore();

  return (
    <aside className="flex flex-col h-full w-full bg-slate-950/80 backdrop-blur-xl border-l border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-xs text-sky-400 font-semibold tracking-wider uppercase">
            MedAssist IA
          </span>
        </div>
        {selectedZone ? (
          <div className="flex items-center gap-2">
            <p className="text-white text-sm font-medium">{selectedZone.label}</p>
            <button
              onClick={() => useAppStore.getState().setSelectedZone(null)}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <p className="text-white/50 text-xs">Sélectionnez une zone anatomique</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-3">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-center transition-all duration-150',
                activePanel === id
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              )}
            >
              <Icon size={15} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden mt-2 min-h-0">
        {activePanel === 'chat' && <ChatPanel />}
        {activePanel === 'maps' && <MapsModule />}
        {activePanel === 'shop' && <ShopModule />}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/25">
            Basé sur PubMed · Vidal · HAS
          </p>
          <button className="flex items-center gap-1 text-[10px] text-sky-500/60 hover:text-sky-400 transition-colors">
            <span>Mentions légales</span>
            <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </aside>
  );
}

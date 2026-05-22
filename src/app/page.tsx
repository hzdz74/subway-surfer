'use client';

import dynamic from 'next/dynamic';
import { Activity, Info } from 'lucide-react';
import SidePanel from '@/components/layout/SidePanel';
import BottomSheet from '@/components/layout/BottomSheet';

// Dynamically import the 3D canvas to avoid SSR issues with Three.js
const AnatomyCanvas = dynamic(() => import('@/components/3d/AnatomyCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-2 border-sky-500/30 animate-spin" style={{ borderTopColor: '#0ea5e9' }} />
        <div className="absolute inset-3 rounded-full border-2 border-sky-400/20 animate-spin" style={{ borderTopColor: '#38bdf8', animationDelay: '-0.5s', animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity size={24} className="text-sky-400 animate-pulse" />
        </div>
      </div>
      <p className="text-sky-400/60 text-sm font-medium tracking-wide animate-pulse">
        Chargement du modèle 3D...
      </p>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #060c1a 0%, #0c1b35 50%, #060c1a 100%)' }}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 h-14 border-b border-white/8 bg-slate-950/60 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
            <Activity size={16} className="text-sky-400" />
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight">MedAssist</span>
            <span className="text-sky-400 font-bold text-base tracking-tight"> 3D</span>
          </div>
          <span className="hidden sm:inline ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-xs text-white/40">
            <span>Modèles : PubMed · Vidal · HAS</span>
            <span className="w-px h-3 bg-white/15" />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              IA connectée
            </span>
          </div>
          <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-all">
            <Info size={14} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* 3D Canvas — full area on mobile, left side on desktop */}
        <div className="flex-1 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-sky-500/5 blur-3xl" />
            <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-indigo-500/5 blur-2xl" />
          </div>

          <AnatomyCanvas />
        </div>

        {/* Side panel — only on md+ screens */}
        <div className="hidden md:flex w-96 flex-shrink-0 border-l border-white/8">
          <div className="w-full">
            <SidePanel />
          </div>
        </div>
      </main>

      {/* Mobile bottom sheet — only on small screens */}
      <div className="md:hidden">
        <BottomSheet />
      </div>
    </div>
  );
}

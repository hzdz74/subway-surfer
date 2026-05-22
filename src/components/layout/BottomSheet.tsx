'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, MapPin, ShoppingBag, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import ChatPanel from '@/components/chat/ChatPanel';
import MapsModule from '@/components/maps/MapsModule';
import ShopModule from '@/components/shop/ShopModule';

type Panel = 'chat' | 'maps' | 'shop';

const TABS: { id: Panel; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chat', label: 'IA', icon: MessageSquare },
  { id: 'maps', label: 'Carte', icon: MapPin },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
];

export default function BottomSheet() {
  const { activePanel, setActivePanel, selectedZone } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Auto-open when zone selected
  useEffect(() => {
    if (selectedZone) setIsOpen(true);
  }, [selectedZone]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - startY;
    setCurrentY(Math.max(0, delta));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentY > 80) setIsOpen(false);
    setCurrentY(0);
  };

  const openHeight = 'calc(85vh - 60px)';

  return (
    <>
      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 px-4 pb-safe">
        <div className="flex items-center justify-around py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActivePanel(id);
                setIsOpen(true);
              }}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all',
                activePanel === id && isOpen
                  ? 'text-sky-400'
                  : 'text-white/40'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sheet overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        style={{
          transform: `translateY(${isOpen ? currentY : '100%'}px)`,
          height: openHeight,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        }}
        className="fixed bottom-14 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 flex flex-col shadow-2xl"
      >
        {/* Drag handle */}
        <div
          className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-white/20 mb-2" />

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-[calc(100%-24px)]">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm transition-all',
                  activePanel === id
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-white/40'
                )}
              >
                <Icon size={14} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activePanel === 'chat' && <ChatPanel />}
          {activePanel === 'maps' && <MapsModule />}
          {activePanel === 'shop' && <ShopModule />}
        </div>
      </div>
    </>
  );
}

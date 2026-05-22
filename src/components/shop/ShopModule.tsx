'use client';

import { useRef } from 'react';
import { Star, ShoppingCart, ChevronLeft, ChevronRight, ExternalLink, BadgeCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getProductsBySystem } from '@/lib/mockData';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={10}
          className={cn(
            s <= Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-white/20'
          )}
        />
      ))}
      <span className="text-xs text-amber-400 font-semibold ml-1">{rating}</span>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex-shrink-0 w-44 bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-sky-500/40 hover:bg-white/8 transition-all duration-200">
      {/* Badge */}
      {product.badge && (
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-white shadow">
            {product.badge}
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative w-full h-32 overflow-hidden bg-white/5">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <p className="text-xs font-medium text-white leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </p>

        <StarRating rating={product.rating} />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-white">{product.price.toFixed(2)}€</p>
            <p className="text-[10px] text-white/40">{product.reviewCount.toLocaleString('fr-FR')} avis</p>
          </div>
          <button className="w-8 h-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-500/30 transition-colors">
            <ShoppingCart size={14} />
          </button>
        </div>

        <button className="w-full flex items-center justify-center gap-1.5 text-[10px] text-sky-400 hover:text-sky-300 transition-colors">
          <ExternalLink size={10} />
          <span>Voir sur Amazon</span>
        </button>
      </div>
    </div>
  );
}

export default function ShopModule() {
  const { selectedZone } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const system = selectedZone?.system ?? 'default';
  const products = getProductsBySystem(system);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="px-3 pt-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">Matériel recommandé</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {selectedZone ? `Pour : ${selectedZone.label}` : 'Produits de santé populaires'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
            <BadgeCheck size={10} />
            <span>Note ≥ 4.5 · 1000+ avis</span>
          </div>
        </div>
      </div>

      {/* Quality filter notice */}
      <div className="px-3 flex-shrink-0">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50">
          <span>🛡️</span>
          <span>Uniquement les produits avec note &gt; 4.5/5 et plus de 1 000 avis vérifiés</span>
        </div>
      </div>

      {/* Carousel */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-3 pb-3 snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div key={product.id} className="snap-start relative">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Amazon integration note */}
      <div className="px-3 pb-3 flex-shrink-0">
        <p className="text-[10px] text-white/25 text-center">
          Via Amazon Product Advertising API · Liens affiliés · Prix indicatifs
        </p>
      </div>
    </div>
  );
}

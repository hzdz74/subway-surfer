'use client';

import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export default function GenderToggle() {
  const { gender, setGender } = useAppStore();

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="flex items-center gap-1 bg-slate-950/60 backdrop-blur-md border border-white/15 rounded-full p-1 shadow-lg">
        <button
          onClick={() => setGender('male')}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
            gender === 'male'
              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/40'
              : 'text-white/55 hover:text-white/85'
          )}
        >
          <span className="text-sm leading-none">♂</span>
          <span>Homme</span>
        </button>
        <button
          onClick={() => setGender('female')}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
            gender === 'female'
              ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/40'
              : 'text-white/55 hover:text-white/85'
          )}
        >
          <span className="text-sm leading-none">♀</span>
          <span>Femme</span>
        </button>
      </div>
    </div>
  );
}

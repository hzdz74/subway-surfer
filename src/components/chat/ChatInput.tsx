'use client';

import { useState, KeyboardEvent, useRef } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BodyZone } from '@/types';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  selectedZone?: BodyZone | null;
}

export default function ChatInput({ onSend, disabled, selectedZone }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = selectedZone
    ? [
        `Quels sont les symptômes liés à ${selectedZone.label} ?`,
        `Comment traiter une douleur à ${selectedZone.label} ?`,
        `Quel spécialiste consulter pour ${selectedZone.label} ?`,
      ]
    : ['Quels sont les symptômes d\'une hernie discale ?', 'Comment prévenir les douleurs dorsales ?'];

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="space-y-2">
      {/* Quick suggestions */}
      <div className="flex gap-1.5 flex-wrap">
        {suggestions.slice(0, 2).map((s, i) => (
          <button
            key={i}
            onClick={() => { setValue(s); textareaRef.current?.focus(); }}
            className="text-[10px] px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:bg-sky-500/20 transition-colors line-clamp-1 max-w-[160px] truncate"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2 bg-white/5 border border-white/15 rounded-2xl px-3 py-2 focus-within:border-sky-500/50 focus-within:bg-white/8 transition-all">
        <button className="text-white/30 hover:text-white/60 transition-colors pb-0.5 flex-shrink-0">
          <Paperclip size={16} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          onInput={handleInput}
          placeholder={
            selectedZone
              ? `Question sur ${selectedZone.label}...`
              : 'Posez votre question médicale...'
          }
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none resize-none',
            'min-h-[20px] max-h-[120px] leading-5 py-0.5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
          <button className="text-white/30 hover:text-white/60 transition-colors">
            <Mic size={16} />
          </button>
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
              value.trim() && !disabled
                ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/30'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            )}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

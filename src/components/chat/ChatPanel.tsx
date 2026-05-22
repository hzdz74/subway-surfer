'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/lib/utils';
import { ChatMessage } from '@/types';
import ChatMessageBubble from './ChatMessage';
import ChatInput from './ChatInput';
import { AlertTriangle } from 'lucide-react';

const MOCK_RESPONSES: Record<string, string> = {
  default:
    'Merci pour votre question. Sur la base des informations disponibles et de la zone anatomique sélectionnée, voici ce que je peux vous dire :\n\nIl est important de noter que les symptômes peuvent varier d\'une personne à l\'autre. Je vous recommande de consulter un professionnel de santé pour un diagnostic précis.\n\n⚠️ **Cette réponse est à titre informatif uniquement et ne remplace pas un avis médical professionnel.**',
  genou:
    'Le genou est une articulation complexe composée de ligaments (LCA, LCP, ligaments latéraux), de ménisques, et du cartilage. Les douleurs au genou peuvent être causées par :\n\n• **Arthrose** : dégradation du cartilage\n• **Lésion méniscale** : suite à un traumatisme ou usure\n• **Tendinite** : inflammation des tendons\n• **Ligamentoplastie** : rupture ligamentaire\n\nPour un diagnostic précis, consultez un orthopédiste ou un rhumatologue.',
  coeur:
    'Le cœur est un organe vital qui bat environ 100 000 fois par jour. Les pathologies cardiaques courantes incluent :\n\n• **Hypertension artérielle** : pression excessive sur les artères\n• **Arythmie** : anomalies du rythme cardiaque\n• **Infarctus** : obstruction d\'une artère coronaire\n• **Insuffisance cardiaque** : incapacité du cœur à pomper suffisamment\n\n🚨 En cas de douleur thoracique intense, appelez le **15 (SAMU)** immédiatement.',
  dos: 'Les douleurs dorsales touchent 80% des adultes à un moment de leur vie. Les causes principales :\n\n• **Lombalgie commune** : contracture musculaire ou usure discale\n• **Hernie discale** : saillie d\'un disque intervertébral\n• **Sciatique** : compression du nerf sciatique\n• **Scoliose** : déviation de la colonne\n\nLe traitement peut inclure kinésithérapie, ostéopathie, ou dans les cas sévères, une chirurgie.',
};

function getMockResponse(query: string, zoneLabel?: string): string {
  const lower = (query + (zoneLabel ?? '')).toLowerCase();
  if (lower.includes('genou') || lower.includes('knee')) return MOCK_RESPONSES.genou;
  if (lower.includes('coeur') || lower.includes('cardiaque')) return MOCK_RESPONSES.coeur;
  if (lower.includes('dos') || lower.includes('lombaire') || lower.includes('sciatique')) return MOCK_RESPONSES.dos;
  return MOCK_RESPONSES.default;
}

export default function ChatPanel() {
  const { chatMessages, isChatLoading, addMessage, setChatLoading, selectedZone } =
    useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setChatLoading(true);
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const response = getMockResponse(text, selectedZone?.label);
    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setIsTyping(false);
    addMessage(assistantMsg);
    setChatLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 mx-3 mt-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs leading-relaxed flex-shrink-0">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          L&apos;IA fournit des informations générales uniquement.{' '}
          <strong>Consultez un médecin</strong> pour tout diagnostic ou traitement.
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
      >
        {chatMessages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sky-400 text-xs">AI</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        <ChatInput onSend={handleSend} disabled={isChatLoading} selectedZone={selectedZone} />
      </div>
    </div>
  );
}

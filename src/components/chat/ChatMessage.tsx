'use client';

import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  message: ChatMessage;
}

function renderMarkdown(text: string) {
  return text
    .split('\n')
    .map((line, i) => {
      // Bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });

      // Bullet point
      if (line.startsWith('• ')) {
        return (
          <li key={i} className="ml-3 list-disc">
            {parts}
          </li>
        );
      }
      if (line === '') return <br key={i} />;
      return (
        <p key={i} className="leading-relaxed">
          {parts}
        </p>
      );
    });
}

export default function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-end gap-2', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold',
          isUser
            ? 'bg-sky-500/30 border border-sky-500/50 text-sky-300'
            : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
        )}
      >
        {isUser ? 'Moi' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-sky-500/20 border border-sky-500/30 text-white rounded-br-sm'
            : 'bg-white/5 border border-white/10 text-gray-100 rounded-bl-sm'
        )}
      >
        <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
        <span className="block mt-1.5 text-[10px] text-white/30">
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

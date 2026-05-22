'use client';

import { create } from 'zustand';
import { AppState, BodyZone, AnatomyLayer, ChatMessage } from '@/types';
import { generateId } from '@/lib/utils';

export const useAppStore = create<AppState>((set) => ({
  selectedZone: null,
  activeLayer: 'skin',
  chatMessages: [
    {
      id: 'init-msg',
      role: 'assistant',
      content:
        'Bonjour ! Je suis votre assistant médical IA. Cliquez sur une zone du modèle anatomique pour obtenir des informations ciblées, ou posez-moi directement votre question. \n\n⚠️ **Rappel important** : Je ne remplace en aucun cas l\'avis d\'un médecin qualifié.',
      timestamp: new Date(0),
    },
  ],
  isChatLoading: false,
  activePanel: 'chat',
  userLocation: null,

  setSelectedZone: (zone: BodyZone | null) => {
    set({ selectedZone: zone });
    if (zone) {
      const welcomeMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Zone sélectionnée : **${zone.label}** (système ${zone.system}).\n\nQue souhaitez-vous savoir sur cette zone ? Je peux vous informer sur les pathologies courantes, les symptômes associés, ou vous aider à trouver un spécialiste.`,
        timestamp: new Date(Date.now()),
      };
      set((state) => ({
        chatMessages: [...state.chatMessages, welcomeMsg],
        activePanel: 'chat',
      }));
    }
  },

  setActiveLayer: (layer: AnatomyLayer) => set({ activeLayer: layer }),

  addMessage: (message: ChatMessage) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),

  setChatLoading: (loading: boolean) => set({ isChatLoading: loading }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  setUserLocation: (loc) => set({ userLocation: loc }),
}));

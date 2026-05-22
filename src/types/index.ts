export type AnatomyLayer = 'skin' | 'muscle' | 'skeleton' | 'nervous' | 'organs';

export interface BodyZone {
  id: string;
  label: string;
  system: string;
  position: [number, number, number];
  specialistType: string;
  keywords: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  rating: number;
  reviewCount: number;
  url: string;
  badge?: string;
}

export interface MedicalPlace {
  id: string;
  name: string;
  address: string;
  type: string;
  lat: number;
  lng: number;
  rating?: number;
  distance?: string;
}

export interface AppState {
  selectedZone: BodyZone | null;
  activeLayer: AnatomyLayer;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  activePanel: 'chat' | 'maps' | 'shop' | null;
  userLocation: { lat: number; lng: number } | null;
  setSelectedZone: (zone: BodyZone | null) => void;
  setActiveLayer: (layer: AnatomyLayer) => void;
  addMessage: (message: ChatMessage) => void;
  setChatLoading: (loading: boolean) => void;
  setActivePanel: (panel: 'chat' | 'maps' | 'shop' | null) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
}

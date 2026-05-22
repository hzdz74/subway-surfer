'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, Phone, Clock, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { MOCK_PLACES } from '@/lib/mockData';
import { MedicalPlace } from '@/types';
import { cn } from '@/lib/utils';

const SPECIALIST_LABELS: Record<string, string> = {
  orthopedist: 'Orthopédiste',
  cardiologist: 'Cardiologue',
  neurologist: 'Neurologue',
  osteopath: 'Ostéopathe',
  gastroenterologist: 'Gastro-entérologue',
  pulmonologist: 'Pneumologue',
  default: 'Médecin généraliste',
};

function PlaceCard({ place, selected, onClick }: { place: MedicalPlace; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all duration-150',
        selected
          ? 'bg-sky-500/15 border-sky-500/40 shadow-sm shadow-sky-500/20'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{place.name}</p>
          <p className="text-xs text-sky-400 mt-0.5">{place.type}</p>
          <p className="text-xs text-white/50 mt-1 leading-tight truncate">{place.address}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-sky-300 font-medium">{place.distance}</span>
          {place.rating && (
            <div className="flex items-center gap-0.5">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-white/60">{place.rating}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 transition-colors">
          <Phone size={10} />
          <span>Appeler</span>
        </button>
        <button className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 transition-colors">
          <Navigation size={10} />
          <span>Itinéraire</span>
        </button>
        <div className="flex items-center gap-1 text-[10px] text-white/40">
          <Clock size={10} />
          <span>Ouvert aujourd&apos;hui</span>
        </div>
      </div>
    </button>
  );
}

function MockMap({ places, selected }: { places: MedicalPlace[]; selected: MedicalPlace | null }) {
  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-800/60 border border-white/10">
      {/* Grid lines simulating a map */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* "Streets" */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/8" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/8" />
        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/5" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/5" />
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/5" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/5" />
      </div>

      {/* User location */}
      <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-lg shadow-sky-500/50">
          <div className="absolute inset-0 rounded-full bg-sky-500/40 animate-ping" />
        </div>
      </div>

      {/* Place markers */}
      {places.map((place, i) => {
        const positions = [
          { left: '30%', top: '25%' },
          { left: '70%', top: '35%' },
          { left: '20%', top: '65%' },
          { left: '75%', top: '70%' },
          { left: '55%', top: '20%' },
        ];
        const pos = positions[i % positions.length];
        const isSelected = selected?.id === place.id;

        return (
          <div
            key={place.id}
            className="absolute"
            style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -100%)' }}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all',
                isSelected
                  ? 'bg-sky-500 scale-125 border-2 border-white'
                  : 'bg-red-500/80 border border-red-400'
              )}
            >
              <MapPin size={12} className="text-white" />
            </div>
            {isSelected && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white text-gray-900 text-[9px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-md">
                {place.name.split(' ').slice(0, 3).join(' ')}
              </div>
            )}
          </div>
        );
      })}

      {/* Google Maps watermark style */}
      <div className="absolute bottom-2 right-2 text-[9px] text-white/30 font-medium">
        Maps — Zone 10km
      </div>

      {/* Integration hint */}
      <div className="absolute top-2 left-2 text-[9px] text-white/40 bg-black/30 px-2 py-0.5 rounded-full">
        Google Maps API — Mock
      </div>
    </div>
  );
}

export default function MapsModule() {
  const { selectedZone, userLocation, setUserLocation } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<MedicalPlace | null>(null);

  const specialistType = selectedZone?.specialistType ?? 'default';
  const specialistLabel = SPECIALIST_LABELS[specialistType] ?? SPECIALIST_LABELS.default;

  const filteredPlaces = MOCK_PLACES.filter((p) => {
    if (!selectedZone) return true;
    if (selectedZone.specialistType === 'cardiologist') return p.type.toLowerCase().includes('cardio') || p.type.includes('Hôpital');
    if (selectedZone.specialistType === 'osteopath') return p.type.toLowerCase().includes('osté') || p.type.toLowerCase().includes('kiné');
    if (selectedZone.specialistType === 'orthopedist') return p.type.toLowerCase().includes('ortho') || p.type.toLowerCase().includes('sport') || p.type.toLowerCase().includes('réédu');
    return true;
  });

  const displayPlaces = filteredPlaces.length > 0 ? filteredPlaces : MOCK_PLACES;

  const requestLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationGranted(true);
          setLoading(false);
        },
        () => {
          // Fallback to Paris if denied
          setUserLocation({ lat: 48.8566, lng: 2.3522 });
          setLocationGranted(true);
          setLoading(false);
        }
      );
    } else {
      setUserLocation({ lat: 48.8566, lng: 2.3522 });
      setLocationGranted(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) setLocationGranted(true);
  }, [userLocation]);

  if (!locationGranted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
          <Navigation size={28} className="text-sky-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-base">Trouver un professionnel</h3>
          <p className="text-white/50 text-sm mt-1 leading-relaxed">
            Autorisez la géolocalisation pour trouver les{' '}
            <span className="text-sky-400">{specialistLabel}s</span> près de vous.
          </p>
        </div>
        <button
          onClick={requestLocation}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          {loading ? 'Localisation...' : 'Activer la localisation'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 flex-shrink-0">
        <div>
          <h3 className="text-white font-semibold text-sm">Professionnels à proximité</h3>
          <p className="text-white/40 text-xs mt-0.5">
            {selectedZone ? `${specialistLabel}s` : 'Tous'} · Rayon 20km
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Localisé</span>
        </div>
      </div>

      {/* Map */}
      <div className="px-3 flex-shrink-0">
        <MockMap places={displayPlaces} selected={selectedPlace} />
      </div>

      {/* Places list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {displayPlaces.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            selected={selectedPlace?.id === place.id}
            onClick={() => setSelectedPlace(place.id === selectedPlace?.id ? null : place)}
          />
        ))}
      </div>
    </div>
  );
}

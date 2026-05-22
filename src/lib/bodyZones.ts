import { BodyZone } from '@/types';

export const BODY_ZONES: BodyZone[] = [
  {
    id: 'head',
    label: 'Tête',
    system: 'neurologique',
    position: [0, 1.7, 0],
    specialistType: 'neurologist',
    keywords: ['neurologie', 'maux de tête', 'migraine', 'cerveau'],
  },
  {
    id: 'neck',
    label: 'Cou',
    system: 'musculosquelettique',
    position: [0, 1.5, 0],
    specialistType: 'osteopath',
    keywords: ['cervicales', 'torticolis', 'colonne cervicale'],
  },
  {
    id: 'chest',
    label: 'Thorax',
    system: 'cardiaque',
    position: [0, 1.2, 0],
    specialistType: 'cardiologist',
    keywords: ['coeur', 'poumons', 'thorax', 'cardio'],
  },
  {
    id: 'heart',
    label: 'Coeur',
    system: 'cardiaque',
    position: [0.15, 1.25, 0.1],
    specialistType: 'cardiologist',
    keywords: ['coeur', 'arythmie', 'palpitations', 'tension'],
  },
  {
    id: 'lungs',
    label: 'Poumons',
    system: 'respiratoire',
    position: [0, 1.2, 0.1],
    specialistType: 'pulmonologist',
    keywords: ['respiration', 'souffle', 'bronches', 'toux'],
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    system: 'digestif',
    position: [0, 1.0, 0],
    specialistType: 'gastroenterologist',
    keywords: ['estomac', 'foie', 'intestins', 'digestion'],
  },
  {
    id: 'spine',
    label: 'Colonne vertébrale',
    system: 'musculosquelettique',
    position: [0, 1.1, -0.1],
    specialistType: 'orthopedist',
    keywords: ['dos', 'lombaires', 'vertèbres', 'sciatique'],
  },
  {
    id: 'left_shoulder',
    label: 'Épaule gauche',
    system: 'musculosquelettique',
    position: [-0.4, 1.4, 0],
    specialistType: 'orthopedist',
    keywords: ['épaule', 'coiffe des rotateurs', 'tendinite'],
  },
  {
    id: 'right_shoulder',
    label: 'Épaule droite',
    system: 'musculosquelettique',
    position: [0.4, 1.4, 0],
    specialistType: 'orthopedist',
    keywords: ['épaule', 'coiffe des rotateurs', 'tendinite'],
  },
  {
    id: 'left_knee',
    label: 'Genou gauche',
    system: 'musculosquelettique',
    position: [-0.2, 0.5, 0],
    specialistType: 'orthopedist',
    keywords: ['genou', 'ligaments', 'ménisque', 'arthrose'],
  },
  {
    id: 'right_knee',
    label: 'Genou droit',
    system: 'musculosquelettique',
    position: [0.2, 0.5, 0],
    specialistType: 'orthopedist',
    keywords: ['genou', 'ligaments', 'ménisque', 'arthrose'],
  },
  {
    id: 'lower_back',
    label: 'Bas du dos',
    system: 'musculosquelettique',
    position: [0, 0.9, -0.1],
    specialistType: 'osteopath',
    keywords: ['lombaires', 'lumbago', 'sciatique', 'lombalgie'],
  },
  {
    id: 'hip',
    label: 'Hanches',
    system: 'musculosquelettique',
    position: [0, 0.85, 0],
    specialistType: 'orthopedist',
    keywords: ['hanche', 'articulation coxo-fémorale', 'prothèse'],
  },
  {
    id: 'sciatic_nerve',
    label: 'Nerf sciatique',
    system: 'neurologique',
    position: [0.15, 0.7, 0],
    specialistType: 'neurologist',
    keywords: ['sciatique', 'irradiation', 'névralgie', 'nerf'],
  },
];

export function getZoneById(id: string): BodyZone | undefined {
  return BODY_ZONES.find((z) => z.id === id);
}

export const LAYER_LABELS: Record<string, string> = {
  skin: 'Peau',
  muscle: 'Musculature',
  skeleton: 'Squelette',
  nervous: 'Syst. Nerveux',
  organs: 'Organes',
};

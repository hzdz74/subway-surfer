import * as THREE from 'three';
import { Gender } from '@/types';

export interface BodySpec {
  // Vertical positions (Y coordinates)
  topHead: number;
  midHead: number;
  chin: number;
  neckBase: number;
  shoulderY: number;
  chestY: number;
  bustY: number;
  midTorso: number;
  navelY: number;
  waistY: number;
  hipY: number;
  crotchY: number;
  kneeY: number;
  ankleY: number;
  footY: number;
  // Widths and depths
  headWidth: number;
  headDepth: number;
  headHeight: number;
  neckRadius: number;
  shoulderWidth: number;
  chestWidth: number;
  chestDepth: number;
  bustSize: number; // 0 for male, positive for female
  waistWidth: number;
  waistDepth: number;
  hipWidth: number;
  hipDepth: number;
  // Arms
  upperArmLength: number;
  upperArmRadius: number;
  forearmLength: number;
  forearmRadius: number;
  wristRadius: number;
  handLength: number;
  // Legs
  thighLength: number;
  thighRadius: number;
  shinLength: number;
  shinRadius: number;
  ankleRadius: number;
  footLength: number;
  footWidth: number;
  // Aesthetic
  muscleDefinition: number; // 0..1
  hairStyle: 'short' | 'medium' | 'long';
  hairColor: string;
}

export const BODY_SPECS: Record<Gender, BodySpec> = {
  male: {
    topHead: 1.85,
    midHead: 1.78,
    chin: 1.67,
    neckBase: 1.56,
    shoulderY: 1.49,
    chestY: 1.35,
    bustY: 1.30,
    midTorso: 1.18,
    navelY: 1.05,
    waistY: 1.0,
    hipY: 0.86,
    crotchY: 0.78,
    kneeY: 0.42,
    ankleY: 0.04,
    footY: 0.0,
    headWidth: 0.115,
    headDepth: 0.135,
    headHeight: 0.145,
    neckRadius: 0.07,
    shoulderWidth: 0.46,
    chestWidth: 0.4,
    chestDepth: 0.22,
    bustSize: 0,
    waistWidth: 0.32,
    waistDepth: 0.19,
    hipWidth: 0.36,
    hipDepth: 0.22,
    upperArmLength: 0.32,
    upperArmRadius: 0.062,
    forearmLength: 0.3,
    forearmRadius: 0.05,
    wristRadius: 0.04,
    handLength: 0.18,
    thighLength: 0.42,
    thighRadius: 0.1,
    shinLength: 0.4,
    shinRadius: 0.07,
    ankleRadius: 0.05,
    footLength: 0.22,
    footWidth: 0.09,
    muscleDefinition: 0.75,
    hairStyle: 'short',
    hairColor: '#3a2618',
  },
  female: {
    topHead: 1.78,
    midHead: 1.72,
    chin: 1.62,
    neckBase: 1.52,
    shoulderY: 1.45,
    chestY: 1.32,
    bustY: 1.25,
    midTorso: 1.15,
    navelY: 1.03,
    waistY: 0.98,
    hipY: 0.84,
    crotchY: 0.76,
    kneeY: 0.42,
    ankleY: 0.04,
    footY: 0.0,
    headWidth: 0.105,
    headDepth: 0.125,
    headHeight: 0.135,
    neckRadius: 0.055,
    shoulderWidth: 0.36,
    chestWidth: 0.3,
    chestDepth: 0.17,
    bustSize: 0.085,
    waistWidth: 0.22,
    waistDepth: 0.14,
    hipWidth: 0.4,
    hipDepth: 0.22,
    upperArmLength: 0.3,
    upperArmRadius: 0.05,
    forearmLength: 0.28,
    forearmRadius: 0.04,
    wristRadius: 0.033,
    handLength: 0.16,
    thighLength: 0.42,
    thighRadius: 0.094,
    shinLength: 0.38,
    shinRadius: 0.06,
    ankleRadius: 0.043,
    footLength: 0.2,
    footWidth: 0.08,
    muscleDefinition: 0.4,
    hairStyle: 'long',
    hairColor: '#4a2c1e',
  },
};

export const LAYER_MATERIALS = {
  skin: {
    body: '#e8b89e',
    accent: '#d49a82',
    hair: 'hair',
    detail: '#c97f6a',
    emissive: '#3a1a10',
    emissiveIntensity: 0.05,
    metalness: 0.05,
    roughness: 0.55,
    opacity: 1,
  },
  muscle: {
    body: '#b53a30',
    accent: '#c8453a',
    hair: '#1a1a1a',
    detail: '#8a2820',
    emissive: '#400804',
    emissiveIntensity: 0.15,
    metalness: 0.1,
    roughness: 0.45,
    opacity: 1,
  },
  skeleton: {
    body: '#f2eada',
    accent: '#e5d9c4',
    hair: '#1a1a1a',
    detail: '#c4b599',
    emissive: '#181410',
    emissiveIntensity: 0.04,
    metalness: 0.15,
    roughness: 0.7,
    opacity: 1,
  },
  nervous: {
    body: '#e8b89e',
    accent: '#fbbf24',
    hair: 'hair',
    detail: '#fbbf24',
    emissive: '#1a0d05',
    emissiveIntensity: 0.05,
    metalness: 0.05,
    roughness: 0.55,
    opacity: 0.55,
  },
  organs: {
    body: '#e8b89e',
    accent: '#a78bfa',
    hair: 'hair',
    detail: '#a78bfa',
    emissive: '#1a0d05',
    emissiveIntensity: 0.05,
    metalness: 0.05,
    roughness: 0.55,
    opacity: 0.45,
  },
} as const;

// Profile for the torso silhouette (LatheGeometry).
// Points are (radius, height) where Y goes from hip to shoulder.
// We mirror this for symmetric rotation. Side view.
export function buildTorsoProfile(spec: BodySpec): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  // Top of shoulders (small radius — neck base)
  pts.push(new THREE.Vector2(0.001, spec.shoulderY - spec.hipY + 0.05));
  pts.push(new THREE.Vector2(spec.neckRadius * 1.1, spec.shoulderY - spec.hipY + 0.03));
  // Trapezius slope
  pts.push(new THREE.Vector2((spec.shoulderWidth * 0.5) * 0.6, spec.shoulderY - spec.hipY));
  pts.push(new THREE.Vector2(spec.shoulderWidth * 0.42, spec.shoulderY - spec.hipY - 0.04));
  // Chest expansion
  pts.push(new THREE.Vector2(spec.chestWidth * 0.5, spec.chestY - spec.hipY));
  pts.push(new THREE.Vector2(spec.chestWidth * 0.5, spec.bustY - spec.hipY));
  // Waist taper
  pts.push(new THREE.Vector2(spec.waistWidth * 0.5 * 1.05, spec.midTorso - spec.hipY));
  pts.push(new THREE.Vector2(spec.waistWidth * 0.5, spec.waistY - spec.hipY));
  pts.push(new THREE.Vector2(spec.waistWidth * 0.5 + 0.01, spec.navelY - spec.hipY));
  // Hip flare
  pts.push(new THREE.Vector2(spec.hipWidth * 0.45, spec.hipY - spec.hipY + 0.05));
  pts.push(new THREE.Vector2(spec.hipWidth * 0.5, spec.hipY - spec.hipY));
  // Close the bottom
  pts.push(new THREE.Vector2(0.001, spec.hipY - spec.hipY - 0.02));
  return pts;
}

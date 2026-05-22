import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedAssist 3D — Assistant Médical IA',
  description:
    'Application MedTech révolutionnaire : modèle anatomique 3D interactif, assistant IA de diagnostic, géolocalisation de professionnels et matériel médical certifié.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className={`${inter.className} h-full`}>{children}</body>
    </html>
  );
}

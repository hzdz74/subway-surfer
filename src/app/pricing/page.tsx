'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const FEATURES_FREE = [
  'Modèle 3D anatomique (couche peau)',
  '3 zones corporelles',
  'Assistant IA limité (5 msg/jour)',
  'Recherche de professionnels',
];

const FEATURES_PRO = [
  'Modèle 3D — toutes les couches (5)',
  'Toutes les zones anatomiques (14)',
  'Assistant IA illimité + contexte complet',
  'Modèle homme & femme',
  'Géolocalisation des professionnels',
  'Catalogue matériel médical certifié',
  'Export PDF des consultations',
  'Support prioritaire',
];

const FEATURES_ENTERPRISE = [
  'Tout le plan Pro',
  'Accès multi-utilisateurs (équipe)',
  'API REST complète',
  'Intégration EHR / dossier patient',
  'SSO (SAML / OAuth2)',
  'Tableau de bord analytics',
  'SLA 99,9% + support dédié',
  'Marque blanche sur demande',
];

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  planKey,
  highlighted,
  cta,
}: {
  name: string;
  price: number | null;
  description: string;
  features: string[];
  planKey: string | null;
  highlighted: boolean;
  cta: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);

  const handleSubscribe = async () => {
    if (!planKey) {
      router.push('/');
      return;
    }
    if (!showEmail) {
      setShowEmail(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? 'Erreur lors de la création de la session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
        highlighted
          ? 'bg-gradient-to-b from-sky-500/20 to-blue-600/10 border-2 border-sky-500/60 shadow-2xl shadow-sky-500/20 scale-105'
          : 'bg-white/5 border border-white/10 hover:border-white/20'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-sky-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
            LE PLUS POPULAIRE
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
        <p className="text-white/50 text-sm">{description}</p>
      </div>

      <div className="mb-8">
        {price === null ? (
          <span className="text-4xl font-bold text-white">Gratuit</span>
        ) : (
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold text-white">{price}€</span>
            <span className="text-white/50 text-sm mb-1">/mois</span>
          </div>
        )}
      </div>

      <ul className="flex-1 space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {showEmail && planKey && (
        <input
          type="email"
          placeholder="Votre adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-sky-400"
        />
      )}

      <button
        onClick={handleSubscribe}
        disabled={loading || (showEmail && !email)}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 ${
          highlighted
            ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30'
            : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
        }`}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Redirection...
          </span>
        ) : showEmail && planKey ? (
          'Continuer vers le paiement →'
        ) : (
          cta
        )}
      </button>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      {/* Header */}
      <header className="border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-white">MedAssist 3D</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-white/55 hover:text-white transition-colors"
          >
            ← Retour à l&apos;application
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Lancement — 30 jours offerts sur tous les plans payants
        </div>
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent leading-tight">
          La médecine 3D,
          <br />
          à votre portée
        </h1>
        <p className="text-white/55 text-lg leading-relaxed">
          Explorez l&apos;anatomie humaine, consultez un assistant IA médical et trouvez des spécialistes —
          <br className="hidden md:block" />
          tout en un seul outil. Choisissez le plan adapté à vos besoins.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <PricingCard
            name="Gratuit"
            price={null}
            description="Pour découvrir MedAssist 3D sans engagement."
            features={FEATURES_FREE}
            planKey={null}
            highlighted={false}
            cta="Commencer gratuitement →"
          />
          <PricingCard
            name="Pro"
            price={29}
            description="L'accès complet pour les patients et particuliers."
            features={FEATURES_PRO}
            planKey="pro"
            highlighted={true}
            cta="Démarrer l'essai gratuit →"
          />
          <PricingCard
            name="Enterprise"
            price={99}
            description="Pour les cabinets médicaux et équipes de santé."
            features={FEATURES_ENTERPRISE}
            planKey="enterprise"
            highlighted={false}
            cta="Contacter l'équipe →"
          />
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-t border-white/8">
        <div className="max-w-4xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10 text-center">
          {[
            { icon: '🔒', title: 'Paiement sécurisé', body: 'Cryptage SSL 256-bit. Vos données bancaires ne nous parviennent jamais — gérées par Stripe.' },
            { icon: '↩️', title: 'Annulation à tout moment', body: 'Sans engagement. Annulez en un clic depuis votre espace client, sans frais.' },
            { icon: '🇪🇺', title: 'Conforme RGPD', body: 'Hébergement EU, données médicales chiffrées, conformité HDS en cours de certification.' },
          ].map(({ icon, title, body }) => (
            <div key={title}>
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-10">Questions fréquentes</h2>
        <div className="space-y-6">
          {[
            {
              q: 'Le modèle 3D fonctionne-t-il sur mobile ?',
              a: "Oui. L'application est responsive — le modèle 3D est accessible sur tablette et smartphone via un panneau coulissant.",
            },
            {
              q: "L'assistant IA remplace-t-il un médecin ?",
              a: "Non. MedAssist 3D est un outil d'information et d'orientation. Il ne délivre pas de diagnostic médical. Consultez toujours un professionnel de santé qualifié.",
            },
            {
              q: 'Comment fonctionne l\'essai gratuit 30 jours ?',
              a: 'Vous souscrivez au plan de votre choix et votre carte est débitée uniquement à l\'issue des 30 premiers jours. Annulez avant et vous ne payez rien.',
            },
            {
              q: 'Puis-je changer de plan en cours de route ?',
              a: 'Oui, à tout moment depuis votre espace client. La différence est calculée au prorata du mois en cours.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group border-b border-white/10 pb-4">
              <summary className="cursor-pointer text-white/85 font-medium text-sm flex items-center justify-between">
                {q}
                <span className="text-white/40 group-open:rotate-180 transition-transform text-lg">↓</span>
              </summary>
              <p className="mt-3 text-white/50 text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

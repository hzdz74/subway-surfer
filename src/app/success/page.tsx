'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    // In production: fetch session details from your backend to get the plan
    // For now we parse plan from session metadata via a GET endpoint
    fetch(`/api/stripe/checkout?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d) => setPlan(d.plan ?? 'Pro'))
      .catch(() => setPlan('Pro'));
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Abonnement activé !</h1>
        <p className="text-white/55 mb-2">
          Bienvenue sur MedAssist 3D{plan ? ` — plan ${plan}` : ''}.
        </p>
        <p className="text-white/40 text-sm mb-10">
          Un email de confirmation a été envoyé à votre adresse. Votre accès complet est immédiatement disponible.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-sky-500/30"
        >
          Accéder à l&apos;application →
        </Link>

        <p className="mt-8 text-white/30 text-xs">
          Gérez votre abonnement depuis votre{' '}
          <Link href="/api/stripe/portal" className="underline hover:text-white/50 transition-colors">
            espace client Stripe
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

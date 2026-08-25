'use client';

import { DashboardShell } from '@/components/DashboardShell';
import { Check, Star, WalletCards } from 'lucide-react';

const plans = [
  { name: 'Gratuit', price: '0 MAD', status: 'Actif', features: ['1 coiffeur', 'Réservations illimitées', 'Page salon'] },
  { name: 'Pro', price: '199 MAD/mois', status: 'À venir', features: ['Jusqu’à 5 coiffeurs', 'Statistiques avancées', 'Support prioritaire'] },
  { name: 'Salon', price: '499 MAD/mois', status: 'À venir', features: ['Coiffeurs illimités', 'Multi-salons', 'API & intégrations'] },
];

export default function Facturation() {
  return (
    <DashboardShell type="admin" title="Facturation" subtitle="Abonnements, plans et revenus">
      <div className="dash-content">
        <div className="billing-grid">
          {plans.map((p) => (
            <article key={p.name} className={'billing-card ' + (p.status === 'Actif' ? 'current' : '')}>
              <h3>{p.name}</h3>
              <b>{p.price}</b>
              <em>{p.status}</em>
              <ul>
                {p.features.map((f) => <li key={f}><Check size={14} /> {f}</li>)}
              </ul>
              <button disabled={p.status !== 'Actif'}>{p.status === 'Actif' ? 'Plan actuel' : 'Bientôt disponible'}</button>
            </article>
          ))}
        </div>
        <section className="chart-card" style={{ marginTop: 20 }}>
          <header><div><span className="dash-kicker">REVENU PLATEFORME</span><h3>Suivi</h3></div></header>
          <p style={{ color: 'var(--muted)', padding: '20px 0' }}>
            <WalletCards style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Module de paiement en ligne (acompte anti-no-show) prévu en V3. Aucune commission n’est appliquée pour l’instant.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}

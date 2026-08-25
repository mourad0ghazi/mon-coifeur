'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/DashboardShell';
import {
  AlertTriangle, ArrowUpRight, CalendarCheck, Check, ChevronRight,
  Clock3, Scissors, ShieldCheck, Star, Store, UserPlus, UsersRound,
} from 'lucide-react';

export default function Admin() {
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    fetch('/api/v1/admin/stats').then((r) => r.ok ? r.json() : null).then((j) => j && setStats(j.data));
    fetch('/api/v1/admin/partner-applications?status=EN_ATTENTE').then((r) => r.ok ? r.json() : null).then((j) => j && setPending(j.data.total));
  }, []);

  const actions = [
    { n: pending, label: 'Demandes de coiffeur', sub: pending ? 'À valider maintenant' : 'Aucune en attente', href: '/admin/validations', cta: 'Traiter' },
    { n: stats?.appts ?? 0, label: 'Rendez-vous', sub: 'Réservations totales', href: '/admin/rdv', cta: 'Voir' },
    { n: stats?.users ?? 0, label: 'Utilisateurs', sub: 'Comptes enregistrés', href: '/admin/utilisateurs', cta: 'Gérer' },
    { n: stats?.partners ?? 0, label: 'Coiffeurs actifs', sub: 'Profils validés', href: '/admin/coiffeurs', cta: 'Voir' },
  ];

  return (
    <DashboardShell type="admin" title="Vue d’ensemble" subtitle="Tableau de bord Super-Admin · données en temps réel">
      <div className="dash-content admin-content">
        <div className="admin-kpis kpi-grid">
          <div><span>RDV TOTAUX</span><b>{stats?.appts ?? '—'}</b><small>{stats?.upcoming ?? 0} à venir</small><CalendarCheck /></div>
          <div><span>UTILISATEURS</span><b>{stats?.users ?? '—'}</b><small>clients + pros</small><UsersRound /></div>
          <div><span>COIFFEURS ACTIFS</span><b>{stats?.partners ?? '—'}</b><small>validés</small><Scissors /></div>
          <div><span>EN ATTENTE</span><b className={pending ? 'warn' : ''}>{pending}</b><small>candidatures</small><AlertTriangle /></div>
          <div><span>REVENU</span><b>{stats?.revenue ?? '—'} <small style={{ fontSize: 14 }}>MAD</small></b><small>RDV confirmés/terminés</small><Star /></div>
        </div>

        <section className="actions-required">
          <header>
            <div><span><AlertTriangle /> ACCÈS RAPIDES</span><h2>Gérer la plateforme.</h2><p>Chaque section est reliée au site et agit en direct.</p></div>
            <small>{actions.length} raccourcis</small>
          </header>
          <div>
            {actions.map((a) => (
              <Link key={a.label} href={a.href}>
                <b>{a.n}</b>
                <span><strong>{a.label}</strong><small>{a.sub}</small></span>
                <button type="button">{a.cta} <ChevronRight /></button>
              </Link>
            ))}
          </div>
        </section>

        <div className="admin-grid">
          <section className="chart-card">
            <header>
              <div><span className="dash-kicker">PILOTAGE</span><h3>Liens directs</h3></div>
            </header>
            <div className="admin-quicklinks">
              <Link href="/admin/validations" className="ql"><ShieldCheck /><span><b>Validations</b><small>Approuver les coiffeurs et leurs photos</small></span><ChevronRight /></Link>
              <Link href="/admin/utilisateurs" className="ql"><UsersRound /><span><b>Utilisateurs</b><small>Suspendre, bannir, changer les rôles</small></span><ChevronRight /></Link>
              <Link href="/admin/parametres" className="ql"><Store /><span><b>Paramètres</b><small>Horaires, langues, sécurité, fonctionnalités</small></span><ChevronRight /></Link>
              <Link href="/admin/rdv" className="ql"><CalendarCheck /><span><b>Rendez-vous</b><small>Suivre toutes les réservations</small></span><ChevronRight /></Link>
              <Link href="/admin/coiffeurs" className="ql"><Scissors /><span><b>Coiffeurs</b><small>Comptes pros et performances</small></span><ChevronRight /></Link>
              <Link href="/" className="ql"><ArrowUpRight /><span><b>Voir le site</b><small>Aller à l’accueil public</small></span><ChevronRight /></Link>
            </div>
          </section>

          <section className="live-feed">
            <header><div><span className="live-dot" /> STATUT</div></header>
            <article><time>●</time><b><Check /></b><span><strong>Système opérationnel</strong><small>Tous les services sont en ligne</small></span></article>
            <article><time>●</time><b><ShieldCheck /></b><span><strong>{stats?.partners ?? 0} coiffeurs</strong><small>comptes actifs</small></span></article>
            <article><time>●</time><b><Clock3 /></b><span><strong>{stats?.upcoming ?? 0} RDV</strong><small>à venir</small></span></article>
            <article><time>●</time><b><UserPlus /></b><span><strong>{stats?.users ?? 0} utilisateurs</strong><small>en base</small></span></article>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

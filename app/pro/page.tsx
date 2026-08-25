'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/DashboardShell';
import {
  Check, ChevronRight, Clock3, MessageCircle, MoreHorizontal, Scissors, Star, UserX, X,
} from 'lucide-react';
import { formatPhone, whatsappLink } from '@/lib/whatsapp';

type Appointment = {
  id: string;
  reference: string;
  barber_id: string;
  barber_name: string;
  salon_name: string;
  salon_neighborhood: string;
  client_user_id: string | null;
  client_phone: string;
  client_name: string | null;
  date: string;
  start_minutes: number;
  end_minutes: number;
  service_id: string;
  service_label: string;
  price_mad: number;
  note: string | null;
  status: string;
  channel: string;
};

const STATUSES: Record<string, { label: string; cls: string }> = {
  CONFIRME: { label: 'Confirmé', cls: 'confirmed' },
  EN_COURS: { label: 'En cours', cls: 'now' },
  TERMINE: { label: 'Terminé', cls: 'done' },
  ANNULE_CLIENT: { label: 'Annulé client', cls: 'cancelled' },
  ANNULE_COIFFEUR: { label: 'Annulé', cls: 'cancelled' },
  NO_SHOW: { label: 'No-show', cls: 'noshow' },
};

function fmt(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export default function Pro() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<any>({ todayAppointments: 0, todayRevenue: 0, weekRevenue: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(new Date().toISOString().slice(0, 10));
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today');

  async function load() {
    const date = filter === 'today' ? today : undefined;
    const [a, s] = await Promise.all([
      fetch(`/api/v1/pro/appointments${date ? `?date=${date}` : ''}`).then((r) => r.json()),
      fetch('/api/v1/pro/stats').then((r) => r.json()),
    ]);
    setAppts(a.data?.appointments || []);
    setStats(s.data || {});
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/v1/pro/appointments/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const j = await res.json();
      setAppts((list) => list.map((a) => (a.id === id ? j.data.appointment : a)));
    }
  }

  const visible = useMemo(() => {
    if (filter === 'all') return appts;
    return appts.filter((a) => !['TERMINE', 'ANNULE_CLIENT', 'ANNULE_COIFFEUR', 'NO_SHOW'].includes(a.status));
  }, [appts, filter]);

  const inProgress = appts.find((a) => a.status === 'EN_COURS');
  const upcoming = visible.filter((a) => a.status === 'CONFIRME' && a.date >= today);
  const dayLabel = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <DashboardShell title="Espace coiffeur" subtitle={dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}>
      <div className="dash-content">
        <div className="kpi-grid pro-kpis">
          <div><span>RDV {filter === 'today' ? "AUJOURD'HUI" : 'À VENIR'}</span><b>{upcoming.length}</b><small>confirmés</small></div>
          <div><span>RECETTE DU JOUR</span><b>{stats.todayRevenue} <em>MAD</em></b><small>{stats.todayAppointments} RDV</small></div>
          <div><span>CETTE SEMAINE</span><b>{stats.weekRevenue} <em>MAD</em></b><small>7 derniers jours</small></div>
          <div><span>NOTE MOYENNE</span><b>4,9 <Star fill="currentColor" /></b><small>avis vérifiés</small></div>
        </div>

        <div className="pro-toolbar">
          <div className="seg">
            {(['today', 'upcoming', 'all'] as const).map((f) => (
              <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                {f === 'today' ? "Aujourd'hui" : f === 'upcoming' ? 'À venir' : 'Historique'}
              </button>
            ))}
          </div>
          <Link href="/pro/agenda" className="text-link">Voir l'agenda <ChevronRight /></Link>
        </div>

        <div className="pro-layout">
          <section>
            {inProgress && (
              <article className="current-appt">
                <div className="time-now"><span>{fmt(inProgress.start_minutes)}</span><i/> EN COURS</div>
                <div className="client-row">
                  <span>{(inProgress.client_name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
                  <div><h3>{inProgress.client_name || 'Client'}</h3><p><b>{formatPhone(inProgress.client_phone)}</b></p></div>
                  <em>🟢 En cours</em>
                </div>
                <div className="service-row">
                  <Scissors /><span><b>{inProgress.service_label}</b><small>{inProgress.end_minutes - inProgress.start_minutes} min · {inProgress.price_mad} MAD</small></span>
                  {inProgress.note && <p>« {inProgress.note} »</p>}
                </div>
                <div className="current-actions">
                  <a className="finish" href={whatsappLink(inProgress.client_phone, `Salam ${inProgress.client_name?.split(' ')[0] || ''}, c'est ton coiffeur HLAQTI.`)} target="_blank" rel="noreferrer"><Check/> Terminer</a>
                  <button onClick={() => setStatus(inProgress.id, 'TERMINE')}><Check/> Marquer terminé</button>
                  <a className="wa" href={whatsappLink(inProgress.client_phone)} target="_blank" rel="noreferrer"><MessageCircle/> WhatsApp</a>
                  <button className="danger" onClick={() => setStatus(inProgress.id, 'NO_SHOW')}><UserX/> No-show</button>
                </div>
              </article>
            )}

            <div className="block-head appointments-head">
              <div><span className="dash-kicker">COMMANDES</span><h2>{filter === 'today' ? 'Les rendez-vous du jour' : filter === 'upcoming' ? 'Rendez-vous à venir' : 'Historique'}</h2></div>
              <span className="muted">{visible.length} résultat(s)</span>
            </div>

            {loading && <div className="pro-empty">Chargement…</div>}
            {!loading && visible.length === 0 && (
              <div className="pro-empty">
                <Scissors />
                <h3>Aucun rendez-vous</h3>
                <p>Les nouvelles réservations apparaîtront ici automatiquement.</p>
              </div>
            )}

            <div className="pro-appt-list">
              {visible.map((a) => {
                const st = STATUSES[a.status] || { label: a.status, cls: '' };
                const initials = (a.client_name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('');
                return (
                  <article key={a.id} className={'pro-appt ' + st.cls}>
                    <div className="pro-appt-time">
                      <b>{fmt(a.start_minutes)}</b>
                      <small>{fmt(a.end_minutes)}</small>
                    </div>
                    <i className="dot" />
                    <div className="pro-appt-client">
                      <span className="avatar">{initials}</span>
                      <div>
                        <h4>{a.client_name || 'Client sans nom'}</h4>
                        <p><a href={`tel:${a.client_phone}`}>{formatPhone(a.client_phone)}</a> · {a.salon_name}</p>
                        {a.note && <small className="note">📝 {a.note}</small>}
                      </div>
                    </div>
                    <div className="pro-appt-service">
                      <b>{a.service_label}</b>
                      <small>{a.end_minutes - a.start_minutes} min · {a.price_mad} MAD</small>
                    </div>
                    <em className={'pro-status ' + st.cls}>{st.label}</em>
                    <div className="pro-appt-actions">
                      <a className="wa-btn" href={whatsappLink(a.client_phone, `Salam, c'est ${a.barber_name} de ${a.salon_name} pour ton RDV HLAQTI.`)} target="_blank" rel="noreferrer" title="Écrire sur WhatsApp">
                        <MessageCircle size={16} /> WhatsApp
                      </a>
                      {a.status === 'CONFIRME' && (
                        <>
                          <button onClick={() => setStatus(a.id, 'EN_COURS')} title="Démarrer"><Check size={15} /></button>
                          <button onClick={() => setStatus(a.id, 'TERMINE')} title="Terminer"><Clock3 size={15} /></button>
                          <button className="danger" onClick={() => setStatus(a.id, 'ANNULE_COIFFEUR')} title="Annuler"><X size={15} /></button>
                        </>
                      )}
                      <button title="Plus"><MoreHorizontal size={16} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside>
            <div className="side-card">
              <div className="block-head"><h3>Raccourcis WhatsApp</h3></div>
              <p className="muted small">Le numéro du client est normalisé automatiquement, quel que soit son format de saisie (06…, +212…, 00212…).</p>
              <div className="wa-quick">
                {appts.filter((a) => a.status === 'CONFIRME').slice(0, 5).map((a) => (
                  <a key={a.id} href={whatsappLink(a.client_phone)} target="_blank" rel="noreferrer">
                    <MessageCircle size={14} /> {a.client_name || 'Client'} · {fmt(a.start_minutes)}
                  </a>
                ))}
                {appts.filter((a) => a.status === 'CONFIRME').length === 0 && <small className="muted">Aucun RDV confirmé.</small>}
              </div>
            </div>
            <div className="side-card alert-card">
              <span className="dash-kicker">BESOIN D’AIDE</span>
              <h3>Documentation coiffeur</h3>
              <a href="/espace-pro"><b>→</b><span>Guide de prise en main<small>Gérer ses rendez-vous</small></span><ChevronRight /></a>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}

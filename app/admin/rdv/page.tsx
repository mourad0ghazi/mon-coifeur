'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { formatPhone, whatsappLink } from '@/lib/whatsapp';
import { CalendarDays, MessageCircle, Search } from 'lucide-react';

type Appt = {
  id: string; reference: string; client_name: string; client_phone: string;
  barber_name: string; salon_name: string; date: string; start_minutes: number;
  service_label: string; price_mad: number; status: string;
};

const STATUS: Record<string, string> = {
  CONFIRME: 'Confirmé', EN_COURS: 'En cours', TERMINE: 'Terminé',
  ANNULE_CLIENT: 'Annulé client', ANNULE_COIFFEUR: 'Annulé coiffeur', NO_SHOW: 'No-show',
};

function fmt(min: number) { return `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`; }

export default function AdminRdv() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('TOUS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status !== 'TOUS') p.set('status', status);
    setLoading(true);
    fetch('/api/v1/admin/appointments?' + p).then((r) => r.json()).then((j) => {
      setAppts(j.data?.appointments || []);
      setLoading(false);
    });
  }, [q, status]);

  return (
    <DashboardShell type="admin" title="Rendez-vous" subtitle="Toutes les réservations de la plateforme">
      <div className="dash-content">
        <div className="admin-toolbar">
          <div className="admin-search"><Search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, téléphone ou référence…" /></div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mini-select">
            <option value="TOUS">Tous statuts</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="admin-table">
          <div className="admin-tr head">
            <span>CLIENT</span><span>COIFFEUR</span><span>SERVICE</span><span>DATE</span><span>STATUT</span><span>CONTACT</span>
          </div>
          {loading && <div className="table-empty">Chargement…</div>}
          {!loading && appts.length === 0 && <div className="table-empty">Aucun rendez-vous.</div>}
          {appts.map((a) => (
            <div className="admin-tr" key={a.id}>
              <span><b>{a.client_name || 'Client'}</b><small>{formatPhone(a.client_phone)}</small></span>
              <span>{a.barber_name}<small>{a.salon_name}</small></span>
              <span>{a.service_label}<small>{a.price_mad} MAD</small></span>
              <span><b>{new Date(a.date + 'T12:00').toLocaleDateString('fr-FR')}</b><small>{fmt(a.start_minutes)}</small></span>
              <span><em className={'status ' + a.status.toLowerCase()}>{STATUS[a.status] || a.status}</em></span>
              <span><a className="wa-small" href={whatsappLink(a.client_phone)} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a></span>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

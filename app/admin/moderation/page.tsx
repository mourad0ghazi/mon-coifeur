'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { AlertTriangle, Check, Search, ShieldCheck, X } from 'lucide-react';

type Report = {
  id: string; type: string; target: string; reason: string;
  status: 'EN_ATTENTE' | 'VALIDE' | 'REJETE'; created_at: string;
};

const SEED: Report[] = [
  { id: 'r1', type: 'Avis', target: 'Avis sur Salon Mouad', reason: 'Langage inapproprié', status: 'EN_ATTENTE', created_at: new Date().toISOString() },
  { id: 'r2', type: 'Photo', target: 'Photo de Studio HK', reason: 'Photo non pertinente', status: 'EN_ATTENTE', created_at: new Date().toISOString() },
];

export default function Moderation() {
  const [reports, setReports] = useState<Report[]>(SEED);
  const [q, setQ] = useState('');

  function setStatus(id: string, status: Report['status']) {
    setReports((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const filtered = reports.filter((r) => !q || r.target.toLowerCase().includes(q.toLowerCase()) || r.reason.toLowerCase().includes(q.toLowerCase()));
  const pending = reports.filter((r) => r.status === 'EN_ATTENTE').length;

  return (
    <DashboardShell type="admin" title="Modération" subtitle="Avis, photos et contenus signalés">
      <div className="dash-content">
        <div className="kpi-grid" style={{ marginBottom: 18 }}>
          <div><span>EN ATTENTE</span><b>{pending}</b><ShieldCheck /></div>
          <div><span>TRAITÉS</span><b>{reports.length - pending}</b><Check /></div>
        </div>
        <div className="admin-toolbar">
          <div className="admin-search"><Search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un signalement…" /></div>
        </div>
        <div className="admin-table">
          <div className="admin-tr head"><span>TYPE</span><span>CIBLE</span><span>MOTIF</span><span>STATUT</span><span>ACTION</span></div>
          {filtered.map((r) => (
            <div className="admin-tr" key={r.id} style={{ gridTemplateColumns: '1fr 2fr 2fr 1fr 1.2fr' }}>
              <span><b>{r.type}</b></span>
              <span>{r.target}</span>
              <span><AlertTriangle size={12} style={{ color: 'var(--gold2)', verticalAlign: 'middle', marginRight: 5 }} />{r.reason}</span>
              <span><em className={'status ' + (r.status === 'VALIDE' ? 'confirme' : r.status === 'REJETE' ? 'annule-client' : 'en-attente')}>{r.status.replace('_', ' ')}</em></span>
              <span className="row-actions">
                {r.status === 'EN_ATTENTE' && <>
                  <button className="success" onClick={() => setStatus(r.id, 'VALIDE')}><Check size={14} /> Approuver</button>
                  <button onClick={() => setStatus(r.id, 'REJETE')}><X size={14} /> Rejeter</button>
                </>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

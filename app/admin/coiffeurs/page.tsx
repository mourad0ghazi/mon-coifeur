'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { formatPhone, whatsappLink } from '@/lib/whatsapp';
import { Check, MessageCircle, Search, ShieldCheck, X } from 'lucide-react';

type U = { id: string; name: string; phone: string; email: string | null; status: string; createdAt: string; reliability: number };

export default function AdminCoiffeurs() {
  const [users, setUsers] = useState<U[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams({ role: 'COIFFEUR' });
    if (q) p.set('q', q);
    setLoading(true);
    fetch('/api/v1/admin/users?' + p).then((r) => r.json()).then((j) => {
      setUsers(j.data?.users || []); setLoading(false);
    });
  }, [q]);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/v1/admin/users/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, status } : u)));
  }

  return (
    <DashboardShell type="admin" title="Coiffeurs" subtitle="Comptes coiffeurs validés et leurs performances">
      <div className="dash-content">
        <div className="admin-toolbar">
          <div className="admin-search"><Search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou téléphone…" /></div>
        </div>
        <div className="admin-table">
          <div className="admin-tr head"><span>COIFFEUR</span><span>CONTACT</span><span>STATUT</span><span>INSCRIPTION</span><span>ACTIONS</span></div>
          {loading && <div className="table-empty">Chargement…</div>}
          {!loading && users.length === 0 && <div className="table-empty">Aucun coiffeur pour le moment.</div>}
          {users.map((u) => (
            <div className="admin-tr" key={u.id}>
              <span><b>{u.name}</b><small><ShieldCheck size={12} /> {Math.round(u.reliability)} · fiable</small></span>
              <span><a href={`tel:${u.phone}`}>{formatPhone(u.phone)}</a>{u.email && <small>{u.email}</small>}</span>
              <span><em className={'status ' + u.status.toLowerCase()}>{u.status}</em></span>
              <span>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
              <span className="row-actions">
                <a className="wa-small" href={whatsappLink(u.phone)} target="_blank" rel="noreferrer"><MessageCircle size={14} /></a>
                {u.status === 'ACTIF'
                  ? <button onClick={() => setStatus(u.id, 'SUSPENDU')}><X size={14} /> Suspendre</button>
                  : <button className="success" onClick={() => setStatus(u.id, 'ACTIF')}><Check size={14} /> Activer</button>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

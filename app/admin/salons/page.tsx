'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { Search, Store, MapPin } from 'lucide-react';

// Salons de la plateforme (ceux visibles publiquement).
import { SALONS } from '@/lib/salon-data';
import { getOpenStatus } from '@/lib/salon-data';

export default function AdminSalons() {
  const [q, setQ] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const rows = SALONS.filter((s) =>
    !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.neighborhood.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <DashboardShell type="admin" title="Salons" subtitle="Tous les établissements partenaires">
      <div className="dash-content">
        <div className="admin-toolbar">
          <div className="admin-search"><Search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou quartier…" /></div>
          <span className="muted">{rows.length} salon(s)</span>
        </div>
        <div className="admin-salons">
          {rows.map((s) => {
            const st = getOpenStatus(s.hours, now);
            return (
              <article key={s.id} className="admin-salon-card">
                <div className="salon-dot" style={{ background: s.image } as any} />
                <div>
                  <h3>{s.name}</h3>
                  <p><MapPin size={13} /> {s.neighborhood}, {s.city}</p>
                  <p><Store size={13} /> {s.barberName} · {s.services.length} services</p>
                </div>
                <div className="salon-meta">
                  <em className={'status ' + (st.open ? 'confirme' : 'annule-client')}>{st.label}</em>
                  <small>★ {s.rating} · {s.reviews} avis</small>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}

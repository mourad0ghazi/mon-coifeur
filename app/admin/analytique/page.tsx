'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { CalendarCheck, Star, TrendingUp, UsersRound, WalletCards } from 'lucide-react';

export default function Analytique() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch('/api/v1/admin/stats').then((r) => r.json()).then((j) => setStats(j.data));
  }, []);

  const avg = stats?.appts ? Math.round((stats.revenue / stats.appts) * 10) / 10 : 0;

  const bars = [62, 78, 55, 88, 71, 95, 84];
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <DashboardShell type="admin" title="Analytique" subtitle="Croissance, conversion et rétention">
      <div className="dash-content">
        <div className="kpi-grid pro-kpis">
          <div><span>REVENU TOTAL</span><b>{stats?.revenue ?? '—'} <small>MAD</small></b><WalletCards /></div>
          <div><span>RENDEZ-VOUS</span><b>{stats?.appts ?? '—'}</b><CalendarCheck /></div>
          <div><span>PANIER MOYEN</span><b>{avg} <small>MAD</small></b><TrendingUp /></div>
          <div><span>UTILISATEURS</span><b>{stats?.users ?? '—'}</b><UsersRound /></div>
        </div>

        <section className="chart-card" style={{ marginTop: 18 }}>
          <header><div><span className="dash-kicker">7 DERNIERS JOURS</span><h3>Activité</h3></div></header>
          <div className="bar-chart">
            {bars.map((h, i) => (
              <div key={i} className="bar-col">
                <div className="bar" style={{ height: h + '%' }}><span>{h}</span></div>
                <small>{days[i]}</small>
              </div>
            ))}
          </div>
          <footer>
            <div><b>{stats?.upcoming ?? 0}</b><span>RDV à venir</span></div>
            <div><b><Star fill="currentColor" /> 4,8</b><span>note moyenne</span></div>
          </footer>
        </section>
      </div>
    </DashboardShell>
  );
}

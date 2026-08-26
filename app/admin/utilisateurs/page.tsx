'use client';
import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import {
  Ban, CalendarDays, Check, ChevronRight, Clock3, Download, Filter,
  MapPin, MessageCircle, MoreHorizontal, Search, ShieldCheck,
  UserCheck, UserPlus, UsersRound, X,
} from 'lucide-react';

type AdminUser = {
  id: string; name: string; phone: string; email: string | null;
  role: 'CLIENT' | 'COIFFEUR' | 'SUPER_ADMIN'; status: string;
  createdAt: string; lastLoginAt: string | null; reliability: number;
};

const reliabilityLabel = (r: number) => (r >= 90 ? 'Fiable' : r >= 70 ? 'Moyen' : 'À risque');

export default function UsersAdmin() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('TOUS');
  const [status, setStatus] = useState('TOUS');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (role !== 'TOUS') params.set('role', role);
    if (status !== 'TOUS') params.set('status', status);
    const res = await fetch('/api/v1/admin/users?' + params.toString());
    const json = await res.json();
    setUsers(json.data?.users || []);
    setLoading(false);
  }

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [q, role, status]);

  const kpis = useMemo(() => ({
    total: users.length,
    clients: users.filter((u) => u.role === 'CLIENT').length,
    coiffeurs: users.filter((u) => u.role === 'COIFFEUR').length,
    risque: users.filter((u) => u.reliability < 70 || u.status === 'SUSPENDU' || u.status === 'BANNI').length,
  }), [users]);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  async function act(action: 'suspend' | 'activate' | 'ban' | 'promote' | 'demote') {
    if (!selected) return;
    setActing(true);
    const body: any = {};
    if (action === 'suspend') body.status = 'SUSPENDU';
    if (action === 'activate') body.status = 'ACTIF';
    if (action === 'ban') body.status = 'BANNI';
    if (action === 'promote') body.role = 'COIFFEUR';
    if (action === 'demote') body.role = 'CLIENT';
    const res = await fetch(`/api/v1/admin/users/${selected.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    const json = await res.json();
    setActing(false);
    if (!res.ok) { flash(json?.message || json?.error || 'Action impossible'); return; }
    setUsers((list) => list.map((u) => (u.id === selected.id ? { ...u, ...json.data.user } : u)));
    setSelected(json.data.user);
    flash('Utilisateur mis à jour.');
  }

  function exportCsv() {
    const header = 'Nom,Téléphone,Email,Rôle,Statut,Fiabilité,Inscription\n';
    const rows = users.map((u) =>
      [u.name, u.phone, u.email || '', u.role, u.status, u.reliability, u.createdAt].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hlaqti-utilisateurs.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell type="admin" title="Utilisateurs" subtitle="Vue complète des clients, coiffeurs et administrateurs">
      <div className="dash-content users-admin">
        <div className="user-admin-kpis">
          <div><span><UsersRound /></span><p><small>TOTAL UTILISATEURS</small><b>{kpis.total}</b><em>base de données live</em></p></div>
          <div><span><UserCheck /></span><p><small>CLIENTS</small><b>{kpis.clients}</b><em>enregistrés</em></p></div>
          <div><span><ShieldCheck /></span><p><small>COIFFEURS</small><b>{kpis.coiffeurs}</b><em>profils pro</em></p></div>
          <div><span><Ban /></span><p><small>COMPTES À RISQUE</small><b>{kpis.risque}</b><em>à examiner</em></p></div>
        </div>

        <section className="users-table-card">
          <header>
            <div className="admin-search">
              <Search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, téléphone ou email…" />
            </div>
            <div className="role-tabs">
              {['TOUS', 'CLIENT', 'COIFFEUR', 'SUPER_ADMIN'].map((x) => (
                <button className={role === x ? 'active' : ''} onClick={() => setRole(x)} key={x}>
                  {x === 'TOUS' ? 'Tous' : x === 'SUPER_ADMIN' ? 'Admins' : x === 'CLIENT' ? 'Clients' : 'Coiffeurs'}
                </button>
              ))}
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mini-select">
              <option value="TOUS">Tous statuts</option>
              <option value="ACTIF">Actifs</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="SUSPENDU">Suspendus</option>
              <option value="BANNI">Bannis</option>
            </select>
            <button onClick={exportCsv}><Download /> Exporter</button>
          </header>
          <div className="users-table">
            <div className="user-tr table-head">
              <span>UTILISATEUR</span><span>RÔLE</span><span>STATUT</span><span>FIABILITÉ</span><span>INSCRIPTION</span><span />
            </div>
            {loading && <div className="table-empty">Chargement…</div>}
            {!loading && users.length === 0 && <div className="table-empty">Aucun utilisateur trouvé.</div>}
            {!loading && users.map((x) => (
              <button className="user-tr" onClick={() => setSelected(x)} key={x.id}>
                <span className="user-identity">
                  <i>{x.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</i>
                  <p><b>{x.name}</b><small>{x.phone}</small></p>
                </span>
                <span><em className={'role ' + x.role.toLowerCase()}>{x.role}</em></span>
                <span><em className={'status ' + x.status.toLowerCase()}><i />{x.status}</em></span>
                <span className={'reliability ' + reliabilityLabel(x.reliability).replace(' ', '').toLowerCase()}>
                  {x.reliability} · {reliabilityLabel(x.reliability)}
                </span>
                <span><b>{new Date(x.createdAt).toLocaleDateString('fr-FR')}</b></span>
                <MoreHorizontal />
              </button>
            ))}
          </div>
          <footer><span>{users.length} résultat(s) — données persistantes SQLite</span></footer>
        </section>

        {selected && (
          <>
            <button className="drawer-overlay" onClick={() => setSelected(null)} />
            <aside className="user-drawer">
              <header>
                <div><span>FICHE UTILISATEUR</span><b>{selected.id.slice(0, 8).toUpperCase()}</b></div>
                <button onClick={() => setSelected(null)}><X /></button>
              </header>
              <section className="drawer-person">
                <i>{selected.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</i>
                <h2>{selected.name}</h2>
                <p>{selected.phone}{selected.email ? ` · ${selected.email}` : ''}</p>
                <div>
                  <em className={'role ' + selected.role.toLowerCase()}>{selected.role}</em>
                  <em className={'status ' + selected.status.toLowerCase()}>{selected.status}</em>
                </div>
              </section>
              <section className="drawer-details">
                <h3>Informations</h3>
                <p><CalendarDays /><span><small>INSCRIPTION</small><b>{new Date(selected.createdAt).toLocaleString('fr-FR')}</b></span></p>
                <p><Clock3 /><span><small>DERNIÈRE CONNEXION</small><b>{selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleString('fr-FR') : '—'}</b></span></p>
                <h3>Fiabilité</h3>
                <div className="score">
                  <span>{Math.round(selected.reliability)}</span>
                  <p><b>{reliabilityLabel(selected.reliability)}</b><small>score calculé sur les rendez-vous honorés</small></p>
                </div>
              </section>
              <footer>
                <a href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
                {selected.status === 'ACTIF' ? (
                  <button className="danger" disabled={acting} onClick={() => act('suspend')}><Ban /> Suspendre</button>
                ) : (
                  <button className="success" disabled={acting} onClick={() => act('activate')}><Check /> Réactiver</button>
                )}
                {selected.role === 'CLIENT' ? (
                  <button disabled={acting} onClick={() => act('promote')}><UserPlus /> Passer coiffeur</button>
                ) : selected.role === 'COIFFEUR' ? (
                  <button className="danger" disabled={acting} onClick={() => act('demote')}><UsersRound /> Rétrograder client</button>
                ) : null}
                {selected.status !== 'BANNI' && selected.role !== 'SUPER_ADMIN' && (
                  <button className="danger" disabled={acting} onClick={() => act('ban')}><Ban /> Bannir</button>
                )}
              </footer>
            </aside>
          </>
        )}

        {toast && <div className="admin-toast">{toast}</div>}
      </div>
    </DashboardShell>
  );
}

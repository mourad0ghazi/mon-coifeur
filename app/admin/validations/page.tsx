'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { DashboardShell } from '@/components/DashboardShell';
import {
  Check, CheckCircle2, ChevronRight, Clock3, ExternalLink, MapPin,
  MessageCircle, Phone, Search, ShieldCheck, X, XCircle,
} from 'lucide-react';

type App = {
  id: string; reference: string; first_name: string; last_name: string; phone: string;
  experience: string; salon_name: string; city: string; neighborhood: string;
  address: string | null; landmark: string | null; specialties: string[]; photos_count: number;
  status: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'INFOS_DEMANDEES';
  risk: 'FAIBLE' | 'MOYEN' | 'ELEVE'; internal_note: string | null;
  checks: boolean[]; created_at: string;
};

const defaultChecks = [true, true, true, false, true, true];
const checkLabels = [
  'Photo de profil réelle', 'Minimum 3 réalisations personnelles', 'WhatsApp vérifié',
  'Appel de vérification effectué', 'Adresse localisable', 'Services et horaires renseignés',
];

export default function Validations() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'TOUS' | 'EN_ATTENTE' | 'VALIDE' | 'REFUSE'>('EN_ATTENTE');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checks, setChecks] = useState<boolean[]>(defaultChecks);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'TOUS') params.set('status', filter);
    if (q) params.set('q', q);
    const res = await fetch('/api/v1/admin/partner-applications?' + params);
    const json = await res.json();
    const list: App[] = json.data?.applications || [];
    setApps(list);
    if (list.length && !list.find((a) => a.id === selectedId)) setSelectedId(list[0].id);
    setLoading(false);
  }
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [filter, q]);

  const selected = useMemo(() => apps.find((a) => a.id === selectedId) || apps[0], [apps, selectedId]);
  useEffect(() => {
    if (selected) { setChecks(selected.checks?.length === 6 ? selected.checks : defaultChecks); setNote(selected.internal_note || ''); }
  }, [selected?.id]); // eslint-disable-line

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  async function decide(status: 'VALIDE' | 'REFUSE' | 'INFOS_DEMANDEES') {
    if (!selected) return;
    setActing(true);
    const res = await fetch(`/api/v1/admin/partner-applications/${selected.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, checks, internalNote: note }),
    });
    setActing(false);
    if (!res.ok) { flash('Action impossible'); return; }
    const json = await res.json();
    setApps((list) => list.map((a) => (a.id === selected.id ? json.data.application : a)));
    flash(status === 'VALIDE' ? 'Compte validé. WhatsApp envoyé.' : status === 'REFUSE' ? 'Dossier refusé.' : 'Informations demandées.');
  }

  const pendingCount = apps.filter((a) => a.status === 'EN_ATTENTE').length;

  return (
    <DashboardShell type="admin" title="Validations" subtitle={`${pendingCount} dossiers en attente de décision`}>
      <div className="validation-layout">
        <aside className="request-list">
          <div className="request-filters">
            <label><Search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" /></label>
            <div>
              {(['EN_ATTENTE', 'TOUS', 'VALIDE', 'REFUSE'] as const).map((f) => (
                <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                  {f === 'EN_ATTENTE' ? 'En attente' : f === 'TOUS' ? 'Tous' : f === 'VALIDE' ? 'Validés' : 'Refusés'}
                </button>
              ))}
            </div>
          </div>
          {loading && <p className="list-empty">Chargement…</p>}
          {!loading && apps.length === 0 && <p className="list-empty">Aucun dossier.</p>}
          {apps.map((x) => (
            <button className={selected?.id === x.id ? 'selected' : ''} onClick={() => setSelectedId(x.id)} key={x.id}>
              <span>{(x.first_name[0] || '') + (x.last_name[0] || '')}</span>
              <div>
                <b>{x.first_name} {x.last_name}</b>
                <small>{x.salon_name} · {x.neighborhood}</small>
                <em><Clock3 /> {new Date(x.created_at).toLocaleDateString('fr-FR')}</em>
              </div>
              <ChevronRight />
            </button>
          ))}
        </aside>

        {selected ? (
          <main className="request-detail">
            <header>
              <div className="applicant">
                <span>{(selected.first_name[0] || '') + (selected.last_name[0] || '')}</span>
                <div>
                  <small>DEMANDE {selected.reference} · REÇUE LE {new Date(selected.created_at).toLocaleString('fr-FR')}</small>
                  <h2>{selected.first_name} {selected.last_name}</h2>
                  <p>{selected.salon_name} · {selected.neighborhood}, {selected.city}</p>
                </div>
              </div>
              <div className="risk">
                <ShieldCheck /><span><b>Risque {selected.risk.toLowerCase()}</b><small>{selected.photos_count} photos · {selected.specialties.length} spécialités</small></span>
              </div>
            </header>

            <section className="identity-grid">
              <div><small>WHATSAPP</small><p><Phone /> {selected.phone}</p><span><Check /> À vérifier par OTP</span></div>
              <div><small>LOCALISATION</small><p><MapPin /> {selected.address || 'Adresse à préciser'}</p><a>{selected.landmark || 'Voir sur la carte'} <ExternalLink /></a></div>
              <div><small>EXPÉRIENCE</small><p>{selected.experience} d’expérience</p><span>{selected.specialties.join(' · ')}</span></div>
            </section>

            <section className="submitted-media">
              <div className="detail-title"><div><small>PHOTOS SOUMISES</small><h3>{selected.photos_count} fichiers</h3></div></div>
              <div>
                <figure><Image src="/images/cut-curls.jpg" fill alt="Photo de profil" /><figcaption>PROFIL</figcaption></figure>
                <figure><Image src="/images/salon-mouad-hero.jpg" fill alt="Salon" /><figcaption>SALON</figcaption></figure>
                <figure><Image src="/images/cut-fade.jpg" fill alt="Coupe" /><figcaption>COUPE 1</figcaption></figure>
                <figure><Image src="/images/cut-beard.jpg" fill alt="Coupe" /><figcaption>COUPE 2</figcaption></figure>
              </div>
            </section>

            <section className="checklist">
              <div className="detail-title"><div><small>CHECKLIST OBLIGATOIRE</small><h3>Validation manuelle</h3></div><b>{checks.filter(Boolean).length} / 6</b></div>
              {checkLabels.map((label, i) => (
                <label key={label}>
                  <input type="checkbox" checked={!!checks[i]} onChange={() => setChecks((v) => v.map((q, j) => (i === j ? !q : q)))} />
                  <i>{checks[i] && <Check />}</i>{label}
                </label>
              ))}
            </section>

            <label className="internal-note">
              <small>NOTE INTERNE — VISIBLE UNIQUEMENT PAR L’ADMIN</small>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une observation sur le dossier…" />
            </label>

            {selected.status !== 'EN_ATTENTE' && (
              <div className="decision-status">
                {selected.status === 'VALIDE' ? <CheckCircle2 /> : <XCircle />}
                Statut actuel : <b>{selected.status}</b>
              </div>
            )}

            <footer className="decision-bar">
              <button className="reject" disabled={acting} onClick={() => decide('REFUSE')}><X /> Refuser</button>
              <button className="info" disabled={acting} onClick={() => decide('INFOS_DEMANDEES')}><MessageCircle /> Demander des infos</button>
              <button className="approve" disabled={acting || !checks.every(Boolean)} onClick={() => decide('VALIDE')}>
                <Check /> Valider le compte
              </button>
              <small>{!checks.every(Boolean) && 'Complète la checklist pour valider'}</small>
            </footer>
          </main>
        ) : (
          <main className="request-detail empty-state"><p>Sélectionne un dossier à examiner.</p></main>
        )}
      </div>
      {toast && <div className="admin-toast">{toast}</div>}
    </DashboardShell>
  );
}

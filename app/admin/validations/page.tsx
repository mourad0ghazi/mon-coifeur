'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { DashboardShell } from '@/components/DashboardShell';
import {
  Camera, Check, CheckCircle2, ChevronRight, Clock3, ExternalLink, MapPin,
  MessageCircle, Phone, Scissors, Search, ShieldCheck, Store, UserRound, X, XCircle,
} from 'lucide-react';

type App = {
  id: string; reference: string; first_name: string; last_name: string; phone: string;
  experience: string; salon_name: string; city: string; neighborhood: string;
  address: string | null; landmark: string | null; specialties: string[]; photos_count: number;
  photos: string[]; certificate_photo: string | null; chair_count: number;
  staff: { name: string; specialty?: string; hours: string }[];
  service_catalog: { name: string; price: number; duration: number }[];
  opening_hours: { day: string; on: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string }[];
  place_id: string | null; latitude: number | null; longitude: number | null; validated_at: string | null;
  status: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'INFOS_DEMANDEES';
  risk: 'FAIBLE' | 'MOYEN' | 'ELEVE'; internal_note: string | null;
  checks: boolean[]; created_at: string;
};

const defaultChecks = [false, false, true, false, false, false];
const checkLabels = [
  'Certification de coiffure lisible', 'Minimum 3 réalisations personnelles', 'WhatsApp vérifié',
  'Appel de vérification effectué', 'Adresse exacte localisable', 'Équipe, services et horaires renseignés',
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
    const notificationStatus = json.meta?.notification?.status;
    const validationMessage = notificationStatus === 'ENVOYE'
      ? 'Compte validé. WhatsApp envoyé.'
      : notificationStatus === 'DEMO_A_ENVOYER'
        ? 'Compte validé. Notification WhatsApp enregistrée en mode démo.'
        : notificationStatus === 'ECHEC'
          ? 'Compte validé, mais l’envoi WhatsApp a échoué.'
          : 'Compte validé.';
    flash(status === 'VALIDE' ? validationMessage : status === 'REFUSE' ? 'Dossier refusé.' : 'Informations demandées.');
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
              <div><small>LOCALISATION</small><p><MapPin /> {selected.address || 'Adresse à préciser'}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.address || ''}, ${selected.neighborhood}, ${selected.city}, Maroc`)}`} target="_blank" rel="noreferrer">{selected.landmark || 'Ouvrir l’adresse sur la carte'} <ExternalLink /></a></div>
              <div><small>EXPÉRIENCE</small><p>{selected.experience} d’expérience</p><span>{selected.specialties.join(' · ')}</span></div>
            </section>

            <section className="submitted-media">
              <div className="detail-title"><div><small>DOCUMENTS RÉELS DU DOSSIER</small><h3>{selected.photos.length} réalisation(s) · certificat séparé</h3></div><b>{selected.certificate_photo ? 'Certificat reçu' : 'Certificat manquant'}</b></div>
              <div className="certificate-media-row">
                {selected.certificate_photo ? <figure className="certificate-media"><Image src={selected.certificate_photo} fill alt="Certification de coiffure" sizes="220px" /><figcaption>CERTIFICATION DE COIFFURE</figcaption></figure> : <div className="missing-document"><ShieldCheck /><b>Certification non fournie</b><small>La validation reste bloquée jusqu’à réception du document.</small></div>}
                <div className="submitted-photo-grid">{selected.photos.length ? selected.photos.map((photo, index) => <figure key={`${photo}-${index}`}><Image src={photo} fill alt={`Réalisation ${index + 1}`} sizes="150px" /><figcaption>RÉALISATION {index + 1}</figcaption></figure>) : <div className="missing-document"><Camera /><b>Aucune réalisation enregistrée</b><small>Le coiffeur doit fournir au moins 3 photos.</small></div>}</div>
              </div>
            </section>

            <section className="application-detail-section">
              <div className="detail-title"><div><small>INFORMATIONS DÉCLARÉES</small><h3>Salon, équipe, prestations et horaires</h3></div><b>{selected.chair_count} chaise(s)</b></div>
              <div className="application-detail-grid"><div><Store /><span><b>Capacité</b><small>{selected.chair_count} chaise(s) · {selected.staff.length} coiffeur(s) renseigné(s)</small></span></div><div><Scissors /><span><b>Services & tarifs</b><small>{selected.service_catalog.length ? selected.service_catalog.map((item) => `${item.name} · ${item.price} MAD / ${item.duration} min`).join(' · ') : 'À compléter'}</small></span></div><div><UserRound /><span><b>Équipe</b><small>{selected.staff.length ? selected.staff.map((member) => `${member.name}${member.specialty ? ` · ${member.specialty}` : ''} (${member.hours})`).join(' · ') : 'À compléter'}</small></span></div><div><Clock3 /><span><b>Horaires du salon</b><small>{selected.opening_hours.filter((day) => day.on).map((day) => `${day.day} ${day.open || ''}–${day.close || ''}`).join(' · ') || 'À compléter'}</small></span></div></div>
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Check, Clock3, ExternalLink, MapPin, Scissors, ShieldCheck, Store, UserRound, UsersRound } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';

type Profile = {
  source: string;
  firstName: string;
  lastName: string;
  phone: string;
  experience: string;
  salonName: string;
  city: string;
  neighborhood: string;
  address: string | null;
  landmark: string | null;
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
  certificatePhoto: string | null;
  chairCount: number;
  staff: { name: string; specialty?: string; hours: string }[];
  specialties: string[];
  serviceCatalog: { name: string; price: number; duration: number }[];
  openingHours: { day: string; on: boolean; open?: string; close?: string }[];
  photos: string[];
  status: string;
  validatedAt: string | null;
};

function mapsHref(profile: Profile) {
  if (profile.latitude != null && profile.longitude != null) return `https://www.google.com/maps/dir/?api=1&destination=${profile.latitude},${profile.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${profile.address || ''}, ${profile.neighborhood}, ${profile.city}, Maroc`)}`;
}

function profileSlug(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function ProProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/pro/profile', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Profil indisponible');
        setProfile(payload.data?.profile || null);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Profil indisponible'))
      .finally(() => setLoading(false));
  }, []);

  const activeDays = useMemo(() => profile?.openingHours.filter((day) => day.on).length || 0, [profile]);

  return (
    <DashboardShell title="Mon profil" subtitle="Toutes les informations visibles après validation">
      <div className="dash-content pro-profile-page">
        {loading && <div className="pro-profile-loading"><UserRound className="spin" /><span>Chargement de ton profil…</span></div>}
        {error && !loading && <div className="pro-profile-error"><ShieldCheck /> {error}</div>}
        {profile && !loading && <>
          <section className="pro-profile-hero">
            <div className="pro-profile-avatar">{(profile.firstName[0] || '') + (profile.lastName[0] || '')}</div>
            <div className="pro-profile-identity"><span className="dash-kicker">PROFIL PARTENAIRE</span><h2>{profile.firstName} {profile.lastName}</h2><p><Store size={14} /> {profile.salonName} · {profile.neighborhood}, {profile.city}</p><span className="profile-validated"><Check size={13} /> {profile.status === 'VALIDE' ? 'Profil validé par HLAQTI' : `Statut : ${profile.status}`}</span></div>
            <div className="pro-profile-hero-actions"><Link href={`/coiffeurs/${profileSlug(profile.salonName)}`}>Voir le profil public</Link><Link href="/pro/services">Gérer les services</Link><Link className="primary" href="/pro/horaires">Gérer les horaires</Link></div>
          </section>

          <div className="pro-profile-kpis"><div><UsersRound /><b>{profile.chairCount}</b><span>chaise(s)</span></div><div><UserRound /><b>{profile.staff.length}</b><span>coiffeur(s)</span></div><div><Scissors /><b>{profile.serviceCatalog.length}</b><span>service(s)</span></div><div><CalendarDays /><b>{activeDays}/7</b><span>jours ouverts</span></div></div>

          <div className="pro-profile-layout">
            <div className="pro-profile-main">
              <section className="pro-profile-card"><header><div><span className="dash-kicker">ÉTABLISSEMENT</span><h3>Les informations du salon</h3></div><Store /></header><div className="profile-info-list"><div><MapPin /><span><b>Adresse exacte</b><small>{profile.address || 'Adresse non renseignée'}, {profile.neighborhood}, {profile.city}</small>{profile.landmark && <em>Repère : {profile.landmark}</em>}</span></div><div><Clock3 /><span><b>Expérience</b><small>{profile.experience} d’expérience · WhatsApp {profile.phone}</small></span></div></div><a className="profile-map-link" href={mapsHref(profile)} target="_blank" rel="noreferrer"><MapPin size={15} /> Ouvrir mon adresse dans Google Maps <ExternalLink size={12} /></a></section>

                <section className="pro-profile-card"><header><div><span className="dash-kicker">ÉQUIPE</span><h3>Les coiffeurs et leurs horaires</h3></div><Link href="/pro/horaires">Modifier</Link></header><div className="profile-staff-list">{profile.staff.map((member, index) => <article key={`${member.name}-${index}`}><span className="profile-staff-number">{index + 1}</span><div><b>{member.name}</b><small>{member.specialty || 'Coiffeur partenaire'}</small></div><em><Clock3 size={13} /> {member.hours}</em></article>)}</div></section>

                <section className="pro-profile-card"><header><div><span className="dash-kicker">SERVICES & TARIFS</span><h3>Ce que le client peut réserver</h3></div><Link href="/pro/services">Modifier</Link></header><div className="profile-services-list">{profile.serviceCatalog.map((service, index) => <article key={`${service.name}-${index}`}><span><Scissors size={14} /><b>{service.name}</b></span><small>{service.duration} min</small><strong>{service.price} MAD</strong></article>)}</div></section>
            </div>

            <aside className="pro-profile-side">
              <section className="pro-profile-card"><header><div><span className="dash-kicker">HORAIRES</span><h3>Semaine publiée</h3></div><Clock3 /></header><div className="profile-hours-list">{profile.openingHours.map((day) => <div key={day.day} className={!day.on ? 'closed' : ''}><b>{day.day.slice(0, 3)}</b>{day.on ? <span>{day.open} – {day.close}</span> : <em>Fermé</em>}</div>)}</div><Link className="profile-card-link" href="/pro/horaires">Gérer mes disponibilités <ExternalLink size={12} /></Link></section>
              <section className="pro-profile-card profile-documents"><header><div><span className="dash-kicker">DOCUMENTS</span><h3>Vérification HLAQTI</h3></div><ShieldCheck /></header>{profile.certificatePhoto ? <div className="profile-certificate"><Image src={profile.certificatePhoto} fill alt="Certification de coiffure" sizes="280px" /><span><Check size={12} /> Certificat reçu</span></div> : <div className="profile-document-ok"><ShieldCheck /><span><b>Profil vérifié</b><small>Le certificat est conservé dans ton dossier administratif.</small></span></div>}<div className="profile-document-ok"><Check /><span><b>WhatsApp vérifié</b><small>Les clients peuvent te contacter directement.</small></span></div></section>
            </aside>
          </div>

          <section className="pro-profile-card profile-portfolio"><header><div><span className="dash-kicker">PORTFOLIO</span><h3>Mes réalisations publiées</h3></div><Link href="/pro/portfolio">Gérer le portfolio <ExternalLink size={12} /></Link></header><div className="profile-portfolio-grid">{profile.photos.length ? profile.photos.map((photo, index) => <div key={`${photo}-${index}`}><Image src={photo} fill alt={`Réalisation ${index + 1}`} sizes="180px" /></div>) : <div className="profile-no-photos"><Scissors /><span>Aucune photo publiée pour le moment.</span><Link href="/pro/portfolio">Ajouter mes réalisations</Link></div>}</div></section>
        </>}
      </div>
    </DashboardShell>
  );
}

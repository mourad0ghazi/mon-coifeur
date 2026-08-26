'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, Clock3, ExternalLink, MapPin, MessageCircle, Navigation, Scissors, ShieldCheck, Star, Store, UserRound } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SalonMap } from '@/components/SalonMap';
import type { PartnerApplication } from '@/lib/platform-store';
import { getOpenStatus, type WeekHours } from '@/lib/salon-data';
import { whatsappLink } from '@/lib/whatsapp';

type Props = { application: PartnerApplication };

function toMinutes(value?: string) {
  if (!value) return undefined;
  const [hours, minutes] = value.split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : undefined;
}

function applicationHours(application: PartnerApplication): WeekHours {
  return Array.from({ length: 7 }, (_, index) => {
    const day = application.opening_hours[index];
    if (!day || !day.on) return { closed: true };
    return { open: toMinutes(day.open), close: toMinutes(day.close), breakStart: toMinutes(day.breakStart), breakEnd: toMinutes(day.breakEnd) };
  }) as WeekHours;
}

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function mapsHref(application: PartnerApplication) {
  if (application.latitude != null && application.longitude != null) return `https://www.google.com/maps/dir/?api=1&destination=${application.latitude},${application.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${application.address || ''}, ${application.neighborhood}, ${application.city}, Maroc`)}`;
}

export function PublicPartnerProfile({ application }: Props) {
  const liveStatus = getOpenStatus(applicationHours(application));
  const slug = slugify(application.salon_name);
  const mapSalon = application.latitude != null && application.longitude != null ? [{
    id: application.id,
    slug,
    name: application.salon_name,
    neighborhood: application.neighborhood,
    city: application.city,
    address: application.address || undefined,
    latitude: application.latitude,
    longitude: application.longitude,
    openStatus: liveStatus,
  }] : [];

  return (
    <main className="public-partner-page">
      <div className="inner-head"><Header /></div>
      <div className="container public-partner-back"><Link href="/salons">← Retour aux salons</Link></div>
      <section className="public-partner-hero"><div className="container"><div className="public-partner-avatar">{application.first_name[0]}{application.last_name[0]}</div><div><span className="section-kicker">PARTENAIRE HLAQTI</span><h1>{application.salon_name}</h1><p><MapPin size={15} /> {application.neighborhood}, {application.city} · {application.staff.length} coiffeur(s)</p><span className="public-verified"><Check size={13} /> Profil vérifié manuellement</span></div><div className="public-partner-rating"><Star size={18} fill="currentColor" /><b>Nouveau profil</b><small>Les avis arrivent après les premiers rendez-vous</small></div></div></section>

      <div className="container public-partner-layout"><div className="public-partner-main">
        <section className="public-partner-card"><header><div><span className="section-kicker">PRESTATIONS</span><h2>Services & tarifs</h2></div><Scissors /></header><div className="public-services">{application.service_catalog.map((service, index) => <article key={`${service.name}-${index}`}><span><Scissors size={15} /><b>{service.name}</b></span><small><Clock3 size={13} /> {service.duration} min</small><strong>{service.price} MAD</strong></article>)}</div></section>
        <section className="public-partner-card"><header><div><span className="section-kicker">L’ÉQUIPE</span><h2>Les coiffeurs du salon</h2></div><UserRound /></header><div className="public-staff">{application.staff.map((member, index) => <article key={`${member.name}-${index}`}><span>{index + 1}</span><div><b>{member.name}</b><small>{member.specialty || 'Coiffeur partenaire'}</small></div><em><Clock3 size={13} /> {member.hours}</em></article>)}</div></section>
        <section className="public-partner-card"><header><div><span className="section-kicker">RÉALISATIONS</span><h2>Le travail du salon</h2></div><Link href="/inspirations">Inspirations <ExternalLink size={12} /></Link></header>{application.photos.length ? <div className="public-gallery">{application.photos.map((photo, index) => <div key={`${photo}-${index}`}><Image src={photo} fill alt={`Réalisation de ${application.salon_name} ${index + 1}`} sizes="(max-width: 700px) 50vw, 220px" /></div>)}</div> : <p className="public-empty">Le portfolio sera bientôt disponible.</p>}</section>
        <section className="public-partner-card"><header><div><span className="section-kicker">ADRESSE & HORAIRES</span><h2>Retrouve le salon</h2></div><Store /></header><div className="public-address"><p><MapPin size={17} /><span><b>{application.address || 'Adresse déclarée'}</b><small>{application.neighborhood}, {application.city}{application.landmark ? ` · ${application.landmark}` : ''}</small></span></p><p><Clock3 size={17} /><span><b>{liveStatus.label}</b><small>{application.opening_hours.filter((day) => day.on).map((day) => `${day.day} ${day.open || ''}–${day.close || ''}`).join(' · ')}</small></span></p></div>{mapSalon.length ? <SalonMap salons={mapSalon} selectedId={application.id} onSelect={() => undefined} /> : <div className="public-map-missing"><MapPin /><span>La carte sera disponible dès que les coordonnées exactes seront confirmées.</span></div>}<a className="public-map-link" href={mapsHref(application)} target="_blank" rel="noreferrer"><Navigation size={15} /> Ouvrir l’itinéraire</a></section>
      </div><aside className="public-partner-aside"><div className="public-book-card"><span className="section-kicker">CONTACT DIRECT</span><h3>Une question ?</h3><p>Écris au salon sur WhatsApp pour demander une information ou préparer ta visite.</p><a className="public-whatsapp" href={whatsappLink(application.phone, `Bonjour ${application.salon_name}, je souhaite avoir une information.`)} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Écrire sur WhatsApp</a><div className="public-contact-status"><i className={liveStatus.open ? 'open' : ''} /><span>{liveStatus.open ? 'Le salon est ouvert' : liveStatus.label}</span></div></div><div className="public-partner-note"><ShieldCheck /><b>Partenaire vérifié</b><p>Les informations, les photos et le certificat ont été examinés par l’équipe HLAQTI.</p></div></aside></div>
      <Footer />
    </main>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Check,
  Clock3,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Share2,
  Star,
  WalletCards,
  X,
} from 'lucide-react';
import type { Salon } from '@/lib/salon-data';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SalonMap } from '@/components/SalonMap';
import { whatsappLink } from '@/lib/whatsapp';

export type SalonLiveStatus = {
  open: boolean;
  label: string;
  until?: string;
  pause?: boolean;
};

type Props = {
  salon: Salon;
  status: SalonLiveStatus;
};

const serviceDescriptions: Record<string, string> = {
  'degrade-americain': 'Fondu progressif, contours nets et finition soignée.',
  'taper-fade': 'Un taper propre et précis, adapté à la forme de ton visage.',
  'coupe-barbe': 'La formule complète pour sortir avec une finition nette.',
  barbe: 'Taille, contours et finition au rasoir.',
  enfant: 'Une coupe confortable et adaptée aux plus petits.',
  ciseaux: 'Coupe aux ciseaux et mise en forme personnalisée.',
};

function reservationHref(salon: Salon) {
  return salon.id === 'salon-mouad'
    ? '/reserver/karim'
    : `/reserver/karim?salon=${encodeURIComponent(salon.slug)}`;
}

function mapsHref(salon: Salon) {
  return `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`;
}

function formatAddress(salon: Salon) {
  return `${salon.address}, ${salon.neighborhood}, ${salon.city}`;
}

export function SalonDetail({ salon, status }: Props) {
  const [favorite, setFavorite] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState('Partager');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setFavorite(window.localStorage.getItem(`hlaqti-favorite-${salon.id}`) === '1');
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [salon.id]);

  const gallery = useMemo(() => [
    { src: salon.image, alt: `Intérieur de ${salon.name}` },
    { src: '/images/cut-fade.jpg', alt: 'Dégradé réalisé au salon' },
    { src: '/images/cut-curls.jpg', alt: 'Taper réalisé au salon' },
    { src: '/images/cut-beard.jpg', alt: 'Barbe réalisée au salon' },
  ], [salon.image, salon.name]);

  function toggleFavorite() {
    setFavorite((value) => {
      const next = !value;
      window.localStorage.setItem(`hlaqti-favorite-${salon.id}`, next ? '1' : '0');
      return next;
    });
  }

  async function shareSalon() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: salon.name, text: `Découvre ${salon.name} sur HLAQTI`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareLabel('Lien copié');
        window.setTimeout(() => setShareLabel('Partager'), 2200);
      }
    } catch {
      // L'utilisateur peut fermer la fenêtre de partage : ce n'est pas une erreur à afficher.
    }
  }

  const mapSalon = [{
    id: salon.id,
    slug: salon.slug,
    name: salon.name,
    neighborhood: salon.neighborhood,
    city: salon.city,
    latitude: salon.latitude,
    longitude: salon.longitude,
    openStatus: status,
  }];

  return (
    <main className="salon-detail-page">
      <div className="inner-head"><Header /></div>
      <div className="container salon-detail-back"><Link href="/salons" className="back-to-salons">← Tous les salons</Link></div>

      <section className="gallery container salon-detail-gallery" aria-label={`Photos de ${salon.name}`}>
        <div className="gallery-main"><Image src={gallery[0].src} fill alt={gallery[0].alt} priority sizes="(max-width: 700px) 100vw, 55vw" /></div>
        <div><Image src={gallery[1].src} fill alt={gallery[1].alt} sizes="(max-width: 700px) 100vw, 25vw" /></div>
        <div><Image src={gallery[2].src} fill alt={gallery[2].alt} sizes="(max-width: 700px) 100vw, 25vw" /></div>
        <button type="button" onClick={() => setGalleryOpen((value) => !value)}>{galleryOpen ? <><X size={15} /> Fermer les photos</> : <>Voir les {gallery.length} photos <ExternalLink size={14} /></>}</button>
      </section>

      {galleryOpen && <section className="container detail-gallery-expanded" aria-label="Galerie complète">
        {gallery.map((photo) => <div key={photo.src}><Image src={photo.src} fill alt={photo.alt} sizes="(max-width: 700px) 50vw, 220px" /></div>)}
      </section>}

      <section className="salon-title container salon-detail-title">
        <div>
          <div className="verify"><Check size={15} /> {salon.verified ? 'SALON VÉRIFIÉ' : 'PROFIL PARTENAIRE'}</div>
          <h1>{salon.name}</h1>
          <div className="salon-detail-meta">
            <span className="detail-rating"><Star size={15} fill="currentColor" /> {salon.rating.toFixed(1).replace('.', ',')} <u>{salon.reviews} avis</u></span>
            <span><MapPin size={15} /> {salon.neighborhood}, {salon.city}</span>
            <span className={status.open ? 'detail-open' : 'detail-closed'}><i className={status.open ? 'blink' : ''} /> {status.label}</span>
          </div>
        </div>
        <div className="salon-actions salon-detail-actions">
          <button type="button" className={favorite ? 'is-favorite' : ''} aria-pressed={favorite} onClick={toggleFavorite}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'Favori' : 'Ajouter'}</button>
          <button type="button" onClick={shareSalon}><Share2 size={16} /> {shareLabel}</button>
          <Link className="btn btn-primary" href={reservationHref(salon)}>Réserver</Link>
        </div>
      </section>

      <nav className="anchor" aria-label="Navigation de la fiche salon"><div className="container"><a href="#services">Services</a><a href="#equipe">L’équipe</a><a href="#galerie">Réalisations</a><a href="#avis">Avis</a><a href="#infos">Infos & carte</a></div></nav>

      <div className="salon-content container">
        <div>
          <section id="services" className="salon-block">
            <span className="section-kicker">PRESTATIONS</span>
            <h2>Choisis ton service.</h2>
            <div className="service-list">{salon.services.map((service) => <div className="service" key={service.id}><div><h3>{service.label}</h3><p>{serviceDescriptions[service.id] || 'Une prestation réalisée avec soin par notre partenaire.'}</p><small><Clock3 size={14} /> {service.duration} min</small></div><strong>{service.price} MAD</strong><Link href={reservationHref(salon)}>Choisir</Link></div>)}</div>
          </section>

          <section id="equipe" className="salon-block">
            <span className="section-kicker">L’ÉQUIPE</span>
            <h2>Entre de bonnes mains.</h2>
            <div className="team-grid"><article className="barber"><Image src={salon.image} width={100} height={100} alt={salon.barberName} /><div><h3>{salon.barberName}</h3><p>{salon.specialties.slice(0, 2).join(' · ')}</p><span><Star size={12} fill="currentColor" /> {salon.rating.toFixed(1).replace('.', ',')} · partenaire HLAQTI</span></div><Link href={reservationHref(salon)}>{salon.nextSlot?.time || 'Voir'} <small>{salon.nextSlot ? 'disponible' : 'créneau à choisir'}</small></Link></article></div>
          </section>

          <section id="galerie" className="salon-block">
            <span className="section-kicker">RÉALISATIONS</span>
            <h2>Le travail parle.</h2>
            <div className="mini-gallery">{gallery.slice(1).map((photo) => <Image key={photo.src} src={photo.src} width={300} height={350} alt={photo.alt} />)}</div>
          </section>

          <section id="avis" className="salon-block">
            <span className="section-kicker">AVIS VÉRIFIÉS</span>
            <h2>{salon.rating.toFixed(1).replace('.', ',')} <Star size={30} fill="currentColor" /></h2>
            <article className="review"><header><b>Youssef B.</b><span>★★★★★</span></header><small>✓ RDV vérifié · {salon.services[0]?.label || 'Prestation'} · il y a 3 jours</small><p>« Une équipe ponctuelle et une coupe propre. La réservation en ligne m’a évité d’attendre au téléphone. »</p><footer>Merci pour ton retour · {salon.name}</footer></article>
          </section>

          <section id="infos" className="salon-block salon-info-block">
            <span className="section-kicker">INFOS PRATIQUES</span>
            <h2>Retrouve le salon.</h2>
            <div className="detail-info-grid"><div><MapPin size={18} /><span><b>Adresse déclarée</b><small>{formatAddress(salon)}</small></span></div><div><Clock3 size={18} /><span><b>Horaires aujourd’hui</b><small>{status.label}</small></span></div></div>
            <SalonMap salons={mapSalon} selectedId={salon.id} onSelect={() => undefined} />
            <div className="detail-info-actions"><a href={mapsHref(salon)} target="_blank" rel="noreferrer"><Navigation size={15} /> Itinéraire Google Maps</a><a href={whatsappLink(salon.whatsapp || '+212600000000', `Bonjour ${salon.name}, je souhaite avoir une information.`)} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Écrire sur WhatsApp</a></div>
          </section>
        </div>

        <aside className="booking-card salon-detail-booking">
          <span className="booking-card-kicker">DISPONIBILITÉ EN DIRECT</span>
          <h3>Réserve ta chaise.</h3>
          <p>Prochain créneau</p>
          <strong>{salon.nextSlot?.label || 'Choisis une date'}</strong>
          <Link className="btn btn-primary" href={reservationHref(salon)}>Voir les créneaux</Link>
          <small><Check size={15} /> Confirmation immédiate</small><small><WalletCards size={15} /> Paiement au salon</small><small><Clock3 size={15} /> Statut mis à jour à {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
          <hr />
          <a href={whatsappLink(salon.whatsapp || '+212600000000', `Bonjour ${salon.name}, je voudrais une information.`)} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp du salon</a>
          <a href={mapsHref(salon)} target="_blank" rel="noreferrer"><Navigation size={17} /> Itinéraire</a>
          <a href="#galerie"><ExternalLink size={17} /> Voir les réalisations</a>
        </aside>
      </div>
      <Footer />
    </main>
  );
}

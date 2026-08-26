import Image from 'next/image';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HeroSearch } from '@/components/HeroSearch';
import { HeroGallery } from '@/components/HeroGallery';
import { CutsWall } from '@/components/CutsWall';
import { ArrowRight, CalendarCheck, Clock3, MapPin, Search, ShieldCheck, Star, UsersRound, WalletCards } from 'lucide-react';

import { SALONS, getOpenStatus } from '@/lib/salons';
const salons = SALONS.slice(0, 6).map((s) => {
  const st = getOpenStatus(s.hours);
  return {
    name: s.name, slug: s.slug, place: s.neighborhood,
    rating: s.rating.toFixed(1).replace('.', ','), reviews: String(s.reviews),
    distance: s.distanceKm?.toFixed(1).replace('.', ',') || '—',
    price: `${s.priceFrom}–90`, time: s.nextSlot?.label || '—', img: s.image,
    open: st.open, statusLabel: st.label,
  };
});
export default function Home(){return <main><Header/>
<section className="hero"><HeroGallery/><div className="container hero-content"><div className="eyebrow"><span/> Réservation instantanée à Casablanca</div><h1>Ta coupe.<br/><em>Sans l’attente.</em></h1><p>Choisis ton coiffeur, trouve ton créneau et paie sur place.<br/>Aucun appel. Aucune mauvaise surprise.</p><HeroSearch/></div></section>
<section className="section open-section"><div className="container"><div className="section-head"><div><span className="section-kicker">PRÈS DE CHEZ TOI</span><h2>Une chaise t’attend.</h2></div><Link href="/salons">Voir tous les salons <ArrowRight/></Link></div><div className="salon-grid">{salons.map((s,i)=><Link href={`/salons/${s.slug}`} className="salon-card" key={s.name}><div className="salon-img"><Image src={s.img} fill alt={s.name}/>{s.open?<span className="open-badge"><i className="blink"/> OUVERT · {s.statusLabel.replace('Ouvert jusqu’à ','').replace('Ouvert jusqu\'à ','')}</span>:<span className="open-badge closed"><i/> FERMÉ · {s.statusLabel}</span>}<button aria-label="Ajouter aux favoris">♡</button></div><div className="salon-body"><div><h3>{s.name}</h3><p><MapPin/> {s.place} · {s.distance} km</p></div><div className="rating"><Star fill="currentColor"/> {s.rating} <small>({s.reviews})</small></div><div className="card-foot"><span>Dès <b>{s.price} MAD</b></span><strong><Clock3/> Prochain : {s.time}</strong></div></div></Link>)}</div></div></section>
<section className="how"><div className="container"><div className="how-copy"><span className="section-kicker">SIMPLE, VRAIMENT</span><h2>De l’envie à la chaise<br/>en moins d’une minute.</h2><p>Pas de compte interminable. Pas de confirmation à attendre. Ton rendez-vous est réservé, tout simplement.</p><Link className="text-link" href="/reserver/karim">Essayer maintenant <ArrowRight/></Link></div><div className="steps"><div><b>01</b><span><Search/><h3>Trouve ton style</h3><p>Explore les vrais travaux des coiffeurs près de toi.</p></span></div><div><b>02</b><span><CalendarCheck/><h3>Choisis ton créneau</h3><p>Les disponibilités sont mises à jour en temps réel.</p></span></div><div><b>03</b><span><WalletCards/><h3>Viens, coupe, paie</h3><p>Paiement en espèces, sur place, après ta coupe.</p></span></div></div></div></section>
<CutsWall/>
<section className="trust"><div className="container trust-grid"><div><ShieldCheck/><b>Rendez-vous vérifiés</b><span>Chaque avis vient d’un vrai rendez-vous.</span></div><div><Clock3/><b>Confirmation immédiate</b><span>Ton créneau est à toi, tout de suite.</span></div><div><WalletCards/><b>Paiement sur place</b><span>Tu paies après la prestation, en espèces.</span></div><div><UsersRound/><b>Artisans du quartier</b><span>Des professionnels validés un par un.</span></div></div></section>
<section className="testimonial"><div className="container"><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><blockquote>« Avant, j’appelais trois fois sans réponse.<br/>Là j’ai réservé en 30 secondes. »</blockquote><div className="quote-user"><span>YB</span><p><b>Youssef B.</b><small>Client vérifié · Sidi Bernoussi</small></p></div></div></section>
<section className="partner" id="partenaire"><div className="container partner-inner"><div><span className="section-kicker dark">POUR LES COIFFEURS</span><h2>Concentre-toi sur ta coupe.<br/>On remplit ton agenda.</h2><p>Moins d’appels manqués. Plus de clients fidèles.<br/>Gratuit pour les premiers salons fondateurs.</p></div><Link href="/pro" className="btn partner-btn">Découvrir l’espace pro <ArrowRight/></Link></div></section>
<Footer/></main>}

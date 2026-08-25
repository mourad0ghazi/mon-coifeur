import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div className="foot-brand">
          <Logo />
          <p>Le bon coiffeur. Le bon créneau.<br />Sans appel, sans attente.</p>
          <span>Casablanca, Maroc 🇲🇦</span>
        </div>
        <div>
          <h4>Découvrir</h4>
          <Link href="/salons">Tous les salons</Link>
          <Link href="/inspirations">Inspirations</Link>
          <Link href="/reserver/karim">Réserver</Link>
        </div>
        <div>
          <h4>HLAQTI</h4>
          <Link href="/a-propos">À propos</Link>
          <Link href="/a-propos/partenaire">Devenir partenaire</Link>
          <Link href="/aide">Centre d&apos;aide</Link>
        </div>
        <div>
          <h4>Légal</h4>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/conditions">Conditions</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
        </div>
      </div>
      <div className="container foot-bottom">
        <span>© 2026 HLAQTI — Tous droits réservés.</span>
        <span>FR · العربية · الدارجة · EN</span>
      </div>
    </footer>
  );
}

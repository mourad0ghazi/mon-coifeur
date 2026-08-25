'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MessageCircle, Phone } from 'lucide-react';
import { LegalLayout } from '@/components/LegalLayout';

const FAQ = [
  {
    q: 'Comment réserver un rendez-vous ?',
    a: 'Sur la page d’accueil, indiquez votre ville, votre quartier et le service souhaité, puis choisissez un créneau disponible. La confirmation est immédiate et un rappel vous est envoyé sur WhatsApp.',
  },
  {
    q: 'Dois-je payer en ligne ?',
    a: 'Non. Conformément à la Loi 31-08 sur la protection des consommateurs, les prix sont affichés avant validation et le paiement s’effectue sur place, après la prestation.',
  },
  {
    q: 'Comment annuler ou reporter ?',
    a: 'L’annulation est gratuite jusqu’à 2 heures avant le rendez-vous, depuis « Mon compte ». Passé ce délai, des no-shows répétés peuvent entraîner la restriction de votre compte.',
  },
  {
    q: 'Comment devenir coiffeur partenaire ?',
    a: 'Rendez-vous sur « Devenir partenaire », renseignez votre salon via Google Maps, ajoutez au moins 3 photos et soumettez votre dossier. La validation a lieu sous 24 à 48 h après vérification.',
  },
  {
    q: 'Mes données sont-elles protégées ?',
    a: 'Oui, HLAQTI respecte la Loi 09-08 relative à la protection des données à caractère personnel. Vous disposez de droits d’accès, de rectification et d’opposition, exerçables à dpo@hlaqti.ma.',
  },
  {
    q: 'Comment signaler un problème ou un contenu ?',
    a: 'Utilisez le bouton de signalement sur un profil, un avis ou une photo, ou écrivez à contact@hlaqti.ma. Notre équipe modère dans les meilleurs délais.',
  },
];

export default function Aide() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <LegalLayout kicker="ASSISTANCE" title="Centre d'aide">
      <p className="legal-lead">Trouvez rapidement une réponse à vos questions.</p>

      <section className="faq">
        {FAQ.map((item, i) => (
          <div key={i} className={'faq-item' + (open === i ? ' open' : '')}>
            <button onClick={() => setOpen(open === i ? null : i)}>
              <span>{item.q}</span><ChevronDown size={18} />
            </button>
            {open === i && <p>{item.a}</p>}
          </div>
        ))}
      </section>

      <h2>Contacter le support</h2>
      <div className="help-contact">
        <a href="https://wa.me/212600000000" target="_blank" rel="noreferrer" className="hc-card">
          <MessageCircle size={20} /><b>WhatsApp</b><small>+212 600 000 000 · Lun–Sam, 9 h–21 h</small>
        </a>
        <a href="tel:+212600000000" className="hc-card">
          <Phone size={20} /><b>Téléphone</b><small>+212 600 000 000</small>
        </a>
        <a href="mailto:contact@hlaqti.ma" className="hc-card">
          <b>Email</b><small>contact@hlaqti.ma</small>
        </a>
      </div>

      <h2>Liens utiles</h2>
      <ul>
        <li><Link href="/conditions">Conditions d’utilisation</Link></li>
        <li><Link href="/confidentialite">Politique de confidentialité</Link></li>
        <li><Link href="/a-propos/partenaire">Devenir partenaire</Link></li>
        <li><Link href="/mentions-legales">Mentions légales</Link></li>
      </ul>
    </LegalLayout>
  );
}

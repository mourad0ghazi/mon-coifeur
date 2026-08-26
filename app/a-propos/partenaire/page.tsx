import Link from 'next/link';
import { LegalLayout } from '@/components/LegalLayout';
import { Check, MessageCircle, Phone, Scissors, ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Devenir partenaire · HLAQTI' };

export default function DevenirPartenaire() {
  return (
    <LegalLayout kicker="POUR LES COIFFEURS" title="Devenir partenaire">
      <p className="legal-lead">
        Rejoignez HLAQTI et remplissez votre agenda sans aucun effort. La plateforme est gratuite
        pour les premiers salons fondateurs.
      </p>

      <div className="partner-steps">
        {[
          { n: '1', t: 'Inscription en ligne', d: 'Renseignez votre salon, votre adresse via Google Maps et ajoutez vos plus belles réalisations.' },
          { n: '2', t: 'Vérification', d: 'Notre équipe vérifie votre identité, vos photos et la qualité de votre travail sous 24 à 48 h.' },
          { n: '3', t: 'Validation', d: 'Votre compte coiffeur est activé. Vous recevez vos premières réservations.' },
        ].map((s) => (
          <div key={s.n} className="pstep">
            <b>{s.n}</b><h3>{s.t}</h3><p>{s.d}</p>
          </div>
        ))}
      </div>

      <h2>Avantages</h2>
      <ul className="legal-checks">
        <li><Check size={16} /> Réservations confirmées automatiquement, 24 h/24</li>
        <li><Check size={16} /> Rappels WhatsApp à vos clients (réduction des no-show)</li>
        <li><Check size={16} /> Application coiffeur : agenda, rendez-vous, contacts clients</li>
        <li><Check size={16} /> Vitrine de vos réalisations et avis vérifiés</li>
        <li><Check size={16} /> Statistiques de votre activité</li>
      </ul>

      <h2>Engagements</h2>
      <p>
        En devenant partenaire, vous vous engagez à honorer les rendez-vous confirmés, à respecter
        les horaires et prix affichés, à garantir l’hygiène du salon et à fournir un service de
        qualité. Vous restez seul responsable de votre activité et de vos obligations légales et
        fiscales au Maroc (registre de commerce, patente, CNSS, déclarations fiscales).
      </p>

      <h2>Documents requis</h2>
      <ul>
        <li>Numéro de téléphone WhatsApp fonctionnel</li>
        <li>Au moins 3 photos récentes de vos réalisations</li>
        <li>Adresse exacte et horaires d’ouverture</li>
        <li>Pièce d’identité (vérification interne, non diffusée)</li>
      </ul>

      <div className="legal-cta">
        <Scissors size={22} />
        <p>Prêt ?<br /><small>L’inscription prend moins de 3 minutes.</small></p>
        <Link href="/devenir-partenaire" className="btn btn-primary">Commencer</Link>
      </div>

      <h2>Besoin d’aide ?</h2>
      <p>
        <MessageCircle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        WhatsApp : +212 600 000 000 &nbsp;·&nbsp;
        <Phone size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        <a href="mailto:partenaires@hlaqti.ma">partenaires@hlaqti.ma</a>
      </p>
    </LegalLayout>
  );
}

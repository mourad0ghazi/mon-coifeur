import { LegalLayout } from '@/components/LegalLayout';
import { ShieldCheck, Scissors, MapPin, Star, WalletCards } from 'lucide-react';

export const metadata = { title: 'À propos · HLAQTI' };

export default function APropos() {
  return (
    <LegalLayout kicker="NOTRE MISSION" title="À propos de HLAQTI" updated="25 août 2026">
      <p className="legal-lead">
        HLAQTI est une plateforme marocaine qui met en relation les clients et les meilleurs
        coiffeurs de leur quartier, sans appel téléphonique, sans attente et sans mauvaise
        surprise. Notre ambition : valoriser le savoir-faire des artisans coiffeurs du Maroc tout
        en simplifiant la vie de leurs clients.
      </p>

      <h2>Notre vision</h2>
      <p>
        Au Maroc, réserver une coupe se fait encore souvent par appels sans réponse ou en se
        déplaçant. HLAQTI modernise ce parcours grâce à la réservation instantanée, la
        géolocalisation et les confirmations WhatsApp, tout en respectant les usages et la
        réglementation locaux.
      </p>

      <div className="about-values">
        <div><Scissors /><h3>Savoir-faire</h3><p>Nous sélectionnons les coiffeurs un par un, après vérification de leur travail.</p></div>
        <div><ShieldCheck /><h3>Confiance</h3><p>Avis vérifiés, profils validés, prix transparents affichés avant réservation.</p></div>
        <div><MapPin /><h3>Proximité</h3><p>Trouvez une chaise disponible près de chez vous, dans votre quartier.</p></div>
        <div><Star /><h3>Qualité</h3><p>Les meilleures réalisations sont mises en avant sur le mur des coupes.</p></div>
        <div><WalletCards /><h3>Paiement sur place</h3><p>Aucun paiement en ligne imposé : vous réglez après votre coupe.</p></div>
      </div>

      <h2>Comment ça marche</h2>
      <ol>
        <li>Le client recherche par ville, quartier ou service.</li>
        <li>Il consulte les profils, photos et avis, puis choisit un créneau disponible.</li>
        <li>La réservation est confirmée immédiatement, avec rappel WhatsApp.</li>
        <li>Le client se rend au salon et paie sur place après la prestation.</li>
      </ol>

      <h2>Nos engagements</h2>
      <ul>
        <li>Plateforme 100 % marocaine, conforme à la Loi 09-08 sur les données personnelles et aux recommandations de la CNDP.</li>
        <li>Respect de la Loi 31-08 sur la protection des consommateurs (information claire sur les prix, droit de rétractation/réservation).</li>
        <li>Modération des contenus et traitement des signalements.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        HLAQTI · Casablanca, Maroc<br />
        Email : <a href="mailto:contact@hlaqti.ma">contact@hlaqti.ma</a><br />
        WhatsApp : +212 600 000 000
      </p>
    </LegalLayout>
  );
}

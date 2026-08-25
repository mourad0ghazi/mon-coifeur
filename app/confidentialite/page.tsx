import { LegalLayout } from '@/components/LegalLayout';

export const metadata = { title: 'Confidentialité · HLAQTI' };

export default function Confidentialite() {
  return (
    <LegalLayout kicker="VOS DONNÉES" title="Politique de confidentialité" updated="25 août 2026">
      <p className="legal-lead">
        HLAQTI accorde une importance particulière à la protection de votre vie privée. La présente
        politique décrit les données que nous collectons, leur utilisation et vos droits, dans le
        respect de la <b>Loi n° 09-08</b> relative à la protection des personnes physiques à l’égard
        du traitement des données à caractère personnel et des recommandations de la <b>CNDP</b>
        (Commission Nationale de contrôle de la protection des Données à caractère Personnel).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est HLAQTI, dont le siège est à Casablanca, Maroc.
        Contact : <a href="mailto:contact@hlaqti.ma">contact@hlaqti.ma</a>.
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li><b>Données d’inscription</b> : prénom, nom, numéro de téléphone (WhatsApp), adresse e-mail, civilité, date de naissance, ville et quartier.</li>
        <li><b>Données professionnelles (coiffeurs)</b> : nom du salon, adresse, photos, spécialités, horaires, documents de validation.</li>
        <li><b>Données de réservation</b> : rendez-vous, préférences, notes, avis.</li>
        <li><b>Données de localisation</b> : uniquement avec votre accord, pour faciliter la recherche de salons à proximité.</li>
        <li><b>Données techniques</b> : adresse IP, type d’appareil, pages consultées (cookies essentiels).</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont traitées pour :</p>
      <ul>
        <li>créer et gérer votre compte ;</li>
        <li>permettre la réservation et la confirmation des rendez-vous ;</li>
        <li>envoyer des notifications et rappels WhatsApp/SMS ;</li>
        <li>vérifier l’identité des coiffeurs partenaires ;</li>
        <li>améliorer le service et établir des statistiques anonymisées ;</li>
        <li>assurer la sécurité et prévenir la fraude.</li>
      </ul>

      <h2>4. Base légale</h2>
      <p>
        Les traitements reposent sur l’exécution des conditions d’utilisation, votre consentement
        (notamment pour la géolocalisation et les communications marketing), et les obligations
        légales et fiscales applicables au Maroc.
      </p>

      <h2>5. Destinataires des données</h2>
      <p>
        Vos données sont accessibles au sein de HLAQTI pour la gestion du service. Les informations
        nécessaires (nom, téléphone) sont transmises au coiffeur concerné par une réservation. Nous
        faisons appel à des prestataires (hébergement, service WhatsApp Business) qui agissent selon
        nos instructions. Aucune donnée n’est vendue à des tiers.
      </p>

      <h2>6. Conservation</h2>
      <p>
        Vos données sont conservées pendant la durée de votre compte, puis archivées pour la durée
        nécessaire au respect des obligations légales (notamment fiscales) et des délais de
        prescription applicables.
      </p>

      <h2>7. Vos droits</h2>
      <p>Conformément à la Loi 09-08, vous disposez des droits suivants :</p>
      <ul>
        <li>droit d’accès et de rectification de vos données ;</li>
        <li>droit à l’effacement (« droit à l’oubli ») ;</li>
        <li>droit d’opposition et de limitation du traitement ;</li>
        <li>droit de retirer votre consentement à tout moment ;</li>
        <li>droit d’introduire une réclamation auprès de la CNDP.</li>
      </ul>
      <p>
        Pour exercer ces droits, écrivez à <a href="mailto:dpo@hlaqti.ma">dpo@hlaqti.ma</a>, une
        pièce d’identité pouvant vous être demandée.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Nous utilisons des cookies strictement nécessaires au fonctionnement du site. Aucun cookie
        publicitaire tiers n’est déposé sans votre consentement.
      </p>

      <h2>9. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles (chiffrement, accès
        restreint, journalisation) pour protéger vos données contre tout accès non autorisé.
      </p>

      <h2>10. Transferts</h2>
      <p>
        Les données sont principalement traitées au Maroc. En cas de recours à un prestataire situé
        à l’étranger, des garanties appropriées sont mises en place conformément à la réglementation.
      </p>
    </LegalLayout>
  );
}

import Link from 'next/link';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata = { title: 'Conditions d’utilisation · HLAQTI' };

export default function Conditions() {
  return (
    <LegalLayout kicker="CADRE LÉGAL" title="Conditions générales d’utilisation" updated="25 août 2026">
      <p className="legal-lead">
        Les présentes Conditions Générales d’Utilisation (ci-après « CGU ») régissent l’accès et
        l’utilisation de la plateforme HLAQTI, éditée au Maroc. En créant un compte ou en utilisant
        nos services, vous acceptez sans réserve les présentes conditions.
      </p>

      <h2>1. Objet</h2>
      <p>
        HLAQTI est une plateforme de mise en relation entre clients et coiffeurs/salons de coiffure
        partenaires au Maroc. Elle permet la réservation de rendez-vous, la consultation de profils
        et la communication entre utilisateurs. HLAQTI n’est pas l’employeur des coiffeurs et
        n’exerce pas elle-même l’activité de coiffure.
      </p>

      <h2>2. Accès au service</h2>
      <ul>
        <li>L’utilisation du service nécessite un compte validé par numéro de téléphone marocain.</li>
        <li>Vous devez être âgé d’au moins 18 ans, ou disposer de l’autorisation d’un représentant légal.</li>
        <li>Vous vous engagez à fournir des informations exactes (identité, téléphone, adresse).</li>
      </ul>

      <h2>3. Réservations et paiement</h2>
      <p>
        Conformément à la <b>Loi 31-08</b> relative à la protection des consommateurs, les prix,
        durées et conditions des prestations sont affichés avant toute validation. Le paiement
        s’effectue auprès du coiffeur, sur place, après la prestation, sauf mention contraire.
        Les acomptes éventuels en ligne font l’objet d’une information claire et d’un reçu.
      </p>
      <ul>
        <li>Toute réservation est confirmée immédiatement sous réserve de disponibilité.</li>
        <li>L’annulation est gratuite jusqu’à 2 heures avant l’heure du rendez-vous.</li>
        <li>En cas de non-présentation (« no-show »), des sanctions peuvent être appliquées (avertissement, restriction de compte).</li>
      </ul>

      <h2>4. Comportement des utilisateurs</h2>
      <p>Il est strictement interdit de :</p>
      <ul>
        <li>créer de faux comptes ou usurper l’identité d’autrui ;</li>
        <li>publier des contenus illicites, diffamatoires, violents, discriminatoires ou portant atteinte à la dignité humaine ;</li>
        <li>téléverser des photos ne vous appartenant pas ou pour lesquelles vous n’avez pas de consentement ;</li>
        <li>harceler, menacer ou importuner un coiffeur ou un client ;</li>
        <li>contourner le système de réservation ou nuire au bon fonctionnement de la plateforme.</li>
      </ul>

      <h2>5. Comptes partenaires (coiffeurs)</h2>
      <ul>
        <li>Le coiffeur doit déclarer des informations exactes et justifier de son identité lors de la validation.</li>
        <li>Il s’engage à respecter les horaires renseignés et à honorer les rendez-vous confirmés.</li>
        <li>Il est seul responsable du respect de la réglementation marocaine applicable à son activité (autorisations, hygiène, fiscalité, déclaration CNSS).</li>
        <li>HLAQTI se réserve le droit de suspendre ou supprimer un compte en cas de manquement.</li>
      </ul>

      <h2>6. Contenus et photos</h2>
      <p>
        Vous garantissez détenir les droits sur les photos que vous téléversez et avoir obtenu le
        consentement des personnes photographiables, conformément à la <b>Loi 09-08</b> et au droit
        à l’image. Vous concédez à HLAQTI une licence d’utilisation non exclusive, à titre gratuit,
        pour la présentation sur la plateforme.
      </p>

      <h2>7. Responsabilité</h2>
      <p>
        HLAQTI agit en qualité d’intermédiaire technique. Sa responsabilité ne saurait être engagée
        du fait de la qualité d’une prestation, d’un litige entre client et coiffeur, d’une
        annulation ou d’un dommage consécutif à une prestation. HLAQTI n’est pas responsable des
        contenus publiés par les utilisateurs, mais agit promptement dès signalement.
      </p>

      <h2>8. Données personnelles</h2>
      <p>
        Le traitement de vos données est régi par notre{' '}
        <Link href="/confidentialite">Politique de confidentialité</Link>, établie conformément à la
        Loi 09-08 relative à la protection des personnes physiques à l’égard du traitement des
        données à caractère personnel, et aux recommandations de la CNDP.
      </p>

      <h2>9. Modification des CGU</h2>
      <p>
        HLAQTI peut modifier les présentes conditions. Toute modification substantielle est notifiée
        aux utilisateurs. La poursuite de l’utilisation du service vaut acceptation.
      </p>

      <h2>10. Droit applicable et règlement des litiges</h2>
      <p>
        Les présentes CGU sont soumises au droit marocain. En cas de litige, une solution amiable
        est recherchée préalablement. À défaut, les tribunaux compétents du Maroc sont saisis,
        conformément aux dispositions du Code marocain de la consommation (Loi 31-08).
      </p>

      <h2>11. Contact</h2>
      <p>Pour toute question : <a href="mailto:contact@hlaqti.ma">contact@hlaqti.ma</a> · WhatsApp : +212 600 000 000 · Casablanca, Maroc.</p>
    </LegalLayout>
  );
}

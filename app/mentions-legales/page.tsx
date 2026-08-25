import { LegalLayout } from '@/components/LegalLayout';

export const metadata = { title: 'Mentions légales · HLAQTI' };

export default function MentionsLegales() {
  return (
    <LegalLayout kicker="INFORMATIONS LÉGALES" title="Mentions légales" updated="25 août 2026">
      <h2>1. Éditeur de la plateforme</h2>
      <p>
        HLAQTI est une plateforme de réservation de services de coiffure au Maroc.
      </p>
      <ul>
        <li><b>Éditeur :</b> HLAQTI</li>
        <li><b>Siège social :</b> Casablanca, Maroc</li>
        <li><b>Contact :</b> <a href="mailto:contact@hlaqti.ma">contact@hlaqti.ma</a></li>
        <li><b>Téléphone / WhatsApp :</b> +212 600 000 000</li>
      </ul>
      <p>
        L’identifiant commun de l’entreprise (ICE) ainsi que les coordonnées complètes de
        l’éditeur seront indiqués dès l’immatriculation au Registre du Commerce de Casablanca.
      </p>

      <h2>2. Directeur de la publication</h2>
      <p>Le directeur de la publication est le représentant légal de HLAQTI.</p>

      <h2>3. Hébergement</h2>
      <p>
        La plateforme est hébergée par un prestataire d’hébergement cloud sécurisé. Les données
        sont traitées dans le respect de la législation marocaine, notamment la Loi 09-08 relative
        à la protection des données à caractère personnel.
      </p>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments du site (logos, textes, visuels, code, marque HLAQTI) est protégé
        par le droit d’auteur et le droit des marques au Maroc. Toute reproduction, représentation
        ou exploitation sans autorisation écrite est interdite et susceptible de constituer une
        contrefaçon sanctionnée par la loi.
      </p>
      <p>
        Les photos téléversées par les coiffeurs demeurent leur propriété ; ils concèdent à HLAQTI
        une licence d’utilisation dans le cadre du service, et garantissent détenir les droits et
        autorisations nécessaires (notamment le droit à l’image des personnes photographiées).
      </p>

      <h2>5. Protection des données</h2>
      <p>
        Conformément à la <b>Loi n° 09-08</b>, les utilisateurs disposent d’un droit d’accès, de
        rectification et d’opposition, exerçable à <a href="mailto:dpo@hlaqti.ma">dpo@hlaqti.ma</a>.
        Voir la <a href="/confidentialite">Politique de confidentialité</a>.
      </p>

      <h2>6. Loi applicable</h2>
      <p>
        Le site et ses conditions d’utilisation sont soumis au droit marocain, notamment la
        Loi 31-08 sur la protection des consommateurs, la Loi 53-05 relative à la société de
        l’information et la Loi 09-08 sur les données personnelles.
      </p>
    </LegalLayout>
  );
}

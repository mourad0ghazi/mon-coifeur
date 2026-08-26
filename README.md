# HLAQTI

Prototype web haute fidélité de la plateforme de réservation HLAQTI pour salons de coiffure à Casablanca.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Écrans réalisés

- `/` — accueil public et recherche
- `/salons` — liste et filtres
- `/salons/mouad` — fiche salon complète
- `/reserver/karim` — tunnel de réservation interactif en 3 étapes
- `/mon-compte` — espace client
- `/pro` — dashboard quotidien du coiffeur
- `/pro/agenda` — agenda professionnel
- `/admin` — dashboard Super-Admin

## Stack

Next.js 15, React 19, TypeScript, CSS responsive et Lucide Icons.

## Authentification et rôles

La page `/connexion` permet de choisir explicitement **Client** ou **Coiffeur**, puis de se connecter sans mot de passe par OTP WhatsApp. Les sessions sont des cookies HTTP-only signés et le middleware applique les permissions sur `/mon-compte`, `/pro` et `/admin`.

En développement, les comptes persistants sont stockés dans `.data/hlaqti.sqlite` :

- client : `06 12 34 56 78` ;
- coiffeur actif : `06 11 11 11 11` ;
- Super-Admin : `06 00 00 00 01` ;
- code OTP de démonstration : `123456`.

Un nouveau client est activé immédiatement. Un nouveau coiffeur est créé avec le statut `EN_ATTENTE` puis dirigé vers le dossier partenaire. Choisir un rôle différent pour un numéro existant est refusé par le backend.

Google, Facebook et Apple/iCloud sont disponibles en mode démonstration local et créent une identité persistante distincte. Pour la production, les identifiants OAuth officiels de Google Cloud, Meta Developers et Apple Developer doivent être renseignés dans l’environnement avant d’activer ces fournisseurs.

## API métier V1

- `POST /api/v1/auth/request-otp` — émission d’un OTP haché, valable cinq minutes ;
- `POST /api/v1/auth/verify-otp` — vérification, création du compte et session ;
- `GET /api/v1/auth/me` — session courante ;
- `POST /api/v1/auth/logout` — révocation du cookie ;
- `GET /api/v1/health` — état de l’API
- `GET /api/v1/availability?barberId=karim&date=2026-08-25&duration=40` — créneaux calculés
- `POST /api/v1/appointments` — réservation avec en-tête `Idempotency-Key`

L’API de démonstration applique la détection des chevauchements, les pauses, le tampon entre rendez-vous et l’idempotence. Le tunnel public l’utilise pour confirmer un rendez-vous.

Le schéma PostgreSQL de production est organisé en trois migrations :

1. `001_initial.sql` — noyau transactionnel et contrainte anti-double-booking ;
2. `002_platform_completion.sql` — OTP, sessions, 2FA, files d’attente, fidélité, modération, triggers métier et audit append-only ;
3. `003_reference_data.sql` — quartiers de Casablanca, catégories, spécialités, plans et jours fériés.

```bash
cp .env.example .env.local
for migration in database/migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
done
```

Les migrations requièrent PostgreSQL 15 avec PostGIS. Elles installent également `btree_gist`, `pg_trgm`, `unaccent`, `citext`, `cube` et `earthdistance`.

## Vérification

```bash
npm run build
```

Les contenus, horaires et statistiques sont des données de démonstration. Les photos du prototype doivent être remplacées par les photos réelles du Salon Mouad avant mise en production. L’authentification OTP et WhatsApp Business nécessitent les identifiants des fournisseurs concernés.

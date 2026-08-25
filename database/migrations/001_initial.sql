-- HLAQTI — schéma PostgreSQL initial
-- PostgreSQL 15+ / exécuter dans une transaction sur une base vide.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN','MODERATEUR','OWNER_SALON','COIFFEUR','CLIENT');
CREATE TYPE account_status AS ENUM ('EN_ATTENTE','EN_ATTENTE_INFOS','ACTIF','SUSPENDU','REFUSE','BANNI');
CREATE TYPE appointment_status AS ENUM ('EN_ATTENTE','CONFIRME','EN_COURS','TERMINE','ANNULE_CLIENT','ANNULE_COIFFEUR','NO_SHOW');
CREATE TYPE appointment_channel AS ENUM ('EN_LIGNE','MANUEL','WALKIN');
CREATE TYPE notification_channel AS ENUM ('WHATSAPP','PUSH','SMS','EMAIL','IN_APP');

CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), role user_role NOT NULL DEFAULT 'CLIENT',
 full_name text NOT NULL, phone_e164 text NOT NULL UNIQUE CHECK (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
 whatsapp_e164 text, email citext UNIQUE, avatar_url text, locale varchar(5) NOT NULL DEFAULT 'fr',
 status account_status NOT NULL DEFAULT 'ACTIF', reliability_score numeric(7,2) NOT NULL DEFAULT 0,
 otp_verified_at timestamptz, last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
-- Gouvernance absolue : un seul Super-Admin peut exister.
CREATE UNIQUE INDEX one_super_admin_only ON users ((role)) WHERE role = 'SUPER_ADMIN';

CREATE TABLE neighborhoods (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), city text NOT NULL, name jsonb NOT NULL,
 center geography(point,4326), active boolean NOT NULL DEFAULT true, UNIQUE(city, name)
);
CREATE TABLE plans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, price_mad numeric(10,2) NOT NULL DEFAULT 0, limits jsonb NOT NULL DEFAULT '{}');
CREATE TABLE salons (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, name text NOT NULL,
 owner_id uuid NOT NULL REFERENCES users(id), description jsonb NOT NULL DEFAULT '{}', address text NOT NULL,
 neighborhood_id uuid REFERENCES neighborhoods(id), city text NOT NULL DEFAULT 'Casablanca', landmark text,
 location geography(point,4326), whatsapp_e164 text, socials jsonb NOT NULL DEFAULT '{}', amenities jsonb NOT NULL DEFAULT '{}',
 rating numeric(3,2), review_count integer NOT NULL DEFAULT 0, status account_status NOT NULL DEFAULT 'EN_ATTENTE',
 validated_by uuid REFERENCES users(id), validated_at timestamptz, plan_id uuid REFERENCES plans(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX salons_location_gix ON salons USING gist(location);
CREATE INDEX salons_public_idx ON salons(city, neighborhood_id) WHERE status='ACTIF';

CREATE TABLE barbers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES users(id), salon_id uuid NOT NULL REFERENCES salons(id),
 bio jsonb NOT NULL DEFAULT '{}', specialties text[] NOT NULL DEFAULT '{}', languages text[] NOT NULL DEFAULT '{ary}',
 years_experience smallint CHECK (years_experience >= 0), rating numeric(3,2), review_count integer NOT NULL DEFAULT 0,
 status account_status NOT NULL DEFAULT 'EN_ATTENTE', agenda_settings jsonb NOT NULL DEFAULT '{"gridMinutes":15,"bufferMinutes":5,"minLeadMinutes":30,"horizonDays":14}',
 validated_by uuid REFERENCES users(id), validated_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name jsonb NOT NULL, icon text, display_order integer NOT NULL DEFAULT 0, gender text);
CREATE TABLE services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), salon_id uuid NOT NULL REFERENCES salons(id), barber_id uuid REFERENCES barbers(id), category_id uuid REFERENCES categories(id),
 name jsonb NOT NULL, description jsonb NOT NULL DEFAULT '{}', gender text NOT NULL DEFAULT 'mixte', duration_minutes smallint NOT NULL CHECK(duration_minutes BETWEEN 5 AND 480),
 price_mad numeric(10,2) NOT NULL CHECK(price_mad >= 0), starting_price boolean NOT NULL DEFAULT false, active boolean NOT NULL DEFAULT true,
 requires_validation boolean NOT NULL DEFAULT false, buffer_minutes smallint NOT NULL DEFAULT 0, display_order integer NOT NULL DEFAULT 0, photo_url text
);
CREATE TABLE schedules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
 weekday smallint NOT NULL CHECK(weekday BETWEEN 0 AND 6), starts_at time NOT NULL, ends_at time NOT NULL, kind text NOT NULL CHECK(kind IN ('TRAVAIL','PAUSE')),
 CHECK(starts_at < ends_at)
);
CREATE INDEX schedules_barber_day_idx ON schedules(barber_id, weekday);
CREATE TABLE schedule_overrides (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE, day date NOT NULL,
 closed boolean NOT NULL DEFAULT false, starts_at time, ends_at time, reason text, UNIQUE(barber_id, day, starts_at)
);
CREATE TABLE time_offs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), barber_id uuid NOT NULL REFERENCES barbers(id), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 reason text, notify_clients boolean NOT NULL DEFAULT true, CHECK(starts_at < ends_at)
);

CREATE TABLE appointments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference varchar(12) NOT NULL UNIQUE,
 client_id uuid NOT NULL REFERENCES users(id), barber_id uuid NOT NULL REFERENCES barbers(id), salon_id uuid NOT NULL REFERENCES salons(id),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, duration_minutes smallint NOT NULL,
 quoted_price_mad numeric(10,2) NOT NULL, collected_amount_mad numeric(10,2), status appointment_status NOT NULL DEFAULT 'CONFIRME',
 channel appointment_channel NOT NULL DEFAULT 'EN_LIGNE', client_note varchar(200), private_note text,
 cancelled_by uuid REFERENCES users(id), cancelled_at timestamptz, cancellation_reason text,
 idempotency_key uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(starts_at < ends_at),
 UNIQUE(client_id, idempotency_key)
);
-- Anti-double-booking au niveau base : seuls les rendez-vous actifs bloquent le créneau.
ALTER TABLE appointments ADD CONSTRAINT no_overlapping_barber_appointments EXCLUDE USING gist (
 barber_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (status IN ('EN_ATTENTE','CONFIRME','EN_COURS'));
CREATE INDEX appointments_barber_start_idx ON appointments(barber_id, starts_at);
CREATE INDEX appointments_client_active_idx ON appointments(client_id, status) WHERE status IN ('EN_ATTENTE','CONFIRME','EN_COURS');
CREATE TABLE appointment_services (
 appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE, service_id uuid NOT NULL REFERENCES services(id),
 price_mad numeric(10,2) NOT NULL, duration_minutes smallint NOT NULL, PRIMARY KEY(appointment_id, service_id)
);
CREATE TABLE payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), appointment_id uuid NOT NULL REFERENCES appointments(id), provider text, amount_mad numeric(10,2), status text, payload jsonb, created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), appointment_id uuid NOT NULL UNIQUE REFERENCES appointments(id), client_id uuid NOT NULL REFERENCES users(id),
 barber_id uuid NOT NULL REFERENCES barbers(id), salon_id uuid NOT NULL REFERENCES salons(id), overall smallint NOT NULL CHECK(overall BETWEEN 1 AND 5),
 result smallint CHECK(result BETWEEN 1 AND 5), punctuality smallint CHECK(punctuality BETWEEN 1 AND 5), welcome smallint CHECK(welcome BETWEEN 1 AND 5),
 hygiene smallint CHECK(hygiene BETWEEN 1 AND 5), value_for_money smallint CHECK(value_for_money BETWEEN 1 AND 5), comment text,
 photos text[] NOT NULL DEFAULT '{}', status text NOT NULL DEFAULT 'PUBLIE', helpful_count integer NOT NULL DEFAULT 0,
 reply text, replied_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE portfolio_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), barber_id uuid NOT NULL REFERENCES barbers(id), url text NOT NULL, before_url text,
 caption varchar(100), tags text[] NOT NULL DEFAULT '{}', service_id uuid REFERENCES services(id), consent boolean NOT NULL,
 consent_at timestamptz, consent_ip inet, moderation_status text NOT NULL DEFAULT 'A_VERIFIER', created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(consent = true AND consent_at IS NOT NULL)
);
CREATE TABLE notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), type text NOT NULL, channel notification_channel NOT NULL,
 payload jsonb NOT NULL, status text NOT NULL DEFAULT 'A_ENVOYER', scheduled_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, read_at timestamptz, error text
);
CREATE INDEX notifications_queue_idx ON notifications(scheduled_at) WHERE status='A_ENVOYER';
CREATE TABLE settings (key text PRIMARY KEY, value jsonb NOT NULL, group_name text NOT NULL, updated_by uuid REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE translations (key text NOT NULL, locale varchar(5) NOT NULL, value text NOT NULL, updated_by uuid REFERENCES users(id), PRIMARY KEY(key,locale));
CREATE TABLE audit_logs (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid REFERENCES users(id), action text NOT NULL, target_type text NOT NULL,
 target_id text, before_data jsonb, after_data jsonb, ip inet, user_agent text, created_at timestamptz NOT NULL DEFAULT now()
);
-- Append-only : l'utilisateur applicatif ne reçoit aucun droit UPDATE/DELETE sur audit_logs.

INSERT INTO settings(key,value,group_name) VALUES
 ('booking.cancellation_window_hours','2','booking'),('booking.default_grid_minutes','15','booking'),
 ('booking.max_active_per_client','2','booking'),('platform.timezone','"Africa/Casablanca"','general'),
 ('features.wait_queue','true','features'),('features.online_payment','false','features');

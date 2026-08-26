-- HLAQTI — Migration 002 : complétion du schéma métier (Volume 3)
-- À exécuter après 001_initial.sql sur PostgreSQL 15+.
-- Cette migration aligne le socle existant sur le modèle complet fourni le 24/08/2026.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
CREATE EXTENSION IF NOT EXISTS citext;

-- Valeurs supplémentaires du cycle de vie complet.
ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'DETACHE';
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'ANNULE_SYSTEME';

DO $$ BEGIN CREATE TYPE service_gender AS ENUM ('HOMME','FEMME','ENFANT','MIXTE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE salon_gender AS ENUM ('HOMME','FEMME','MIXTE','MIXTE_SEPARE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE schedule_kind AS ENUM ('TRAVAIL','PAUSE','PRIERE','DEJEUNER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE moderation_status AS ENUM ('EN_ATTENTE','APPROUVE','REJETE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE waitlist_status AS ENUM ('EN_ATTENTE','NOTIFIE','CONVERTI','EXPIRE','ANNULE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE queue_status AS ENUM ('EN_FILE','APPELE','SERVI','ABSENT','PARTI'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sanction_level AS ENUM ('AVERTISSEMENT','RETRAIT_CONTENU','SUSPENSION_7J','SUSPENSION_30J','BANNISSEMENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authentification OTP, 2FA et sessions.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS totp_secret text,
  ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS backup_codes text[],
  ADD COLUMN IF NOT EXISTS cut_preferences text,
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS status_reason text,
  ADD COLUMN IF NOT EXISTS no_show_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_cancel_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS otp_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), phone_e164 text NOT NULL, code_hash text NOT NULL,
 purpose text NOT NULL CHECK(purpose IN ('LOGIN','PHONE_CHANGE','BARBER_VERIFY')),
 attempts smallint NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3), expires_at timestamptz NOT NULL,
 consumed_at timestamptz, ip inet, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_phone_recent_idx ON otp_codes(phone_e164, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 refresh_hash text NOT NULL, device_label text, ip inet, user_agent text,
 expires_at timestamptz NOT NULL, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_active_user_idx ON sessions(user_id) WHERE revoked_at IS NULL;

-- Le Super-Admin est unique (index de 001) ET obligatoirement protégé par TOTP.
CREATE OR REPLACE FUNCTION enforce_super_admin_security() RETURNS trigger AS $$
BEGIN
 IF NEW.role='SUPER_ADMIN' AND (NOT NEW.totp_enabled OR NEW.totp_secret IS NULL) THEN
   RAISE EXCEPTION 'La 2FA TOTP est obligatoire pour le SUPER_ADMIN';
 END IF;
 RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS super_admin_security ON users;
CREATE TRIGGER super_admin_security BEFORE INSERT OR UPDATE OF role,totp_enabled,totp_secret ON users
 FOR EACH ROW EXECUTE FUNCTION enforce_super_admin_security();

-- Référentiels métier.
CREATE TABLE IF NOT EXISTS specialties (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, name jsonb NOT NULL,
 gender service_gender NOT NULL DEFAULT 'MIXTE', active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS price_guidelines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), category_id uuid REFERENCES categories(id), label text NOT NULL,
 min_price_mad numeric(8,2) NOT NULL, max_price_mad numeric(8,2) NOT NULL,
 typical_min smallint NOT NULL, typical_max smallint NOT NULL,
 CHECK(min_price_mad<=max_price_mad), CHECK(typical_min<=typical_max)
);
ALTER TABLE salons ADD COLUMN IF NOT EXISTS gender salon_gender NOT NULL DEFAULT 'HOMME';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS internal_note text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Casablanca';

CREATE TABLE IF NOT EXISTS salon_photos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
 url text NOT NULL, caption varchar(140), kind text NOT NULL DEFAULT 'LIEU' CHECK(kind IN ('LIEU','VITRINE','EQUIPE')),
 display_order smallint NOT NULL DEFAULT 0, width smallint, height smallint, bytes integer,
 created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE barbers ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS paused_until timestamptz;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS internal_note text;

CREATE TABLE IF NOT EXISTS service_bundles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
 name jsonb NOT NULL, price_mad numeric(8,2) NOT NULL CHECK(price_mad>=0), active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS service_bundle_items (
 bundle_id uuid NOT NULL REFERENCES service_bundles(id) ON DELETE CASCADE,
 service_id uuid NOT NULL REFERENCES services(id), PRIMARY KEY(bundle_id,service_id)
);

-- Jours fériés et choix d'ouverture individuel.
CREATE TABLE IF NOT EXISTS holidays (
 id serial PRIMARY KEY, day date NOT NULL, name jsonb NOT NULL, country char(2) NOT NULL DEFAULT 'MA', UNIQUE(day,country)
);
CREATE TABLE IF NOT EXISTS barber_holidays (
 barber_id uuid REFERENCES barbers(id) ON DELETE CASCADE, holiday_id integer REFERENCES holidays(id),
 closed boolean NOT NULL DEFAULT true, PRIMARY KEY(barber_id,holiday_id)
);

-- Verrou de tunnel : empêche deux clients de finaliser le même créneau pendant 8 minutes.
CREATE TABLE IF NOT EXISTS slot_locks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
 period tstzrange NOT NULL, session_id uuid NOT NULL, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 EXCLUDE USING gist (barber_id WITH =, period WITH &&)
);
CREATE INDEX IF NOT EXISTS slot_locks_expiry_idx ON slot_locks(expires_at);

CREATE TABLE IF NOT EXISTS waitlist (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE, service_ids uuid[] NOT NULL,
 desired_date date, desired_from time, desired_to time, status waitlist_status NOT NULL DEFAULT 'EN_ATTENTE',
 notified_at timestamptz, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS waitlist_barber_queue_idx ON waitlist(barber_id,status,created_at);

CREATE TABLE IF NOT EXISTS queue_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
 barber_id uuid REFERENCES barbers(id), client_id uuid REFERENCES users(id), guest_name text, guest_phone text,
 service_id uuid REFERENCES services(id), position smallint NOT NULL, est_wait_min smallint,
 status queue_status NOT NULL DEFAULT 'EN_FILE', joined_at timestamptz NOT NULL DEFAULT now(),
 called_at timestamptz, served_at timestamptz,
 CHECK(client_id IS NOT NULL OR guest_name IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS queue_salon_position_idx ON queue_entries(salon_id,status,position);

-- Champs de réservation complémentaires.
ALTER TABLE appointments
 ADD COLUMN IF NOT EXISTS is_late_cancel boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
 ADD COLUMN IF NOT EXISTS completed_at timestamptz,
 ADD COLUMN IF NOT EXISTS reschedule_count smallint NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES appointments(id),
 ADD COLUMN IF NOT EXISTS reminder_24h_at timestamptz,
 ADD COLUMN IF NOT EXISTS reminder_2h_at timestamptz,
 ADD COLUMN IF NOT EXISTS review_asked_at timestamptz;

-- Annulation client ≥ H-2, garantie par la base et non par l'interface.
CREATE OR REPLACE FUNCTION enforce_client_cancel_window() RETURNS trigger AS $$
DECLARE window_hours integer;
BEGIN
 IF NEW.status='ANNULE_CLIENT' AND OLD.status<>'ANNULE_CLIENT' THEN
   SELECT COALESCE((value #>> '{}')::integer,2) INTO window_hours FROM settings WHERE key='booking.cancellation_window_hours';
   window_hours:=COALESCE(window_hours,2);
   IF OLD.starts_at-now()<make_interval(hours=>window_hours) THEN
     RAISE EXCEPTION 'Annulation client impossible à moins de % heures',window_hours USING ERRCODE='23514';
   END IF;
   NEW.cancelled_at:=now();
 END IF;
 RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS appointment_cancel_window ON appointments;
CREATE TRIGGER appointment_cancel_window BEFORE UPDATE OF status ON appointments
 FOR EACH ROW EXECUTE FUNCTION enforce_client_cancel_window();

-- Recalcul complet : une transition corrigée par un admin ne fausse jamais les compteurs.
CREATE OR REPLACE FUNCTION recompute_client_reliability() RETURNS trigger AS $$
DECLARE uid uuid;
BEGIN
 IF TG_OP='DELETE' THEN uid:=OLD.client_id; ELSE uid:=NEW.client_id; END IF;
 IF uid IS NULL THEN RETURN NULL; END IF;
 UPDATE users SET
  completed_count=(SELECT count(*) FROM appointments WHERE client_id=uid AND status='TERMINE'),
  no_show_count=(SELECT count(*) FROM appointments WHERE client_id=uid AND status='NO_SHOW'),
  late_cancel_count=(SELECT count(*) FROM appointments WHERE client_id=uid AND status='ANNULE_CLIENT' AND is_late_cancel),
  reliability_score=(SELECT count(*) FILTER(WHERE status='TERMINE') - count(*) FILTER(WHERE status='NO_SHOW')*2 - count(*) FILTER(WHERE status='ANNULE_CLIENT' AND is_late_cancel)*0.5 FROM appointments WHERE client_id=uid)
 WHERE id=uid;
 RETURN NULL;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS appointment_reliability ON appointments;
CREATE TRIGGER appointment_reliability AFTER INSERT OR UPDATE OF status,is_late_cancel OR DELETE ON appointments
 FOR EACH ROW EXECUTE FUNCTION recompute_client_reliability();

-- Avis : rattachement aux services, signalement et éligibilité stricte.
CREATE TABLE IF NOT EXISTS review_services (
 review_id uuid REFERENCES reviews(id) ON DELETE CASCADE, service_id uuid REFERENCES services(id), PRIMARY KEY(review_id,service_id)
);
CREATE TABLE IF NOT EXISTS review_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
 reporter_id uuid REFERENCES users(id), reason text NOT NULL, detail text, resolved_at timestamptz,
 resolution text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION enforce_review_eligibility() RETURNS trigger AS $$
DECLARE appointment_state appointment_status; appointment_end timestamptz;
BEGIN
 SELECT status,ends_at INTO appointment_state,appointment_end FROM appointments WHERE id=NEW.appointment_id;
 IF appointment_state IS DISTINCT FROM 'TERMINE' THEN RAISE EXCEPTION 'Un avis exige un rendez-vous terminé'; END IF;
 IF appointment_end<now()-interval '14 days' THEN RAISE EXCEPTION 'La fenêtre de 14 jours est écoulée'; END IF;
 RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS review_eligibility ON reviews;
CREATE TRIGGER review_eligibility BEFORE INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION enforce_review_eligibility();

-- CRM, favoris et fidélisation.
CREATE TABLE IF NOT EXISTS client_notes (
 barber_id uuid REFERENCES barbers(id) ON DELETE CASCADE, client_id uuid REFERENCES users(id) ON DELETE CASCADE,
 note text, tags text[] NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(barber_id,client_id)
);
CREATE TABLE IF NOT EXISTS favorites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 salon_id uuid REFERENCES salons(id) ON DELETE CASCADE, barber_id uuid REFERENCES barbers(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK((salon_id IS NULL)<>(barber_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS favorite_salon_unique ON favorites(client_id,salon_id) WHERE salon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS favorite_barber_unique ON favorites(client_id,barber_id) WHERE barber_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS salon_blocklist (
 salon_id uuid REFERENCES salons(id) ON DELETE CASCADE, client_id uuid REFERENCES users(id) ON DELETE CASCADE,
 reason text, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(salon_id,client_id)
);
CREATE TABLE IF NOT EXISTS promotions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
 name text NOT NULL, kind text NOT NULL CHECK(kind IN ('PCT','FIXE','HAPPY_HOUR','FIDELITE')),
 value numeric(8,2) NOT NULL, code text, service_ids uuid[] NOT NULL DEFAULT '{}', weekdays smallint[] NOT NULL DEFAULT '{}',
 starts_at time, ends_at time, valid_from date, valid_to date, usage_limit integer, usage_count integer NOT NULL DEFAULT 0,
 requires_admin boolean NOT NULL DEFAULT false, approved_by uuid REFERENCES users(id), active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS loyalty_cards (
 client_id uuid REFERENCES users(id) ON DELETE CASCADE, salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
 stamps smallint NOT NULL DEFAULT 0, goal smallint NOT NULL DEFAULT 10, redeemed smallint NOT NULL DEFAULT 0,
 PRIMARY KEY(client_id,salon_id)
);

-- Notifications et push.
CREATE TABLE IF NOT EXISTS notification_templates (
 id serial PRIMARY KEY, key text NOT NULL, channel notification_channel NOT NULL, locale text NOT NULL,
 subject text, body text NOT NULL, meta_template_id text, active boolean NOT NULL DEFAULT true, UNIQUE(key,channel,locale)
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 endpoint text NOT NULL UNIQUE, p256dh text NOT NULL, auth text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

-- Pilotage, feature flags, modération et sanctions.
CREATE TABLE IF NOT EXISTS feature_flags (
 key text PRIMARY KEY, enabled boolean NOT NULL DEFAULT false, salon_ids uuid[] NOT NULL DEFAULT '{}', description text
);
CREATE TABLE IF NOT EXISTS banned_words (
 id serial PRIMARY KEY, word text NOT NULL, locale text, level smallint NOT NULL DEFAULT 3 CHECK(level BETWEEN 1 AND 5)
);
CREATE TABLE IF NOT EXISTS validation_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN ('SALON','COIFFEUR')),
 salon_id uuid REFERENCES salons(id) ON DELETE CASCADE, barber_id uuid REFERENCES barbers(id) ON DELETE CASCADE,
 submitted_at timestamptz NOT NULL DEFAULT now(), auto_checks jsonb NOT NULL DEFAULT '{}', checklist jsonb NOT NULL DEFAULT '{}',
 decision text CHECK(decision IN ('VALIDE','REFUSE','INFOS')), decided_by uuid REFERENCES users(id), decided_at timestamptz,
 reason text, internal_note text, CHECK((salon_id IS NULL)<>(barber_id IS NULL))
);
CREATE INDEX IF NOT EXISTS validation_pending_idx ON validation_requests(submitted_at) WHERE decision IS NULL;
CREATE TABLE IF NOT EXISTS sanctions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE,
 salon_id uuid REFERENCES salons(id) ON DELETE CASCADE, level sanction_level NOT NULL, reason text NOT NULL,
 starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz, issued_by uuid NOT NULL REFERENCES users(id),
 lifted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit réellement append-only, même en cas de bug applicatif.
CREATE OR REPLACE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- Files de jobs et paramètres ajoutés sans écraser une personnalisation existante.
INSERT INTO settings(key,value,group_name) VALUES
 ('booking.lock_minutes','8','booking'),('booking.max_active_per_client','2','booking'),
 ('reviews.window_days','14','reviews'),('reviews.verified_only','true','reviews'),
 ('notifications.quiet_start','"22:00"','notifications'),('notifications.quiet_end','"08:00"','notifications'),
 ('security.admin_2fa_required','true','security'),('media.strip_exif','true','media')
ON CONFLICT(key) DO NOTHING;

INSERT INTO feature_flags(key,enabled,description) VALUES
 ('file_attente',false,'File walk-in avec QR code'),('liste_attente',true,'Liste sur créneau complet'),
 ('promotions',false,'Réductions et happy hours'),('fidelite',false,'Carte à tampons'),
 ('paiement_en_ligne',false,'Acompte anti-no-show V3'),('mode_ramadan',true,'Horaires alternatifs')
ON CONFLICT(key) DO NOTHING;

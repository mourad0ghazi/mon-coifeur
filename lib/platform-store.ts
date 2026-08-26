import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const dataDir = join(process.cwd(), '.data');
mkdirSync(dataDir, { recursive: true });

const globalDb = globalThis as typeof globalThis & { hlaqtiPlatformDb?: DatabaseSync };
const db =
  globalDb.hlaqtiPlatformDb ??
  (globalDb.hlaqtiPlatformDb = new DatabaseSync(join(dataDir, 'hlaqti.sqlite')));

export { db };

db.exec(`
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS partner_applications (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience TEXT NOT NULL,
  salon_name TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT,
  landmark TEXT,
  specialties TEXT NOT NULL,
  photos_count INTEGER NOT NULL DEFAULT 0,
  consent INTEGER NOT NULL DEFAULT 0,
  legal_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  risk TEXT NOT NULL DEFAULT 'FAIBLE',
  internal_note TEXT,
  checks TEXT NOT NULL DEFAULT '[]',
  user_id TEXT,
  photos TEXT NOT NULL DEFAULT '[]',
  certificate_photo TEXT,
  chair_count INTEGER NOT NULL DEFAULT 1,
  staff TEXT NOT NULL DEFAULT '[]',
  service_catalog TEXT NOT NULL DEFAULT '[]',
  opening_hours TEXT NOT NULL DEFAULT '[]',
  place_id TEXT,
  latitude REAL,
  longitude REAL,
  validated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  barber_id TEXT NOT NULL,
  barber_name TEXT NOT NULL,
  salon_name TEXT NOT NULL,
  salon_neighborhood TEXT NOT NULL,
  client_user_id TEXT,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  date TEXT NOT NULL,
  start_minutes INTEGER NOT NULL,
  end_minutes INTEGER NOT NULL,
  service_id TEXT NOT NULL,
  service_label TEXT NOT NULL,
  price_mad INTEGER NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'CONFIRME',
  channel TEXT NOT NULL DEFAULT 'EN_LIGNE',
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appt_barber_date ON appointments(barber_id, date);
CREATE INDEX IF NOT EXISTS idx_appt_client ON appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appt_user ON appointments(client_user_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id TEXT,
  actor_name TEXT,
  action TEXT NOT NULL,
  target TEXT,
  meta TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS partner_notifications (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_id TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT
);
`);

// Migrations légères pour les dossiers créés avant le formulaire détaillé.
{
  const pcols = new Set((db.prepare("PRAGMA table_info(partner_applications)").all() as any[]).map((c) => c.name));
  const migrations: [string, string][] = [
    ['photos', "TEXT NOT NULL DEFAULT '[]'"],
    ['certificate_photo', 'TEXT'],
    ['chair_count', 'INTEGER NOT NULL DEFAULT 1'],
    ['staff', "TEXT NOT NULL DEFAULT '[]'"],
    ['service_catalog', "TEXT NOT NULL DEFAULT '[]'"],
    ['opening_hours', "TEXT NOT NULL DEFAULT '[]'"],
    ['place_id', 'TEXT'],
    ['latitude', 'REAL'],
    ['longitude', 'REAL'],
    ['validated_at', 'TEXT'],
  ];
  for (const [name, definition] of migrations) {
    if (!pcols.has(name)) db.exec(`ALTER TABLE partner_applications ADD COLUMN ${name} ${definition}`);
  }
}

// ---- Seed partner applications (visible dans /admin/validations) ----
const existing = (db.prepare('SELECT COUNT(*) as c FROM partner_applications').get() as any).c;
if (existing === 0) {
  const seed = db.prepare(`INSERT INTO partner_applications
    (id,reference,first_name,last_name,phone,experience,salon_name,city,neighborhood,address,landmark,specialties,photos_count,consent,legal_consent,status,risk,checks,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const now = new Date().toISOString();
  const checks = JSON.stringify([true, true, true, false, true, true]);
  seed.run(randomUUID(), 'HLQ-P-2401', 'Ayoub', 'Mansouri', '+212612345678', '5-10', 'Salon Nour', 'Casablanca', 'Sidi Bernoussi', 'Rue 34', 'en face pharmacie Al Amal', JSON.stringify(['Dégradé américain', 'Taper fade']), 7, 1, 1, 'EN_ATTENTE', 'FAIBLE', checks, now, now);
  seed.run(randomUUID(), 'HLQ-P-2402', 'Hamza', 'K.', '+212622222222', '1-3', 'Studio HK', 'Casablanca', 'Sidi Moumen', 'Bd Alfadila', 'près du souk', JSON.stringify(['Barbe au rasoir', 'Coupe enfant']), 5, 1, 1, 'EN_ATTENTE', 'MOYEN', JSON.stringify([true, true, false, false, true, false]), now, now);
  seed.run(randomUUID(), 'HLQ-P-2403', 'Othmane', 'Idrissi', '+212633333333', '10+', 'Barber 21', 'Casablanca', 'Aïn Sebaâ', 'Rue 21', 'à côté du café Atlas', JSON.stringify(['Ciseaux uniquement', 'Coloration homme']), 9, 1, 1, 'EN_ATTENTE', 'FAIBLE', checks, now, now);
  seed.run(randomUUID(), 'HLQ-P-2404', 'Reda', 'Amrani', '+212644444444', '5-10', 'Salon Mouad', 'Casablanca', 'Sidi Bernoussi', 'Av Moulay Ismail', 'en face boulangerie', JSON.stringify(['Dégradé américain', 'Taper fade', 'Barbe au rasoir']), 8, 1, 1, 'EN_ATTENTE', 'FAIBLE', checks, now, now);
}

// ---- Seed appointments (compte client démo) ----
const apptCount = (db.prepare('SELECT COUNT(*) as c FROM appointments').get() as any).c;
if (apptCount === 0) {
  const ins = db.prepare(`INSERT INTO appointments
    (id,reference,barber_id,barber_name,salon_name,salon_neighborhood,client_user_id,client_phone,client_name,date,start_minutes,end_minutes,service_id,service_label,price_mad,note,status,channel,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const now = new Date().toISOString();
  const today = new Date();
  const tIso = (offset: number) => { const d = new Date(today); d.setDate(today.getDate() + offset); return d.toISOString().slice(0, 10); };
  ins.run('seed-1', 'HLQ-SEED1', 'karim', 'Karim B.', 'Salon Mouad', 'Sidi Bernoussi', 'client-youssef', '+212612345678', 'Youssef Bennani', tIso(0), 15 * 60, 15 * 60 + 45, 'degrade-americain', 'Dégradé américain', 65, 'Court sur les côtés', 'CONFIRME', 'EN_LIGNE', now, now);
  ins.run('seed-2', 'HLQ-SEED2', 'karim', 'Karim B.', 'Salon Mouad', 'Sidi Bernoussi', 'client-youssef', '+212612345678', 'Youssef Bennani', tIso(-14), 11 * 60, 11 * 60 + 30, 'barbe', 'Taille de barbe', 30, null, 'TERMINE', 'EN_LIGNE', now, now);
  ins.run('seed-3', 'HLQ-SEED3', 'karim', 'Karim B.', 'Salon Mouad', 'Sidi Bernoussi', null, '+212699887700', 'Amine Rami', tIso(1), 10 * 60, 10 * 60 + 40, 'taper-fade', 'Taper fade', 60, 'Garder un peu de longueur', 'CONFIRME', 'EN_LIGNE', now, now);
  ins.run('seed-4', 'HLQ-SEED4', 'karim', 'Karim B.', 'Salon Mouad', 'Sidi Bernoussi', null, '+212655443322', 'Mehdi Khalfi', tIso(2), 16 * 60, 16 * 60 + 25, 'barbe', 'Barbe au rasoir', 35, null, 'CONFIRME', 'EN_LIGNE', now, now);
  ins.run('seed-5', 'HLQ-SEED5', 'karim', 'Karim B.', 'Salon Mouad', 'Sidi Bernoussi', null, '+212677889900', 'Omar El Idrissi', tIso(3), 14 * 60, 14 * 60 + 55, 'coupe-barbe', 'Coupe + barbe', 85, null, 'CONFIRME', 'EN_LIGNE', now, now);
  ins.run('seed-6', 'HLQ-SEED6', 'karim', 'Karim B.', 'Salon Mouad', 'Sidi Bernoussi', null, '+212611223344', 'Soufiane A.', tIso(5), 11 * 60, 11 * 60 + 45, 'degrade-americain', 'Dégradé américain', 65, null, 'CONFIRME', 'EN_LIGNE', now, now);
}

// ---- Seed settings ----
const defs: Record<string, string> = {
  'site.name': 'HLAQTI',
  'site.tagline_fr': 'Réserve ta coupe. Zéro attente.',
  'booking.cancel_window_hours': '2',
  'booking.grid_minutes': '15',
  'booking.buffer_minutes': '5',
  'booking.horizon_days': '30',
  'booking.max_active_per_client': '3',
  'notifications.whatsapp': 'true',
  'notifications.email': 'true',
  'notifications.push': 'false',
  'languages.fr': 'true',
  'languages.ary': 'true',
  'languages.ar': 'true',
  'languages.en': 'true',
  'appearance.theme': 'charbon',
  'moderation.auto_approve': 'false',
  'moderation.banned_words': 'arnaque,faux,gratuit',
  'security.two_fa_admin': 'true',
  'features.walkin': 'true',
  'features.loyalty': 'true',
  'features.waitlist': 'false',
};
const sset = db.prepare('INSERT OR IGNORE INTO settings(key,value,updated_at) VALUES(?,?,?)');
const now = new Date().toISOString();
for (const [k, v] of Object.entries(defs)) sset.run(k, v, now);

// ---------- Partner applications ----------
export type PartnerApplication = {
  id: string;
  reference: string;
  first_name: string;
  last_name: string;
  phone: string;
  experience: string;
  salon_name: string;
  city: string;
  neighborhood: string;
  address: string | null;
  landmark: string | null;
  specialties: string[];
  photos_count: number;
  consent: boolean;
  legal_consent: boolean;
  status: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'INFOS_DEMANDEES';
  risk: 'FAIBLE' | 'MOYEN' | 'ELEVE';
  internal_note: string | null;
  checks: boolean[];
  user_id: string | null;
  photos: string[];
  certificate_photo: string | null;
  chair_count: number;
  staff: { name: string; specialty?: string; hours: string }[];
  service_catalog: { name: string; price: number; duration: number }[];
  opening_hours: { day: string; on: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string }[];
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToApp(row: any): PartnerApplication {
  return {
    ...row,
    consent: !!row.consent,
    legal_consent: !!row.legal_consent,
    specialties: JSON.parse(row.specialties || '[]'),
    checks: JSON.parse(row.checks || '[]'),
    photos: JSON.parse(row.photos || '[]'),
    certificate_photo: row.certificate_photo || null,
    chair_count: Number(row.chair_count || 1),
    staff: JSON.parse(row.staff || '[]'),
    service_catalog: JSON.parse(row.service_catalog || '[]'),
    opening_hours: JSON.parse(row.opening_hours || '[]'),
    place_id: row.place_id || null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    validated_at: row.validated_at || null,
  };
}

export function createPartnerApplication(input: {
  firstName: string;
  lastName: string;
  phone: string;
  experience: string;
  salonName: string;
  city: string;
  neighborhood: string;
  address?: string;
  landmark?: string;
  specialties: string[];
  photos: string[];
  photosCount: number;
  certificatePhoto: string;
  chairCount: number;
  staff: { name: string; specialty?: string; hours: string }[];
  serviceCatalog: { name: string; price: number; duration: number }[];
  openingHours: { day: string; on: boolean; open?: string; close?: string; breakStart?: string; breakEnd?: string }[];
  placeId?: string;
  latitude?: number | null;
  longitude?: number | null;
  consent: boolean;
  legalConsent: boolean;
}): PartnerApplication {
  const id = randomUUID();
  const ref = 'HLQ-P-' + Math.floor(2400 + Math.random() * 7000);
  const ts = new Date().toISOString();
  const risk: PartnerApplication['risk'] =
    input.specialties.length >= 2 && input.photos.length >= 3 && Boolean(input.certificatePhoto) && input.serviceCatalog.length > 0 && input.staff.length > 0 ? 'FAIBLE' : 'MOYEN';
  const coordinatesOk = input.latitude != null && input.longitude != null;
  const checks = [
    Boolean(input.certificatePhoto),
    input.photos.length >= 3,
    true,
    false,
    Boolean(input.address) && coordinatesOk,
    input.serviceCatalog.length > 0 && input.staff.length > 0 && input.openingHours.length > 0,
  ];
  db.prepare(
    `INSERT INTO partner_applications
    (id,reference,first_name,last_name,phone,experience,salon_name,city,neighborhood,address,landmark,specialties,photos_count,consent,legal_consent,status,risk,checks,photos,certificate_photo,chair_count,staff,service_catalog,opening_hours,place_id,latitude,longitude,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id, ref, input.firstName, input.lastName, input.phone, input.experience,
    input.salonName, input.city, input.neighborhood, input.address || null, input.landmark || null,
    JSON.stringify(input.specialties), input.photos.length, input.consent ? 1 : 0, input.legalConsent ? 1 : 0,
    'EN_ATTENTE', risk, JSON.stringify(checks), JSON.stringify(input.photos), input.certificatePhoto,
    input.chairCount, JSON.stringify(input.staff), JSON.stringify(input.serviceCatalog), JSON.stringify(input.openingHours),
    input.placeId || null, input.latitude ?? null, input.longitude ?? null, ts, ts
  );
  return rowToApp(db.prepare('SELECT * FROM partner_applications WHERE id=?').get(id));
}

export function listPartnerApplications(filter?: { status?: string; q?: string }): PartnerApplication[] {
  let sql = 'SELECT * FROM partner_applications WHERE 1=1';
  const args: any[] = [];
  if (filter?.status && filter.status !== 'TOUS') {
    sql += ' AND status=?';
    args.push(filter.status);
  }
  if (filter?.q) {
    sql += ' AND (lower(first_name) LIKE ? OR lower(last_name) LIKE ? OR lower(salon_name) LIKE ? OR lower(phone) LIKE ?)';
    const q = `%${filter.q.toLowerCase()}%`;
    args.push(q, q, q, q);
  }
  sql += ' ORDER BY created_at DESC';
  return (db.prepare(sql).all(...args) as any[]).map(rowToApp);
}

export function getPartnerApplication(id: string): PartnerApplication | null {
  const row = db.prepare('SELECT * FROM partner_applications WHERE id=?').get(id);
  return row ? rowToApp(row) : null;
}

export function getPartnerApplicationByUserId(userId: string): PartnerApplication | null {
  const row = db.prepare('SELECT * FROM partner_applications WHERE user_id=? ORDER BY updated_at DESC LIMIT 1').get(userId);
  return row ? rowToApp(row) : null;
}

export function updatePartnerApplication(
  id: string,
  patch: Partial<Pick<PartnerApplication, 'status' | 'internal_note' | 'checks'>>
): PartnerApplication | null {
  const current = getPartnerApplication(id);
  if (!current) return null;
  const status = patch.status ?? current.status;
  const note = patch.internal_note ?? current.internal_note;
  const checks = patch.checks ?? current.checks;
  const ts = new Date().toISOString();
  const validatedAt = status === 'VALIDE' ? current.validated_at || ts : status === 'EN_ATTENTE' ? null : current.validated_at;
  db.prepare(
    'UPDATE partner_applications SET status=?, internal_note=?, checks=?, validated_at=?, updated_at=? WHERE id=?'
  ).run(status, note, JSON.stringify(checks), validatedAt, ts, id);
  return getPartnerApplication(id);
}

// ---------- Appointments ----------
export type Appointment = {
  id: string;
  reference: string;
  barber_id: string;
  barber_name: string;
  salon_name: string;
  salon_neighborhood: string;
  client_user_id: string | null;
  client_phone: string;
  client_name: string | null;
  date: string;
  start_minutes: number;
  end_minutes: number;
  service_id: string;
  service_label: string;
  price_mad: number;
  note: string | null;
  status: string;
  channel: string;
  idempotency_key: string | null;
  created_at: string;
};

export type AppointmentInput = {
  barberId: string;
  barberName: string;
  salonName: string;
  salonNeighborhood: string;
  clientUserId?: string | null;
  clientPhone: string;
  clientName?: string | null;
  date: string;
  startMinutes: number;
  endMinutes: number;
  serviceId: string;
  serviceLabel: string;
  priceMad: number;
  note?: string | null;
  idempotencyKey?: string | null;
};

function rowToAppt(row: any): Appointment {
  return { ...row, note: row.note ?? null };
}

// Un client peut réserver plusieurs créneaux à des heures différentes (par
// exemple pour deux enfants), mais pas deux salons au même moment. Cette règle
// évite les doubles réservations accidentelles et protège les coiffeurs.
export function findClientTimeConflict(input: AppointmentInput): Appointment | null {
  const buffer = 5;
  const query = input.clientUserId
    ? `SELECT * FROM appointments
       WHERE date=? AND status IN ('CONFIRME','EN_ATTENTE','EN_COURS')
       AND (client_user_id=? OR client_phone=?)
       AND NOT (end_minutes + ? <= ? OR start_minutes - ? >= ?)
       ORDER BY start_minutes LIMIT 1`
    : `SELECT * FROM appointments
       WHERE date=? AND status IN ('CONFIRME','EN_ATTENTE','EN_COURS')
       AND client_phone=?
       AND NOT (end_minutes + ? <= ? OR start_minutes - ? >= ?)
       ORDER BY start_minutes LIMIT 1`;
  const row = input.clientUserId
    ? db.prepare(query).get(input.date, input.clientUserId, input.clientPhone, buffer, input.startMinutes, buffer, input.endMinutes)
    : db.prepare(query).get(input.date, input.clientPhone, buffer, input.startMinutes, buffer, input.endMinutes);
  return row ? rowToAppt(row) : null;
}

export function createAppointment(input: AppointmentInput): { appointment: Appointment; conflict: boolean; replay: boolean; clientConflict?: Appointment | null } {
  if (input.idempotencyKey) {
    const existing = db.prepare('SELECT * FROM appointments WHERE idempotency_key=?').get(input.idempotencyKey);
    if (existing) return { appointment: rowToAppt(existing), conflict: false, replay: true };
  }
  const clientConflict = findClientTimeConflict(input);
  if (clientConflict) return { appointment: null as any, conflict: false, replay: false, clientConflict };
  // conflict detection — mirror the 5-minute buffer used when generating slots
  const buffer = 5;
  const clash = db.prepare(
    `SELECT id FROM appointments WHERE barber_id=? AND date=? AND status IN ('CONFIRME','EN_ATTENTE','EN_COURS')
     AND NOT (end_minutes + ? <= ? OR start_minutes - ? >= ?)`
  ).get(input.barberId, input.date, buffer, input.startMinutes, buffer, input.endMinutes);
  if (clash) return { appointment: null as any, conflict: true, replay: false };

  const id = randomUUID();
  const reference =
    'HLQ-' +
    Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  const ts = new Date().toISOString();
  db.prepare(
    `INSERT INTO appointments
    (id,reference,barber_id,barber_name,salon_name,salon_neighborhood,client_user_id,client_phone,client_name,date,start_minutes,end_minutes,service_id,service_label,price_mad,note,status,channel,idempotency_key,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id, reference, input.barberId, input.barberName, input.salonName, input.salonNeighborhood,
    input.clientUserId || null, input.clientPhone, input.clientName || null, input.date,
    input.startMinutes, input.endMinutes, input.serviceId, input.serviceLabel, input.priceMad,
    input.note || null, 'CONFIRME', 'EN_LIGNE', input.idempotencyKey || null, ts, ts
  );
  return { appointment: rowToAppt(db.prepare('SELECT * FROM appointments WHERE id=?').get(id)), conflict: false, replay: false };
}

export function listBookedSlots(barberId: string, date: string): { start: number; end: number }[] {
  return (db.prepare(
    `SELECT start_minutes as start, end_minutes as end FROM appointments
     WHERE barber_id=? AND date=? AND status IN ('CONFIRME','EN_ATTENTE','EN_COURS')`
  ).all(barberId, date) as any[]);
}

export function listAppointmentsByClient(identifier: { userId?: string; phone?: string }): Appointment[] {
  if (identifier.userId) {
    return (db.prepare('SELECT * FROM appointments WHERE client_user_id=? ORDER BY date DESC, start_minutes DESC').all(identifier.userId) as any[]).map(rowToAppt);
  }
  if (identifier.phone) {
    return (db.prepare('SELECT * FROM appointments WHERE client_phone=? ORDER BY date DESC, start_minutes DESC').all(identifier.phone) as any[]).map(rowToAppt);
  }
  return [];
}

export function listAppointmentsByBarber(barberId: string, date?: string): Appointment[] {
  if (date) {
    return (db.prepare('SELECT * FROM appointments WHERE barber_id=? AND date=? ORDER BY start_minutes').all(barberId, date) as any[]).map(rowToAppt);
  }
  return (db.prepare('SELECT * FROM appointments WHERE barber_id=? ORDER BY date DESC, start_minutes DESC').all(barberId) as any[]).map(rowToAppt);
}

export function listAppointmentsForCoiffeur(userId: string, date?: string): Appointment[] {
  const ids = resolveBarberIds(userId);
  const placeholders = ids.map(() => '?').join(',');
  if (date) {
    return (db.prepare(`SELECT * FROM appointments WHERE barber_id IN (${placeholders}) AND date=? ORDER BY start_minutes`).all(...ids, date) as any[]).map(rowToAppt);
  }
  return (db.prepare(`SELECT * FROM appointments WHERE barber_id IN (${placeholders}) ORDER BY date DESC, start_minutes DESC`).all(...ids) as any[]).map(rowToAppt);
}

export function setAppointmentStatus(id: string, status: string): Appointment | null {
  db.prepare('UPDATE appointments SET status=?, updated_at=? WHERE id=?').run(status, new Date().toISOString(), id);
  const row = db.prepare('SELECT * FROM appointments WHERE id=?').get(id);
  return row ? rowToAppt(row) : null;
}

export function proStats(userId: string) {
  const ids = resolveBarberIds(userId);
  const placeholders = ids.map(() => '?').join(',');
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = db.prepare(
    `SELECT COUNT(*) c, COALESCE(SUM(price_mad),0) s FROM appointments WHERE barber_id IN (${placeholders}) AND date=? AND status IN ('CONFIRME','EN_COURS','TERMINE')`
  ).get(...ids, today) as any;
  const weekRevenue = db.prepare(
    `SELECT COALESCE(SUM(price_mad),0) s FROM appointments WHERE barber_id IN (${placeholders}) AND status IN ('CONFIRME','TERMINE') AND date >= date('now','-6 days')`
  ).get(...ids) as any;
  const upcoming = db.prepare(
    `SELECT COUNT(*) c FROM appointments WHERE barber_id IN (${placeholders}) AND status='CONFIRME' AND date>=?`
  ).get(...ids, today) as any;
  return {
    todayAppointments: todayRow?.c ?? 0,
    todayRevenue: todayRow?.s ?? 0,
    weekRevenue: weekRevenue?.s ?? 0,
    upcoming: upcoming?.c ?? 0,
  };
}

// Resolve which barber_id a connected coiffeur owns.
// The seed account barber-karim maps to the public slug "karim";
// every newly approved coiffeur uses their auth user id as barber_id.
export function resolveBarberIds(userId: string): string[] {
  if (userId === 'barber-karim') return ['karim', userId];
  return [userId];
}

export function cancelAppointment(id: string, by: 'CLIENT' | 'COIFFEUR'): { ok: boolean; error?: string; appointment?: Appointment } {
  const row = db.prepare('SELECT * FROM appointments WHERE id=?').get(id) as any;
  if (!row) return { ok: false, error: 'INTROUVABLE' };
  const appt = rowToAppt(row);
  if (['ANNULE_CLIENT', 'ANNULE_COIFFEUR', 'TERMINE', 'NO_SHOW'].includes(appt.status)) {
    return { ok: false, error: 'DEJA_TERMINE' };
  }
  if (by === 'CLIENT') {
    // H-2 rule
    const windowH = parseInt(getSetting('booking.cancel_window_hours') ?? '2', 10);
    const start = new Date(`${appt.date}T00:00:00`);
    start.setMinutes(appt.start_minutes);
    const hours = (start.getTime() - Date.now()) / 3_600_000;
    if (hours < windowH) return { ok: false, error: 'TROP_TARD' };
  }
  const status = by === 'CLIENT' ? 'ANNULE_CLIENT' : 'ANNULE_COIFFEUR';
  db.prepare('UPDATE appointments SET status=?, updated_at=? WHERE id=?').run(status, new Date().toISOString(), id);
  return { ok: true, appointment: rowToAppt(db.prepare('SELECT * FROM appointments WHERE id=?').get(id)) };
}

// ---------- Settings ----------
export function getAllSettings(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of db.prepare('SELECT key,value FROM settings').all() as any[]) out[r.key] = r.value;
  return out;
}
export function getSetting(key: string): string | null {
  const r = db.prepare('SELECT value FROM settings WHERE key=?').get(key) as any;
  return r?.value ?? null;
}
export function updateSettings(patch: Record<string, string>) {
  const ts = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO settings(key,value,updated_at) VALUES(?,?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`);
  for (const [k, v] of Object.entries(patch)) stmt.run(k, String(v), ts);
  return getAllSettings();
}

// ---------- Audit ----------
export function writeAudit(input: { actorId?: string; actorName?: string; action: string; target?: string; meta?: any }) {
  db.prepare(
    'INSERT INTO audit_log(actor_id,actor_name,action,target,meta,created_at) VALUES(?,?,?,?,?,?)'
  ).run(
    input.actorId || null,
    input.actorName || null,
    input.action,
    input.target || null,
    input.meta ? JSON.stringify(input.meta) : null,
    new Date().toISOString()
  );
}
export function listAudit(limit = 50) {
  return (db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?').all(limit) as any[]).map((r) => ({
    ...r,
    meta: r.meta ? JSON.parse(r.meta) : null,
  }));
}

export function recordPartnerNotification(input: {
  applicationId: string;
  phone: string;
  type: string;
  message: string;
  status: string;
  providerId?: string | null;
  sentAt?: string | null;
}) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO partner_notifications(id,application_id,phone,type,message,status,provider_id,created_at,sent_at)
     VALUES(?,?,?,?,?,?,?,?,?)`
  ).run(id, input.applicationId, input.phone, input.type, input.message, input.status, input.providerId || null, new Date().toISOString(), input.sentAt || null);
  return { id, status: input.status, providerId: input.providerId || null };
}

export function platformStats() {
  const users = (db.prepare("SELECT COUNT(*) c FROM auth_users").get() as any)?.c ?? 0;
  const partners = (db.prepare("SELECT COUNT(*) c FROM auth_users WHERE role='COIFFEUR'").get() as any)?.c ?? 0;
  const pending = (db.prepare("SELECT COUNT(*) c FROM partner_applications WHERE status='EN_ATTENTE'").get() as any)?.c ?? 0;
  const appts = (db.prepare("SELECT COUNT(*) c FROM appointments").get() as any)?.c ?? 0;
  const upcoming = (db.prepare("SELECT COUNT(*) c FROM appointments WHERE status='CONFIRME' AND date>=date('now')").get() as any)?.c ?? 0;
  const revenue = (db.prepare("SELECT COALESCE(SUM(price_mad),0) s FROM appointments WHERE status IN ('CONFIRME','TERMINE')").get() as any)?.s ?? 0;
  return { users, partners, pending, appts, upcoming, revenue };
}

'use client';
import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import {
  Bell, CalendarDays, Check, ChevronRight, Database, Flag, Globe2,
  KeyRound, Languages, Palette, Save, Search, ShieldCheck, Store, Webhook,
} from 'lucide-react';

const groups = [
  ['Général', Store], ['Réservation', CalendarDays], ['Notifications', Bell], ['Langues', Languages],
  ['Apparence', Palette], ['Modération', ShieldCheck], ['Intégrations', Webhook],
  ['Fonctionnalités', Flag], ['Sécurité', KeyRound], ['Système', Database],
] as const;

type Settings = Record<string, string>;

export default function AdminSettings() {
  const [group, setGroup] = useState('Général');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/v1/admin/settings').then((r) => r.json()).then((j) => {
      setSettings(j.data?.settings || {});
      setLoaded(true);
    });
  }, []);

  function get(key: string, fallback = '') { return settings[key] ?? fallback; }
  function set(key: string, value: string | boolean | number) {
    setSettings((s) => ({ ...s, [key]: String(value) }));
  }

  async function save() {
    setSaving(true);
    const res = await fetch('/api/v1/admin/settings', {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) {
      const j = await res.json();
      setSettings(j.data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    }
  }

  return (
    <DashboardShell type="admin" title="Paramètres plateforme" subtitle="Contrôle central de HLAQTI — modifications journalisées">
      <div className="dash-content platform-settings">
        <header>
          <label><Search /><input placeholder="Rechercher parmi les paramètres…" /></label>
          <div>
            <span><i /> Production</span>
            <button onClick={save} disabled={saving || !loaded}>
              {saved ? <Check /> : <Save />} {saved ? 'Enregistré' : saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>
        </header>
        <div className="settings-layout">
          <aside>
            {groups.map(([x, Icon]) => (
              <button className={group === x ? 'active' : ''} onClick={() => setGroup(x)} key={x}>
                <Icon />{x}<ChevronRight />
              </button>
            ))}
          </aside>
          <main>
            <section className="settings-section">
              <div className="settings-title">
                <div>
                  <span className="dash-kicker">{group.toUpperCase()}</span>
                  <h2>{group === 'Général' ? 'Identité de la plateforme' : group === 'Réservation' ? 'Règles de réservation' : group === 'Fonctionnalités' ? 'Fonctionnalités expérimentales' : `Paramètres · ${group}`}</h2>
                  <p>Les changements s’appliquent à toute la plateforme, sauf surcharge autorisée par salon.</p>
                </div>
                <em><ShieldCheck /> Journal d’audit actif</em>
              </div>

              {group === 'Général' && (
                <div className="setting-fields">
                  <div className="field-row">
                    <label>Nom de la plateforme<input value={get('site.name', 'HLAQTI')} onChange={(e) => set('site.name', e.target.value)} /></label>
                    <label>Fuseau horaire<select defaultValue="Africa/Casablanca"><option>Africa/Casablanca</option></select></label>
                  </div>
                  <label>Slogan français<input value={get('site.tagline_fr', 'Réserve ta coupe. Zéro attente.')} onChange={(e) => set('site.tagline_fr', e.target.value)} /></label>
                  <label>Devise<select defaultValue="MAD"><option>MAD — Dirham marocain</option></select></label>
                </div>
              )}

              {group === 'Réservation' && (
                <div className="setting-list">
                  <Toggle label="Confirmation automatique" text="Les réservations valides sont confirmées sans intervention." value={get('booking.auto_confirm', 'true') === 'true'} onChange={(v) => set('booking.auto_confirm', v)} />
                  <NumberField label="Fenêtre d’annulation client" text="Délai minimum avant le rendez-vous." value={get('booking.cancel_window_hours', '2')} unit="heures" onChange={(v) => set('booking.cancel_window_hours', v)} />
                  <NumberField label="Pas de la grille" text="5, 10, 15, 20 ou 30 minutes." value={get('booking.grid_minutes', '15')} unit="min" onChange={(v) => set('booking.grid_minutes', v)} />
                  <NumberField label="Buffer entre rendez-vous" text="Temps de préparation entre clients." value={get('booking.buffer_minutes', '5')} unit="min" onChange={(v) => set('booking.buffer_minutes', v)} />
                  <NumberField label="Horizon de réservation" text="Nombre maximum de jours visibles." value={get('booking.horizon_days', '30')} unit="jours" onChange={(v) => set('booking.horizon_days', v)} />
                  <NumberField label="RDV actifs par client" text="Protection contre les réservations abusives." value={get('booking.max_active_per_client', '3')} unit="RDV" onChange={(v) => set('booking.max_active_per_client', v)} />
                </div>
              )}

              {group === 'Notifications' && (
                <div className="setting-list">
                  <Toggle label="WhatsApp" text="Confirmations et rappels automatiques." value={get('notifications.whatsapp', 'true') === 'true'} onChange={(v) => set('notifications.whatsapp', v)} />
                  <Toggle label="Email" text="Notifications par email." value={get('notifications.email', 'true') === 'true'} onChange={(v) => set('notifications.email', v)} />
                  <Toggle label="Push (PWA)" text="Notifications sur l’app installée." value={get('notifications.push', 'false') === 'true'} onChange={(v) => set('notifications.push', v)} />
                </div>
              )}

              {group === 'Langues' && (
                <div className="setting-list">
                  <Toggle label="Français" text="Activé sur le site public." value={get('languages.fr', 'true') === 'true'} onChange={(v) => set('languages.fr', v)} />
                  <Toggle label="Darija" text="الدارجة · langue principale." value={get('languages.ary', 'true') === 'true'} onChange={(v) => set('languages.ary', v)} />
                  <Toggle label="Arabe" text="العربية." value={get('languages.ar', 'true') === 'true'} onChange={(v) => set('languages.ar', v)} />
                  <Toggle label="Anglais" text="English." value={get('languages.en', 'true') === 'true'} onChange={(v) => set('languages.en', v)} />
                </div>
              )}

              {group === 'Apparence' && (
                <div className="setting-fields">
                  <label>Thème
                    <select value={get('appearance.theme', 'charbon')} onChange={(e) => set('appearance.theme', e.target.value)}>
                      <option value="charbon">Charbon (barbier sombre)</option>
                      <option value="laiton">Laiton</option>
                    </select>
                  </label>
                </div>
              )}

              {group === 'Modération' && (
                <div className="setting-list">
                  <Toggle label="Validation auto des partenaires" text="DANGER : contourne la revue manuelle." value={get('moderation.auto_approve', 'false') === 'true'} onChange={(v) => set('moderation.auto_approve', v)} />
                  <label className="text-setting">Mots bloqués<textarea value={get('moderation.banned_words', '')} onChange={(e) => set('moderation.banned_words', e.target.value)} /></label>
                </div>
              )}

              {group === 'Sécurité' && (
                <div className="setting-list">
                  <Toggle label="2FA obligatoire pour l’admin" text="Le super-admin Mourad Ghazi doit utiliser un second facteur." value={get('security.two_fa_admin', 'true') === 'true'} onChange={(v) => set('security.two_fa_admin', v)} />
                </div>
              )}

              {group === 'Fonctionnalités' && (
                <div className="setting-list">
                  <Toggle label="File d’attente walk-in" text="QR code et temps d’attente public en temps réel." value={get('features.walkin', 'true') === 'true'} onChange={(v) => set('features.walkin', v)} />
                  <Toggle label="Liste d’attente" text="Notifier les clients lorsqu’un créneau se libère." value={get('features.waitlist', 'false') === 'true'} onChange={(v) => set('features.waitlist', v)} />
                  <Toggle label="Programme fidélité" text="Timbre coupe offerte au bout de 10." value={get('features.loyalty', 'true') === 'true'} onChange={(v) => set('features.loyalty', v)} />
                </div>
              )}

              {!['Général', 'Réservation', 'Notifications', 'Langues', 'Apparence', 'Modération', 'Sécurité', 'Fonctionnalités'].includes(group) && (
                <div className="setting-list">
                  <Toggle label={`${group} activé`} text={`Active les fonctions principales du module ${group.toLowerCase()}.`} value={true} onChange={() => {}} />
                  <p className="muted">Module {group} — configuration détaillée à venir.</p>
                </div>
              )}
            </section>
            <aside className="settings-help">
              <h3>Impact des modifications</h3>
              <p>Les paramètres sont enregistrés en base et appliqués immédiatement à l’ensemble du site.</p>
              <div><i /> Aucun conflit détecté</div>
              <div><ShieldCheck /> Sauvegarde journalisée dans l’audit</div>
            </aside>
          </main>
        </div>
      </div>
    </DashboardShell>
  );
}

function Toggle({ label, text, value, onChange }: { label: string; text: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <article>
      <div><b>{label}</b><p>{text}</p></div>
      <button className={'switch ' + (value ? 'on' : '')} onClick={() => onChange(!value)}><i /></button>
    </article>
  );
}

function NumberField({ label, text, value, unit, onChange }: { label: string; text: string; value: string; unit: string; onChange: (v: string) => void }) {
  return (
    <article>
      <div><b>{label}</b><p>{text}</p></div>
      <label className="number-setting"><input value={value} onChange={(e) => onChange(e.target.value)} type="number" /><span>{unit}</span></label>
    </article>
  );
}

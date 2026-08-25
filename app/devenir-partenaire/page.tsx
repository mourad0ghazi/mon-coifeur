'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, ArrowRight, CalendarCheck, Camera, Check, CheckCircle2, Clock3,
  Loader2, MapPin, MessageCircle, Phone, Scissors, ShieldCheck, Store,
  Upload, UserRound, X,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

const specialties = ['Dégradé américain', 'Taper fade', 'Barbe au rasoir', 'Coupe enfant', 'Ciseaux uniquement', 'Coloration homme'];

type Photo = { url: string; name: string; uploading?: boolean };

const empty = {
  firstName: 'Ayoub', lastName: 'Mansouri', phone: '', experience: '5-10',
  salonName: 'Salon Nour', city: 'Casablanca', neighborhood: 'Sidi Bernoussi',
  address: '', landmark: '', consent: true, legalConsent: true,
};

export default function Partner() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(['Dégradé américain', 'Taper fade']);
  const [form, setForm] = useState(empty);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reference: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (s: string) => setSelected((v) => (v.includes(s) ? v.filter((x) => x !== s) : [...v, s]));
  const phoneValid = /^(\+212|0)[5-7]\d{8}$/.test(form.phone.replace(/\s/g, ''));

  function onAddressPlace(p: { label: string; secondary?: string }) {
    set('address', p.label);
    // Google secondary ressemble à « Sidi Bernoussi, Casablanca, Maroc »
    const parts = (p.secondary || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (parts.length >= 2) {
      set('city', parts[parts.length - 2] || form.city);
      set('neighborhood', parts[0] || form.neighborhood);
    }
  }

  async function onFiles(list: FileList | null) {
    if (!list || !list.length) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      Array.from(list).forEach((f) => fd.append('files', f));
      const res = await fetch('/api/v1/uploads', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || json?.error || 'Upload impossible');
      const saved: Photo[] = json.data.files.map((f: any) => ({ url: f.url, name: f.name }));
      setPhotos((p) => [...p, ...saved]);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de l’upload.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setError(null);
    if (!phoneValid) { setError('Numéro WhatsApp invalide (ex. 0612345678).'); return; }
    if (selected.length === 0) { setError('Sélectionne au moins une spécialité.'); return; }
    if (photos.length < 3) { setError('Ajoute au moins 3 photos de tes réalisations.'); return; }
    if (!form.consent || !form.legalConsent) { setError('Tu dois accepter les consentements.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/partner/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, specialties: selected, photos: photos.map((p) => p.url) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur lors de l’envoi.');
      setResult({ reference: json.data.application.reference });
    } catch (e: any) {
      setError(e?.message || 'Erreur réseau. Réessaie.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="partner-signup success-partner">
        <div className="partner-top"><Logo /></div>
        <section>
          <CheckCircle2 />
          <span className="section-kicker">DEMANDE ENVOYÉE</span>
          <h1>On vérifie ton dossier.</h1>
          <p>Merci ! Mourad et l’équipe HLAQTI vont examiner tes informations et tes {photos.length} photos. Tu recevras la décision sur WhatsApp sous 24 à 48 heures.</p>
          <div><b>{result.reference}</b><small>RÉFÉRENCE DE TA DEMANDE</small></div>
          <Link href="/">Retour à l’accueil</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="partner-signup">
      <header className="partner-top">
        <Logo />
        <div><span>Déjà partenaire ?</span><Link href="/pro">Se connecter</Link></div>
      </header>
      <div className="partner-layout">
        <aside>
          <span className="section-kicker">REJOINS HLAQTI</span>
          <h1>Moins d’appels.<br /><em>Plus de coupes.</em></h1>
          <p>Crée ton profil gratuitement et commence à remplir ton agenda avec les clients de ton quartier.</p>
          <div className="partner-benefits">
            <p><CalendarCheck /><span><b>Ton agenda, toujours à jour</b><small>Les clients réservent pendant que tu travailles.</small></span></p>
            <p><MessageCircle /><span><b>Confirmations sur WhatsApp</b><small>Tu ne rates aucun nouveau rendez-vous.</small></span></p>
            <p><ShieldCheck /><span><b>Profil artisan vérifié</b><small>Montre ton vrai travail et inspire confiance.</small></span></p>
          </div>
          <blockquote>« En une semaine, mes clients ont compris. Maintenant ils réservent sans m’appeler. »<small>— Mouad, salon pilote · Sidi Bernoussi</small></blockquote>
        </aside>

        <section className="partner-form">
          <div className="partner-progress">
            <div><span>ÉTAPE {step} SUR 4</span><b>{['Ton activité', 'Ton salon', 'Ton travail', 'Vérification'][step - 1]}</b></div>
            <div>{[1, 2, 3, 4].map((i) => <i className={i <= step ? 'active' : ''} key={i} />)}</div>
          </div>

          {error && <div className="form-error" style={{ color: '#C0503C', background: 'rgba(192,80,60,.1)', padding: 12, borderRadius: 10, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}><X size={16} /> {error}</div>}

          {step === 1 && (
            <div className="onboard-step">
              <span className="form-icon"><UserRound /></span>
              <h2>Parle-nous de toi.</h2>
              <p>Ces informations serviront à créer ton profil public.</p>
              <div className="field-row">
                <label>Prénom<input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></label>
                <label>Nom<input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></label>
              </div>
              <label>Numéro WhatsApp
                <div className="wa-input">
                  <b>🇲🇦 +212</b>
                  <input placeholder="6 12 34 56 78" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
                <small>{phoneValid ? <><Check /> Numéro valide.</> : 'Saisis ton numéro (06, 05 ou 07).'}</small>
              </label>
              <label>Années d’expérience
                <select value={form.experience} onChange={(e) => set('experience', e.target.value)}>
                  <option value="1-3">1 à 3 ans</option>
                  <option value="5-10">5 à 10 ans</option>
                  <option value="10+">Plus de 10 ans</option>
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="onboard-step">
              <span className="form-icon"><Store /></span>
              <h2>Ton lieu de travail.</h2>
              <p>Choisis l’adresse de ton salon dans Google Maps, les champs se remplissent automatiquement.</p>
              <label>Nom du salon<input value={form.salonName} onChange={(e) => set('salonName', e.target.value)} /></label>

              <label>Adresse du salon (Google Maps)
                <LocationAutocomplete
                  mode="address"
                  value={form.address}
                  onChange={(v) => set('address', v)}
                  onPlace={onAddressPlace}
                  placeholder="Tape le nom ou l’adresse de ton salon…"
                  withGeolocation
                />
                <small><MapPin /> Recherche basée sur Google Maps · Maroc uniquement.</small>
              </label>

              <div className="field-row">
                <label>Ville<input value={form.city} onChange={(e) => set('city', e.target.value)} /></label>
                <label>Quartier<input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} /></label>
              </div>
              <label>Repère à proximité<input placeholder="Ex. en face de la pharmacie Al Amal" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} />
                <small><MapPin /> Très utile pour aider tes clients à te trouver.</small>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="onboard-step">
              <span className="form-icon"><Scissors /></span>
              <h2>Montre-nous ton savoir-faire.</h2>
              <p>Choisis tes spécialités et ajoute autant de vraies réalisations que tu veux (3 minimum).</p>
              <label>Mes spécialités
                <div className="specialty-select">
                  {specialties.map((s) => (
                    <button type="button" className={selected.includes(s) ? 'active' : ''} onClick={() => toggle(s)} key={s}>
                      {selected.includes(s) && <Check />}{s}
                    </button>
                  ))}
                </div>
              </label>

              <label>Photos de tes coupes
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => onFiles(e.target.files)}
                />
                <div className={'real-upload' + (uploading ? ' uploading' : '')}>
                  <button type="button" className="upload-cta" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <><Loader2 className="spin" /> Envoi…</> : <><Upload /><b>Ajouter des photos</b><small>Clique ou prends une photo · JPG, PNG, WebP · 6 Mo max</small></>}
                  </button>
                  <div className="photo-thumbs">
                    {photos.map((p, i) => (
                      <div className="photo-thumb" key={p.url + i}>
                        <Image src={p.url} alt={p.name} fill sizes="120px" />
                        <span className="check-badge"><Check size={13} /></span>
                        <button type="button" className="remove-photo" onClick={() => removePhoto(i)} aria-label="Supprimer"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <small><Camera /> {photos.length} photo(s) · minimum 3, pas de limite maximale. Photos personnelles, sans filtre excessif.</small>
              </label>

              <label className="consent">
                <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} /> Je confirme avoir l’autorisation des personnes photographiées.
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="onboard-step">
              <span className="form-icon"><ShieldCheck /></span>
              <h2>Dernière vérification.</h2>
              <p>Ton compte restera privé jusqu’à sa validation manuelle.</p>
              <div className="application-summary">
                <div><span>{(form.firstName[0] || '') + (form.lastName[0] || '')}</span>
                  <p><b>{form.firstName} {form.lastName}</b><small>{form.experience} d’expérience · {selected.length} spécialités</small></p>
                  <button onClick={() => setStep(1)}>Modifier</button>
                </div>
                <p><Store /><span><b>{form.salonName}</b><small>{form.address || form.neighborhood}, {form.city}</small></span><button onClick={() => setStep(2)}>Modifier</button></p>
                <p><Camera /><span><b>{photos.length} réalisation(s)</b><small>Consentement {form.consent ? 'confirmé' : 'requis'}</small></span><button onClick={() => setStep(3)}>Modifier</button></p>
                <p><Phone /><span><b>+212 {form.phone}</b><small>WhatsApp à vérifier</small></span></p>
              </div>
              <label className="consent legal">
                <input type="checkbox" checked={form.legalConsent} onChange={(e) => set('legalConsent', e.target.checked)} /> J’accepte les conditions partenaires et la politique de confidentialité HLAQTI.
              </label>
              <div className="validation-info"><Clock3 /><span><b>Validation sous 24 à 48 h</b><small>Chaque profil est vérifié manuellement pour garantir la qualité de la plateforme.</small></span></div>
            </div>
          )}

          <footer className="onboard-actions">
            {step > 1 && <button className="prev" onClick={() => setStep(step - 1)}><ArrowLeft /> Retour</button>}
            <button
              className="next"
              disabled={submitting || uploading}
              onClick={() => (step < 4 ? setStep(step + 1) : submit())}
            >
              {submitting ? 'Envoi…' : uploading ? 'Upload en cours…' : step === 4 ? 'Envoyer ma demande' : 'Continuer'} {step === 4 ? <Check /> : <ArrowRight />}
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

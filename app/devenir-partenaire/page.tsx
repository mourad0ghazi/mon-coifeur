'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, ArrowRight, CalendarCheck, Camera, Check, CheckCircle2, Clock3,
  Loader2, MapPin, MessageCircle, Minus, Phone, Plus, Scissors, ShieldCheck,
  Store, Trash2, Upload, UserRound, X,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

type Photo = { url: string; name: string };
type StaffMember = { name: string; specialty: string; hours: string };
type ServiceRow = { name: string; duration: number; price: number };
type OpeningDay = { day: string; on: boolean; open: string; close: string; breakStart: string; breakEnd: string };

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  experience: string;
  salonName: string;
  city: string;
  neighborhood: string;
  address: string;
  landmark: string;
  consent: boolean;
  legalConsent: boolean;
};

const SPECIALTIES = ['Dégradé américain', 'Taper fade', 'Barbe au rasoir', 'Coupe enfant', 'Ciseaux uniquement', 'Coloration homme', 'Brushing'];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DEFAULT_HOURS: OpeningDay[] = DAYS.map((day, index) => ({
  day,
  on: index < 6,
  open: index === 5 ? '10:00' : '09:00',
  close: index === 5 ? '22:00' : '21:00',
  breakStart: '13:00',
  breakEnd: '14:00',
}));

const EMPTY_FORM: FormState = {
  firstName: '', lastName: '', phone: '', experience: '5-10', salonName: '', city: 'Casablanca',
  neighborhood: '', address: '', landmark: '', consent: false, legalConsent: false,
};

function normalizePhoneInput(value: string) {
  return value.replace(/\s/g, '');
}

export default function Partner() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(['Dégradé américain', 'Taper fade']);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [chairCount, setChairCountValue] = useState(1);
  const [staff, setStaff] = useState<StaffMember[]>([{ name: '', specialty: '', hours: '09:00–21:00' }]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceRow[]>([
    { name: 'Coupe homme', duration: 30, price: 40 },
    { name: 'Dégradé américain', duration: 40, price: 60 },
    { name: 'Taille de barbe', duration: 25, price: 30 },
  ]);
  const [openingHours, setOpeningHours] = useState<OpeningDay[]>(DEFAULT_HOURS);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [certificatePhoto, setCertificatePhoto] = useState<Photo | null>(null);
  const [place, setPlace] = useState<{ placeId?: string; lat?: number; lng?: number }>({});
  const [uploading, setUploading] = useState(false);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reference: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toggleSpecialty = (specialty: string) => setSelected((current) => current.includes(specialty) ? current.filter((item) => item !== specialty) : [...current, specialty]);
  const phoneValid = /^(\+212|0)[5-7]\d{8}$/.test(normalizePhoneInput(form.phone));

  function onAddressPlace(value: { label: string; secondary?: string; lat?: number; lng?: number; placeId?: string }) {
    set('address', value.label);
    setPlace({ placeId: value.placeId, lat: value.lat, lng: value.lng });
    const parts = (value.secondary || '').split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      set('city', parts[parts.length - 2] || form.city);
      set('neighborhood', parts[0] || form.neighborhood);
    }
  }

  async function uploadFiles(list: FileList | null) {
    if (!list?.length) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      Array.from(list).forEach((file) => body.append('files', file));
      const response = await fetch('/api/v1/uploads', { method: 'POST', body });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || json?.error || 'Upload impossible.');
      const saved: Photo[] = (json.data?.files || []).map((file: { url: string; name: string }) => ({ url: file.url, name: file.name }));
      setPhotos((current) => [...current, ...saved]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Erreur lors de l’upload.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function uploadCertificate(file: File | undefined) {
    if (!file) return;
    setCertificateUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('files', file);
      const response = await fetch('/api/v1/uploads', { method: 'POST', body });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || json?.error || 'Upload impossible.');
      const uploaded = json.data?.files?.[0];
      if (uploaded) setCertificatePhoto({ url: uploaded.url, name: uploaded.name });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Erreur lors de l’upload du certificat.');
    } finally {
      setCertificateUploading(false);
      if (certificateRef.current) certificateRef.current.value = '';
    }
  }

  function setChairCount(nextValue: number) {
    const next = Math.max(1, Math.min(50, nextValue || 1));
    setChairCountValue(next);
    setStaff((current) => Array.from({ length: next }, (_, index) => current[index] || { name: '', specialty: '', hours: '09:00–21:00' }));
  }

  function updateStaff(index: number, key: keyof StaffMember, value: string) {
    setStaff((current) => current.map((member, memberIndex) => memberIndex === index ? { ...member, [key]: value } : member));
  }

  function updateService(index: number, key: keyof ServiceRow, value: string) {
    setServiceCatalog((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === 'name' ? value : Number(value) } : item));
  }

  function updateHours(index: number, key: keyof OpeningDay, value: string | boolean) {
    setOpeningHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }

  function validateStep(currentStep: number) {
    setError(null);
    if (currentStep === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) { setError('Indique ton prénom et ton nom.'); return false; }
      if (!phoneValid) { setError('Numéro WhatsApp invalide (ex. 0612345678).'); return false; }
    }
    if (currentStep === 2) {
      if (!form.salonName.trim()) { setError('Indique le nom de ton salon.'); return false; }
      if (!form.address.trim() || !form.city.trim() || !form.neighborhood.trim()) { setError('Sélectionne une adresse exacte et vérifie la ville et le quartier.'); return false; }
    }
    if (currentStep === 3) {
      if (!selected.length) { setError('Sélectionne au moins une spécialité.'); return false; }
      if (!serviceCatalog.length || serviceCatalog.some((item) => !item.name.trim() || item.duration < 5 || item.price < 1)) { setError('Complète chaque service avec un nom, une durée et un prix.'); return false; }
      if (staff.some((member) => !member.name.trim() || !member.hours.trim())) { setError('Renseigne le nom et les heures de chaque coiffeur.'); return false; }
      if (openingHours.some((day) => day.on && (!day.open || !day.close))) { setError('Complète les heures de chaque jour ouvert.'); return false; }
    }
    if (currentStep === 4) {
      if (photos.length < 3) { setError('Ajoute au moins 3 photos de tes réalisations.'); return false; }
      if (!certificatePhoto) { setError('Ajoute une photo lisible de ta certification de coiffure.'); return false; }
      if (!form.consent || !form.legalConsent) { setError('Les deux consentements sont obligatoires.'); return false; }
    }
    return true;
  }

  function goNext() {
    if (validateStep(step)) setStep((current) => Math.min(4, current + 1));
  }

  async function submit() {
    if (!validateStep(4)) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/partner/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: normalizePhoneInput(form.phone),
          specialties: selected,
          photos: photos.map((photo) => photo.url),
          certificatePhoto: certificatePhoto?.url,
          chairCount,
          staff,
          serviceCatalog,
          openingHours,
          placeId: place.placeId,
          latitude: place.lat ?? null,
          longitude: place.lng ?? null,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || json?.error || 'Erreur lors de l’envoi.');
      setResult({ reference: json.data.application.reference });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erreur réseau. Réessaie.');
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
          <span className="section-kicker">DOSSIER ENVOYÉ</span>
          <h1>Ton profil est en vérification.</h1>
          <p>Merci {form.firstName}. Notre back-office va contrôler tes documents, ton certificat, tes photos, tes services et tes horaires. Après validation, tu recevras un message HLAQTI sur WhatsApp dans les 24 heures maximum avec l’accès à ton profil pro.</p>
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
        <div><span>Déjà partenaire ?</span><Link href="/connexion?role=COIFFEUR">Se connecter</Link></div>
      </header>
      <div className="partner-layout">
        <aside>
          <span className="section-kicker">REJOINS HLAQTI</span>
          <h1>Remplis ton agenda,<br /><em>pas ton répondeur.</em></h1>
          <p>Une inscription claire, un profil vérifié et toutes les informations utiles à tes clients au même endroit.</p>
          <div className="partner-benefits">
            <p><CalendarCheck /><span><b>Agenda rempli sans appels manqués</b><small>Les clients réservent pendant que tu travailles.</small></span></p>
            <p><MessageCircle /><span><b>Décision et confirmation sur WhatsApp</b><small>Tu reçois nos messages directement sur ton numéro.</small></span></p>
            <p><ShieldCheck /><span><b>Profil artisan de confiance</b><small>Certificat, équipe, prix, horaires et réalisations vérifiés.</small></span></p>
          </div>
          <blockquote>« Le client sait qui je suis, ce que je propose, combien ça coûte et quand je travaille. »<small>— L’équipe HLAQTI · Casablanca</small></blockquote>
        </aside>

        <section className="partner-form">
          <div className="partner-progress"><div><span>ÉTAPE {step} SUR 4</span><b>{['Ton activité', 'Ton salon', 'Offre & équipe', 'Photos & validation'][step - 1]}</b></div><div>{[1, 2, 3, 4].map((index) => <i className={index <= step ? 'active' : ''} key={index} />)}</div></div>
          {error && <div className="form-error"><X size={16} /> {error}</div>}

          {step === 1 && <div className="onboard-step">
            <span className="form-icon"><UserRound /></span><h2>Parle-nous de toi.</h2><p>Ton identité et ton WhatsApp seront vérifiés avant l’activation.</p>
            <div className="field-row"><label>Prénom<input value={form.firstName} onChange={(event) => set('firstName', event.target.value)} placeholder="Ex. Ayoub" /></label><label>Nom<input value={form.lastName} onChange={(event) => set('lastName', event.target.value)} placeholder="Ex. Mansouri" /></label></div>
            <label>Numéro WhatsApp<div className="wa-input"><b>🇲🇦 +212</b><input placeholder="6 12 34 56 78" value={form.phone} onChange={(event) => set('phone', event.target.value)} inputMode="tel" /></div><small>{phoneValid ? <><Check /> Numéro valide.</> : 'Saisis ton numéro marocain (06, 05 ou 07).'}</small></label>
            <label>Années d’expérience<select value={form.experience} onChange={(event) => set('experience', event.target.value)}><option value="0-1">Moins d’un an</option><option value="1-3">1 à 3 ans</option><option value="3-5">3 à 5 ans</option><option value="5-10">5 à 10 ans</option><option value="10+">Plus de 10 ans</option></select></label>
            <div className="required-hint"><ShieldCheck size={16} /><span><b>Certification obligatoire</b><small>Une photo de ton certificat sera demandée à l’étape 4.</small></span></div>
          </div>}

          {step === 2 && <div className="onboard-step">
            <span className="form-icon"><Store /></span><h2>Ton salon, exactement.</h2><p>L’adresse Google Maps permet à tes clients de te trouver sans confusion.</p>
            <label>Nom du salon<input value={form.salonName} onChange={(event) => set('salonName', event.target.value)} placeholder="Ex. Salon Nour" /></label>
            <label>Adresse exacte du salon<LocationAutocomplete mode="address" value={form.address} onChange={(value) => set('address', value)} onPlace={onAddressPlace} placeholder="Recherche l’adresse dans Google Maps…" withGeolocation /><small><MapPin /> Sélectionne l’établissement exact · Maroc uniquement.{place.lat != null && <><Check /> Coordonnées enregistrées.</>}</small></label>
            <div className="field-row"><label>Ville<input value={form.city} onChange={(event) => set('city', event.target.value)} placeholder="Casablanca" /></label><label>Quartier<input value={form.neighborhood} onChange={(event) => set('neighborhood', event.target.value)} placeholder="Sidi Bernoussi" /></label></div>
            <label>Repère à proximité<input placeholder="Ex. en face de la pharmacie Al Amal" value={form.landmark} onChange={(event) => set('landmark', event.target.value)} /><small><MapPin /> Aide le client à reconnaître la devanture.</small></label>
            <div className="chair-count-card"><div><span className="field-caption">CAPACITÉ DU SALON</span><b>Combien de chaises ?</b><small>Une chaise correspond à un coiffeur réservable.</small></div><div className="number-stepper"><button type="button" onClick={() => setChairCount(chairCount - 1)} aria-label="Retirer une chaise"><Minus size={15} /></button><strong>{chairCount}</strong><button type="button" onClick={() => setChairCount(chairCount + 1)} aria-label="Ajouter une chaise"><Plus size={15} /></button></div></div>
          </div>}

          {step === 3 && <div className="onboard-step details-step">
            <span className="form-icon"><Scissors /></span><h2>Ton offre et ton équipe.</h2><p>Ces informations seront visibles sur ton profil après validation.</p>
            <section className="onboard-section"><header><div><span className="field-caption">SERVICES & TARIFS</span><b>Ce que tu proposes</b><small>Nom, durée et prix en MAD : pas de surprise pour le client.</small></div><button type="button" className="small-add" onClick={() => setServiceCatalog((current) => [...current, { name: '', duration: 30, price: 30 }])}><Plus size={13} /> Ajouter</button></header><div className="service-editor">{serviceCatalog.map((service, index) => <div className="service-editor-row" key={`${index}-${service.name}`}><input value={service.name} onChange={(event) => updateService(index, 'name', event.target.value)} placeholder="Nom du service" /><label><Clock3 size={13} /><input type="number" min="5" max="480" value={service.duration} onChange={(event) => updateService(index, 'duration', event.target.value)} /><small>min</small></label><label><input type="number" min="1" max="10000" value={service.price} onChange={(event) => updateService(index, 'price', event.target.value)} /><small>MAD</small></label>{serviceCatalog.length > 1 && <button type="button" onClick={() => setServiceCatalog((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Supprimer le service"><Trash2 size={14} /></button>}</div>)}</div></section>
            <label>Spécialités mises en avant<div className="specialty-select">{SPECIALTIES.map((specialty) => <button type="button" className={selected.includes(specialty) ? 'active' : ''} onClick={() => toggleSpecialty(specialty)} key={specialty}>{selected.includes(specialty) && <Check />}{specialty}</button>)}</div></label>
            <section className="onboard-section"><header><div><span className="field-caption">ÉQUIPE & CHAISES</span><b>Nom et horaires de chaque coiffeur</b><small>Le client verra qui est disponible et quand.</small></div></header><div className="staff-editor">{staff.map((member, index) => <div className="staff-editor-row" key={index}><span className="staff-number">{index + 1}</span><input value={member.name} onChange={(event) => updateStaff(index, 'name', event.target.value)} placeholder={`Nom du coiffeur ${index + 1}`} /><input value={member.specialty} onChange={(event) => updateStaff(index, 'specialty', event.target.value)} placeholder="Spécialité (optionnel)" /><input value={member.hours} onChange={(event) => updateStaff(index, 'hours', event.target.value)} placeholder="Ex. 09:00–18:00" /></div>)}</div></section>
            <section className="onboard-section"><header><div><span className="field-caption">HORAIRES DU SALON</span><b>Quand tes clients peuvent réserver</b><small>Ajoute une pause déjeuner, prière ou fermeture.</small></div></header><div className="opening-editor">{openingHours.map((day, index) => <div className={!day.on ? 'closed-day' : ''} key={day.day}><button type="button" className={'tiny-switch ' + (day.on ? 'on' : '')} onClick={() => updateHours(index, 'on', !day.on)}><i /></button><b>{day.day.slice(0, 3)}</b>{day.on ? <><input type="time" value={day.open} onChange={(event) => updateHours(index, 'open', event.target.value)} /><span>—</span><input type="time" value={day.close} onChange={(event) => updateHours(index, 'close', event.target.value)} /></> : <em>Fermé</em>}</div>)}</div></section>
          </div>}

          {step === 4 && <div className="onboard-step final-step">
            <span className="form-icon"><ShieldCheck /></span><h2>Documents et validation.</h2><p>Ton profil reste privé jusqu’à la décision du back-office.</p>
            <section className="certificate-upload"><div className="document-heading"><div><span className="field-caption">DOCUMENT OBLIGATOIRE</span><b>Certification de coiffure</b><small>Prends une photo nette de ton certificat ou diplôme.</small></div><ShieldCheck /></div><input ref={certificateRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(event) => uploadCertificate(event.target.files?.[0])} />{certificatePhoto ? <div className="certificate-preview"><Image src={certificatePhoto.url} alt="Certification de coiffure" fill sizes="240px" /><span><Check size={13} /> Document ajouté</span><button type="button" onClick={() => setCertificatePhoto(null)}><X size={14} /></button></div> : <button type="button" className="certificate-button" onClick={() => certificateRef.current?.click()} disabled={certificateUploading}>{certificateUploading ? <><Loader2 className="spin" /> Envoi…</> : <><Upload /><b>Prendre ou importer la photo du certificat</b><small>JPG, PNG ou WebP · image lisible obligatoire</small></>}</button>}</section>
            <section className="portfolio-upload"><div className="document-heading"><div><span className="field-caption">PORTFOLIO OBLIGATOIRE</span><b>Tes réalisations</b><small>Minimum 3 photos personnelles · tu peux en ajouter autant que tu veux.</small></div><Camera /></div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple capture="environment" hidden onChange={(event) => uploadFiles(event.target.files)} /><button type="button" className="portfolio-add" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? <><Loader2 className="spin" /> Envoi…</> : <><Plus /> Ajouter des photos</>}</button><div className="photo-thumbs">{photos.map((photo, index) => <div className="photo-thumb" key={`${photo.url}-${index}`}><Image src={photo.url} alt={photo.name} fill sizes="100px" /><span className="check-badge"><Check size={13} /></span><button type="button" className="remove-photo" onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Supprimer la photo"><X size={14} /></button></div>)}</div><small className="upload-count"><Camera size={13} /> {photos.length} photo(s) ajoutée(s) · minimum 3 · aucune limite maximale</small></section>
            <section className="application-summary detailed-summary"><div><span>{(form.firstName[0] || '') + (form.lastName[0] || '')}</span><p><b>{form.firstName} {form.lastName}</b><small>{form.experience} d’expérience · WhatsApp +212 {form.phone}</small></p><button type="button" onClick={() => setStep(1)}>Modifier</button></div><p><Store /><span><b>{form.salonName} · {chairCount} chaise(s)</b><small>{form.address}, {form.neighborhood}, {form.city}</small></span><button type="button" onClick={() => setStep(2)}>Modifier</button></p><p><Scissors /><span><b>{serviceCatalog.length} service(s) · {selected.length} spécialité(s)</b><small>{staff.map((member) => member.name || 'Nom à compléter').join(' · ')}</small></span><button type="button" onClick={() => setStep(3)}>Modifier</button></p><p><Clock3 /><span><b>Horaires renseignés</b><small>{openingHours.filter((day) => day.on).length} jours ouverts · pauses incluses</small></span></p></section>
            <label className="consent"><input type="checkbox" checked={form.consent} onChange={(event) => set('consent', event.target.checked)} /> J’ai l’autorisation d’utiliser les photos des personnes représentées.</label>
            <label className="consent legal"><input type="checkbox" checked={form.legalConsent} onChange={(event) => set('legalConsent', event.target.checked)} /> J’accepte les conditions partenaires et la politique de confidentialité HLAQTI.</label>
            <div className="validation-info"><Clock3 /><span><b>Réponse sous 24 h maximum après examen</b><small>Si le dossier est validé, le message WhatsApp contient ton accès à l’espace pro et ton profil reprend toutes les informations saisies.</small></span></div>
          </div>}

          <footer className="onboard-actions">{step > 1 && <button className="prev" type="button" onClick={() => { setError(null); setStep((current) => current - 1); }}><ArrowLeft /> Retour</button>}<button className="next" type="button" disabled={submitting || uploading || certificateUploading} onClick={step < 4 ? goNext : submit}>{submitting ? 'Envoi…' : uploading || certificateUploading ? 'Upload en cours…' : step === 4 ? 'Envoyer mon dossier' : 'Continuer'} {step === 4 ? <Check /> : <ArrowRight />}</button></footer>
        </section>
      </div>
    </main>
  );
}

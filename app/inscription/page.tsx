'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole,
  Mail, MapPin, MessageCircle, Phone, Scissors, ShieldCheck, Sparkles, Star, UserRound,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SocialButtons } from '@/components/SocialButtons';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

type Role = 'CLIENT' | 'COIFFEUR';

const PREFERENCES = ['Dégradé américain', 'Taper fade', 'Barbe au rasoir', 'Ciseaux', 'Coupe enfant', 'Soin du cuir chevelu'];
const GENDERS = [
  { id: 'HOMME', label: 'Homme' },
  { id: 'FEMME', label: 'Femme' },
] as const;
const STEPS = ['Compte', 'Profil', 'Préférences', 'Vérification'];

function strength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0..4
}

export default function Register() {
  const [role, setRole] = useState<Role>('CLIENT');
  const [step, setStep] = useState(0);

  // Identity
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Profile
  const [gender, setGender] = useState('HOMME');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [neighborhood, setNeighborhood] = useState('Sidi Bernoussi');

  // Preferences
  const [prefs, setPrefs] = useState<string[]>(['Dégradé américain', 'Barbe au rasoir']);
  const [newsletter, setNewsletter] = useState(true);
  const [whatsappOffers, setWhatsappOffers] = useState(true);

  // OTP
  const [normalized, setNormalized] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ name: string } | null>(null);

  const phoneValid = /^(\+212|0)[5-7]\d{8}$/.test(phone.replace(/\s/g, ''));
  const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwdScore = useMemo(() => strength(password), [password]);
  const pwdValid = password.length >= 8 && pwdScore >= 2;
  const birthYearNum = parseInt(birthYear, 10);
  const ageValid = !birthYear || (birthYearNum >= 1940 && birthYearNum <= 2012);

  const togglePref = (p: string) => setPrefs((v) => (v.includes(p) ? v.filter((x) => x !== p) : [...v, p]));

  function validateStep(): string | null {
    if (step === 0) {
      if (firstName.trim().length < 2) return 'Renseigne ton prénom.';
      if (lastName.trim().length < 2) return 'Renseigne ton nom.';
      if (!phoneValid) return 'Numéro WhatsApp invalide (ex. 0612345678).';
      if (!emailValid) return 'Adresse email invalide.';
      if (!pwdValid) return 'Mot de passe trop faible (8 caractères, une majuscule et un chiffre).';
      if (!acceptTerms) return 'Tu dois accepter les conditions.';
    }
    if (step === 1) {
      if (!ageValid) return 'Année de naissance invalide.';
    }
    return null;
  }

  async function next() {
    setError('');
    const err = validateStep();
    if (err) { setError(err); return; }

    if (step < 2) { setStep(step + 1); return; }

    // step 2 -> request OTP then move to verification
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/request-otp', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const x = await res.json();
      if (!res.ok) throw new Error(x.message || x.error || 'Numéro invalide.');
      setNormalized(x.data.phone);
      setDevCode(x.data.devCode || '');
      setStep(3);
    } catch (e: any) {
      setError(e?.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone: normalized,
          code,
          role,
          register: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            gender,
            birthYear: birthYear ? birthYearNum : null,
            city,
            neighborhood,
            locale: 'fr',
            cutPreferences: prefs.join(', '),
            newsletter: newsletter && whatsappOffers,
          },
        }),
      });
      const x = await res.json();
      if (!res.ok) throw new Error(x.message || x.error || 'Code incorrect.');
      setDone({ name: firstName });
      setTimeout(() => { window.location.href = x.data.redirect; }, 1400);
    } catch (e: any) {
      setError(e?.message || 'Erreur de vérification.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="login-page register-page">
        <aside>
          <Link href="/"><Logo /></Link>
          <div>
            <span className="section-kicker">COMPTE CRÉÉ</span>
            <h1>Bienvenue, {done.name}.</h1>
            <p>Ton compte HLAQTI est prêt. Tu peux réserver ta première coupe.</p>
          </div>
        </aside>
        <section>
          <div className="login-card success-card">
            <CheckCircle2 className="big-check" />
            <h2>Inscription réussie</h2>
            <p>Redirection vers ton espace…</p>
            <Loader2 className="spin" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page register-page">
      <aside>
        <Link href="/"><Logo /></Link>
        <div>
          <span className="section-kicker">REJOINS HLAQTI</span>
          <h1>Crée ton compte en moins de 2 minutes.</h1>
          <p>Un compte client pour réserver dans tous les salons partenaires, ou un compte coiffeur pour développer ton activité.</p>
          <div className="register-perks">
            <div><Check /> Réservation confirmée immédiatement</div>
            <div><Check /> Rappels WhatsApp automatiques</div>
            <div><Check /> Tes coiffeurs et préférences sauvegardés</div>
            <div><Check /> Programme fidélité</div>
          </div>
          <blockquote>« Inscription en 2 minutes, puis j’ai réservé ma coupe directement. »<small>Sofiane · Sidi Bernoussi</small></blockquote>
        </div>
        <footer>© 2026 HLAQTI · Casablanca</footer>
      </aside>

      <section>
        <div className="login-card register-card">
          <span className="mobile-login-logo"><Logo /></span>

          {step === 0 && (
            <>
              <h2>Crée ton compte</h2>
              <p>Choisis ton type de compte.</p>

              <div className="role-choice">
                <button className={role === 'CLIENT' ? 'active' : ''} onClick={() => setRole('CLIENT')}>
                  <UserRound /><span><b>Je suis client</b><small>Je réserve mes coupes</small></span>{role === 'CLIENT' && <Check />}
                </button>
                <Link href="/devenir-partenaire" className={'role-choice-link ' + (role === 'COIFFEUR' ? 'active' : '')}>
                  <Scissors /><span><b>Je suis coiffeur / salon</b><small>Devenir partenaire →</small></span>
                </Link>
              </div>

              <SocialButtons role="CLIENT" />
              <div className="or"><span /> ou avec ton WhatsApp <span /></div>

              <div className="field-row">
                <label>Prénom<input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Youssef" autoComplete="given-name" /></label>
                <label>Nom<input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Bennani" autoComplete="family-name" /></label>
              </div>

              <label className="field">
                <span>NUMÉRO WHATSAPP</span>
                <div className="wa-field">
                  <Phone /><b>+212</b>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6 12 34 56 78" inputMode="tel" autoComplete="tel" />
                  {phoneValid && <Check className="valid" />}
                </div>
              </label>

              <label className="field">
                <span>EMAIL (REÇUS, FACTURES)</span>
                <div className="wa-field">
                  <Mail /><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@email.com" type="email" autoComplete="email" />
                  {emailValid && email && <Check className="valid" />}
                </div>
              </label>

              <label className="field">
                <span>MOT DE PASSE</span>
                <div className="wa-field">
                  <LockKeyhole />
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Au moins 8 caractères" autoComplete="new-password" />
                  <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>{showPwd ? <EyeOff /> : <Eye />}</button>
                </div>
                <div className="pwd-strength">
                  {[0, 1, 2, 3].map((i) => <i key={i} className={i < pwdScore ? ['weak', 'ok', 'good', 'strong'][pwdScore - 1] : ''} />)}
                  <span>{['Trop court', 'Faible', 'Correct', 'Bon', 'Excellent'][pwdScore]}</span>
                </div>
              </label>

              <label className="checkbox-consent">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                <i>{acceptTerms && <Check size={13} />}</i>
                J’accepte les <Link href="/conditions">conditions d’utilisation</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>.
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Parle-nous de toi</h2>
              <p>Ces informations permettent de personnaliser tes recommandations.</p>

              <label className="field"><span>CIVILITÉ</span>
                <div className="gender-pills">
                  {GENDERS.map((g) => (
                    <button type="button" key={g.id} className={gender === g.id ? 'active' : ''} onClick={() => setGender(g.id)}>{g.label}</button>
                  ))}
                </div>
              </label>

              <label className="field"><span>DATE DE NAISSANCE (FACULTATIF)</span>
                <div className="dob-row">
                  <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
                    <option value="">Jour</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                    <option value="">Mois</option>
                    {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <input value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Année" inputMode="numeric" />
                </div>
              </label>

              <label className="field"><span>VILLE</span>
                <LocationAutocomplete mode="city" value={city} onChange={setCity} placeholder="Ex. Casablanca, Rabat, Marrakech…" />
              </label>

              <label className="field"><span>QUARTIER</span>
                <LocationAutocomplete mode="neighborhood" value={neighborhood} onChange={setNeighborhood} placeholder="Ex. Sidi Bernoussi, Maârif, Agdal…" />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Tes préférences</h2>
              <p>Aide-nous à te proposer les bons coiffeurs. Tu pourras tout modifier plus tard.</p>

              <label className="field"><span>STYLES QUE TU AIMES</span>
                <div className="specialty-select prefs">
                  {PREFERENCES.map((p) => (
                    <button type="button" key={p} className={prefs.includes(p) ? 'active' : ''} onClick={() => togglePref(p)}>
                      {prefs.includes(p) && <Check size={14} />}{p}
                    </button>
                  ))}
                </div>
              </label>

              <div className="consent-block">
                <label className="checkbox-consent">
                  <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
                  <i>{newsletter && <Check size={13} />}</i>
                  <span><b>Offres et nouveautés par WhatsApp</b><small>Coupes offertes, ouvertures de salons, max 1/semaine.</small></span>
                </label>
                <label className="checkbox-consent">
                  <input type="checkbox" checked={whatsappOffers} onChange={(e) => setWhatsappOffers(e.target.checked)} />
                  <i>{whatsappOffers && <Check size={13} />}</i>
                  <span><b>Rappels de rendez-vous</b><small>Recommandé pour ne jamais oublier ta coupe.</small></span>
                </label>
              </div>

              <div className="summary-card">
                <div><span><UserRound /></span><div><small>IDENTITÉ</small><b>{firstName} {lastName}</b></div></div>
                <div><span><Phone /></span><div><small>WHATSAPP</small><b>{normalized || phone}</b></div></div>
                <div><span><MapPin /></span><div><small>ZONE</small><b>{neighborhood}, {city}</b></div></div>
                <div><span><Sparkles /></span><div><small>PRÉFÉRENCES</small><b>{prefs.length} style(s) sélectionné(s)</b></div></div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <button className="otp-back" onClick={() => setStep(2)}><ArrowLeft /> Modifier mes infos</button>
              <div className="otp-icon"><MessageCircle /></div>
              <h2>Vérifie ton WhatsApp</h2>
              <p>On a envoyé un code à 6 chiffres au<br /><b>{normalized}</b></p>
              <label className="otp-code">
                <span>CODE DE VÉRIFICATION</span>
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="— — — — — —" inputMode="numeric" autoFocus />
              </label>
              {devCode && <div className="dev-code">Mode démo · code : <b>{devCode}</b></div>}
              <button className="resend" onClick={async () => {
                const r = await fetch('/api/v1/auth/request-otp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) });
                const j = await r.json(); if (j.data?.devCode) setDevCode(j.data.devCode);
              }}>Renvoyer le code</button>
            </>
          )}

          {error && <div className="login-error">{error}</div>}

          <div className="register-actions">
            {step > 0 && step < 3 && (
              <button className="prev-btn" onClick={() => setStep(step - 1)}><ArrowLeft /> Retour</button>
            )}
            {step < 3 ? (
              <button className="login-submit" onClick={next} disabled={loading}>
                {loading ? <Loader2 className="spin" /> : <>{step === 2 ? <ShieldCheck /> : <ArrowRight />}</>}
                {loading ? 'Vérification…' : step === 2 ? 'Recevoir mon code' : 'Continuer'}
              </button>
            ) : (
              <button className="login-submit" onClick={verify} disabled={loading || code.length !== 6}>
                {loading ? <Loader2 className="spin" /> : <Check />}
                {loading ? 'Création du compte…' : 'Créer mon compte'}
              </button>
            )}
          </div>

          {step === 0 && (
            <div className="register-footer">
              Déjà un compte ? <Link href="/connexion">Se connecter</Link>
            </div>
          )}

          {step > 0 && step < 3 && (
            <div className="step-dots">{STEPS.map((_, i) => <i key={i} className={i <= step ? 'active' : ''} />)}</div>
          )}

          <div className="login-safe"><Star /> Tes données sont chiffrées et ne sont jamais revendues.</div>
        </div>
      </section>
    </main>
  );
}

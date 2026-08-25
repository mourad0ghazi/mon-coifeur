'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { CalendarDays, MapPin, MessageCircle, Scissors, UserRound, X } from 'lucide-react';

type Appointment = {
  id: string; reference: string; barber_name: string; salon_name: string; salon_neighborhood: string;
  date: string; start_minutes: number; end_minutes: number; service_label: string;
  price_mad: number; status: string;
};

function fmtTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;
}
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export default function Account() {
  const [name, setName] = useState('toi');
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/me').then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (j?.data?.user) setName(j.data.user.name.split(' ')[0] || 'toi');
    });
    fetch('/api/v1/appointments?scope=mine').then((r) => (r.ok ? r.json() : null)).then((j) => {
      setAppts(j?.data?.appointments || []);
      setLoading(false);
    });
  }, []);

  const upcoming = appts.filter((a) => ['CONFIRME', 'EN_ATTENTE'].includes(a.status));
  const past = appts.filter((a) => !['CONFIRME', 'EN_ATTENTE'].includes(a.status));
  const next = upcoming[0];

  async function cancel(id: string) {
    const res = await fetch(`/api/v1/appointments/${id}/cancel`, { method: 'POST' });
    const j = await res.json();
    if (!res.ok) { setToast(j?.message || 'Annulation impossible.'); setTimeout(() => setToast(null), 3000); return; }
    setAppts((list) => list.map((a) => (a.id === id ? { ...a, status: 'ANNULE_CLIENT' } : a)));
    setToast('Rendez-vous annulé.'); setTimeout(() => setToast(null), 2500);
  }

  return (
    <>
      <div className="inner-head"><Header /></div>
      <main className="account container">
        <span className="section-kicker">BONJOUR {name.toUpperCase()}</span>
        <h1>Ton prochain rendez-vous.</h1>

        {loading && <div className="next-appt loading"><p>Chargement…</p></div>}

        {!loading && next && (
          <div className="next-appt">
            <div className="datebox">
              <b>{new Date(next.date + 'T00:00:00').getDate()}</b>
              <span>{new Date(next.date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</span>
            </div>
            <section>
              <span>{fmtDate(next.date)} · {fmtTime(next.start_minutes)}</span>
              <h2>{next.service_label} avec {next.barber_name}</h2>
              <p><MapPin /> {next.salon_name} · {next.salon_neighborhood}</p>
              <small>Réf. {next.reference} · {next.price_mad} MAD sur place</small>
            </section>
            <aside>
              <Link href={`/salons/${next.salon_name.toLowerCase().includes('mouad') ? 'mouad' : 'mouad'}`}>Voir le salon</Link>
              <a href={`https://wa.me/212600000000`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
              <button className="cancel-btn" onClick={() => cancel(next.id)}><X /> Annuler</button>
            </aside>
          </div>
        )}

        {!loading && !next && (
          <div className="next-appt empty">
            <Scissors />
            <section>
              <h2>Aucun rendez-vous à venir.</h2>
              <p>Trouve un coiffeur disponible près de chez toi.</p>
              <Link href="/recherche" className="primary-link">Rechercher un salon</Link>
            </section>
          </div>
        )}

        <div className="account-grid">
          <div>
            <CalendarDays />
            <b>Mes rendez-vous</b>
            <span>{upcoming.length} à venir · {past.length} passés</span>
          </div>
          <Link href="/mon-compte/profil">
            <UserRound />
            <b>Mon profil</b>
            <span>Informations et préférences</span>
          </Link>
        </div>

        {upcoming.length > 1 && (
          <section className="appt-list">
            <h3>Prochains rendez-vous</h3>
            {upcoming.slice(1).map((a) => (
              <div className="appt-row" key={a.id}>
                <div><b>{fmtDate(a.date)}</b><span>{fmtTime(a.start_minutes)} · {a.barber_name}</span></div>
                <p>{a.service_label} — {a.salon_name}</p>
                <button onClick={() => cancel(a.id)}>Annuler</button>
              </div>
            ))}
          </section>
        )}

        {toast && <div className="admin-toast">{toast}</div>}
      </main>
    </>
  );
}

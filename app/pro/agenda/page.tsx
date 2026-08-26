'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import {
  ChevronLeft, ChevronRight, MessageCircle, Clock3, Check, X, Phone, Scissors, UserX,
} from 'lucide-react';
import { formatPhone, whatsappLink } from '@/lib/whatsapp';

type Appointment = {
  id: string; reference: string; client_name: string | null; client_phone: string;
  date: string; start_minutes: number; end_minutes: number;
  service_label: string; price_mad: number; note: string | null; status: string;
};

const HOUR_START = 9;
const HOUR_END = 21;
const HOUR_HEIGHT = 56; // px per hour
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Lundi = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}
function iso(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmt(min: number) { return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; }

export default function Agenda() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const from = iso(days[0]);
  const to = iso(days[6]);

  useEffect(() => {
    setLoading(true);
    // load all appointments and filter to the week client-side
    fetch('/api/v1/pro/appointments')
      .then((r) => r.json())
      .then((j) => {
        const all: Appointment[] = j.data?.appointments || [];
        setAppts(all.filter((a) => a.date >= from && a.date <= to));
        setLoading(false);
      });
  }, [from, to]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/v1/pro/appointments/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const j = await res.json();
      setAppts((list) => list.map((a) => (a.id === id ? j.data.appointment : a)));
      setSelected((s) => (s && s.id === id ? j.data.appointment : s));
    }
  }

  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  const weekLabel = `${days[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <DashboardShell title="Agenda" subtitle={weekLabel}>
      <div className="dash-content">
        <div className="calendar-toolbar">
          <div>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))}>Aujourd’hui</button>
            <button onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft /></button>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight /></button>
            <h2>{weekLabel}</h2>
          </div>
          <div className="legend">
            <span><i className="l-confirmed" /> Confirmé</span>
            <span><i className="l-now" /> En cours</span>
            <span><i className="l-done" /> Terminé</span>
            <span><i className="l-cancelled" /> Annulé</span>
          </div>
        </div>

        <div className="agenda-week">
          <aside className="agenda-gutter">
            <div className="agenda-corner" />
            {hours.map((h) => <time key={h}>{String(h).padStart(2, '0')}:00</time>)}
          </aside>
          <div className="agenda-days">
            {days.map((d, i) => {
              const dayAppts = appts.filter((a) => a.date === iso(d));
              const isToday = iso(d) === iso(today);
              return (
                <div key={i} className={'agenda-day' + (isToday ? ' today' : '')}>
                  <header>
                    <small>{DAYS[i].toUpperCase()}</small>
                    <b>{d.getDate()}</b>
                    {isToday && <em>Aujourd’hui</em>}
                  </header>
                  <div className="agenda-col" style={{ height: (HOUR_END - HOUR_START) * HOUR_HEIGHT }}>
                    {hours.slice(0, -1).map((h) => <i key={h} className="grid-line" />)}
                    {isToday && today.getHours() >= HOUR_START && today.getHours() < HOUR_END && (
                      <i className="now-line" style={{ top: ((today.getHours() - HOUR_START) * 60 + today.getMinutes()) / 60 * HOUR_HEIGHT }} />
                    )}
                    {dayAppts.map((a) => {
                      const top = ((a.start_minutes - HOUR_START * 60) / 60) * HOUR_HEIGHT;
                      const height = Math.max(28, ((a.end_minutes - a.start_minutes) / 60) * HOUR_HEIGHT - 4);
                      return (
                        <button
                          key={a.id}
                          className={'agenda-event ' + a.status.toLowerCase().replace('_', '-')}
                          style={{ top, height }}
                          onClick={() => setSelected(a)}
                        >
                          <small>{fmt(a.start_minutes)}</small>
                          <b>{(a.client_name || 'Client').split(' ')[0]}</b>
                          <span>{a.service_label} · {a.price_mad} MAD</span>
                        </button>
                      );
                    })}
                    {dayAppts.length === 0 && !loading && <div className="day-empty">—</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <>
          <button className="drawer-overlay" onClick={() => setSelected(null)} />
          <aside className="appt-drawer">
            <header>
              <div><span>RENDEZ-VOUS</span><b>{selected.reference}</b></div>
              <button onClick={() => setSelected(null)}><X /></button>
            </header>
            <section className="appt-drawer-client">
              <i>{(selected.client_name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}</i>
              <div>
                <h3>{selected.client_name || 'Client sans nom'}</h3>
                <p><Phone size={13} /> <a href={`tel:${selected.client_phone}`}>{formatPhone(selected.client_phone)}</a></p>
              </div>
            </section>
            <section className="appt-drawer-meta">
              <p><Clock3 /> <span>{fmt(selected.start_minutes)} – {fmt(selected.end_minutes)} · {new Date(selected.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></p>
              <p><Scissors /> <span><b>{selected.service_label}</b><small>{selected.end_minutes - selected.start_minutes} min · {selected.price_mad} MAD sur place</small></span></p>
              {selected.note && <p className="note">« {selected.note} »</p>}
            </section>
            <a className="wa-direct" href={whatsappLink(selected.client_phone, `Salam ${selected.client_name?.split(' ')[0] || ''}, c'est ton coiffeur HLAQTI.`)} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Écrire au client sur WhatsApp
            </a>
            <div className="appt-drawer-actions">
              {selected.status === 'CONFIRME' && (
                <>
                  <button className="start" onClick={() => setStatus(selected.id, 'EN_COURS')}><Check /> Démarrer</button>
                  <button onClick={() => setStatus(selected.id, 'TERMINE')}><Check /> Terminer</button>
                  <button className="danger" onClick={() => setStatus(selected.id, 'ANNULE_COIFFEUR')}><X /> Annuler</button>
                </>
              )}
              {selected.status === 'EN_COURS' && (
                <>
                  <button className="start" onClick={() => setStatus(selected.id, 'TERMINE')}><Check /> Marquer terminé</button>
                  <button className="danger" onClick={() => setStatus(selected.id, 'NO_SHOW')}><UserX /> No-show</button>
                </>
              )}
              {['TERMINE', 'ANNULE_COIFFEUR', 'ANNULE_CLIENT', 'NO_SHOW'].includes(selected.status) && (
                <em className="done-msg">Rendez-vous {selected.status.toLowerCase().replace('_', ' ')}.</em>
              )}
            </div>
          </aside>
        </>
      )}
    </DashboardShell>
  );
}

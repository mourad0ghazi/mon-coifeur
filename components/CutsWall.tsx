'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type Cut = { src: string; title: string; author: string; tag: 'fade' | 'taper' | 'barbe' };

const CUTS: Cut[] = [
  { src: '/images/cut-fade.jpg', title: 'Low fade précis', author: 'Karim', tag: 'fade' },
  { src: '/images/cut-fade-2.jpg', title: 'Skin fade net', author: 'Mouad', tag: 'fade' },
  { src: '/images/cut-curls.jpg', title: 'Taper & curls', author: 'Mouad', tag: 'taper' },
  { src: '/images/cut-taper-2.jpg', title: 'Taper moderne', author: 'Yassine', tag: 'taper' },
  { src: '/images/cut-beard.jpg', title: 'Barbe au rasoir', author: 'Yassine', tag: 'barbe' },
  { src: '/images/cut-beard-2.jpg', title: 'Taille de barbe', author: 'Karim', tag: 'barbe' },
];

const FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'fade', label: 'Fade' },
  { id: 'taper', label: 'Taper' },
  { id: 'barbe', label: 'Barbe' },
] as const;

export function CutsWall() {
  const [active, setActive] = useState<(typeof FILTERS)[number]['id']>('all');

  const visible = useMemo(
    () => (active === 'all' ? CUTS : CUTS.filter((c) => c.tag === active)),
    [active]
  );

  return (
    <section className="cuts-section" id="coupes">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="section-kicker">FAIT À CASABLANCA</span>
            <h2>Le mur des coupes.</h2>
            <p>Pas de photos de stock. Du vrai travail, par de vrais coiffeurs.</p>
          </div>
          <div className="chips" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={active === f.id}
                className={active === f.id ? 'active' : ''}
                onClick={() => setActive(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className={'cuts-grid count-' + visible.length}>
          {visible.map((c, i) => (
            <Link href="/salons/mouad" className={'cut cut-' + i} key={c.src}>
              <Image src={c.src} fill alt={c.title} sizes="(max-width:900px) 80vw, 380px" />
              <span>
                <small>PAR {c.author.toUpperCase()}</small>
                <b>{c.title}</b>
                <i>Voir le profil <ArrowRight /></i>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

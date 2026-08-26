'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export type HeroSlide = {
  src: string;
  title: string;
  subtitle: string;
  category: 'COIFFURE' | 'SALON' | 'BARBE' | 'DESIGN';
};

// Galerie « sélection IA » : meilleure photo de coiffure, design du salon,
// coupe spécifique. L'ordre et la priorité peuvent être pilotés par l'admin
// plus tard (métadonnées note/relevance).
export const HERO_SLIDES: HeroSlide[] = [
  {
    src: '/images/salon-mouad-hero.jpg',
    title: 'Salon pilote · Sidi Bernoussi',
    subtitle: 'L’ambiance du Salon Mouad, validée par l’équipe HLAQTI.',
    category: 'SALON',
  },
  {
    src: '/images/hero-fade.jpg',
    title: 'Dégradé américain net',
    subtitle: 'Une coupe précise, sélectionnée parmi les meilleurs travaux publiés.',
    category: 'COIFFURE',
  },
  {
    src: '/images/hero-salon.jpg',
    title: 'Design & ambiance',
    subtitle: 'Des salons propres, modernes et accueillants, passés au crible.',
    category: 'DESIGN',
  },
  {
    src: '/images/hero-beard.jpg',
    title: 'Barbe au rasoir',
    subtitle: 'Taille et finition par des coiffeurs vérifiés.',
    category: 'BARBE',
  },
  {
    src: '/images/hero-design.jpg',
    title: 'Le geste du coiffeur',
    subtitle: 'Le savoir-faire des artisans partenaires, en image.',
    category: 'COIFFURE',
  },
];

// « IA » de sélection : on privilégie les coiffures, puis le design du salon,
// avec un léger aléatoire. Ici c'est un score déterministe reproductible.
function aiOrder(slides: HeroSlide[]): HeroSlide[] {
  const score: Record<HeroSlide['category'], number> = {
    COIFFURE: 3,
    DESIGN: 2,
    BARBE: 2,
    SALON: 1,
  };
  return [...slides]
    .map((s) => ({ s, k: score[s.category] + Math.random() * 0.5 }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.s);
}

export function HeroGallery({ slides = HERO_SLIDES, interval = 6000 }: { slides?: HeroSlide[]; interval?: number }) {
  const [ordered] = useState(() => aiOrder(slides));
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({ [0]: true });

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % ordered.length);
    }, interval);
    return () => clearInterval(t);
  }, [ordered.length, interval]);

  useEffect(() => {
    setLoaded((m) => ({ ...m, [index]: true }));
  }, [index]);

  function go(i: number) {
    setIndex((i + ordered.length) % ordered.length);
  }

  return (
    <div className="hero-gallery">
      {ordered.map((slide, i) => (
        <div
          key={slide.src}
          className={'hero-slide' + (i === index ? ' active' : '')}
          aria-hidden={i !== index}
        >
          {loaded[i] && (
            <Image
              src={slide.src}
              alt={slide.title}
              fill
              priority={i === 0}
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          )}
        </div>
      ))}

      <div className="hero-shade" />

      <div className="hero-gallery-info">
        <span className="hero-cat">{ordered[index].category}</span>
        <h3>{ordered[index].title}</h3>
        <p>{ordered[index].subtitle}</p>
      </div>

      <div className="hero-dots" role="tablist" aria-label="Changer d'image">
        {ordered.map((s, i) => (
          <button
            key={s.src}
            role="tab"
            aria-selected={i === index}
            aria-label={s.title}
            className={i === index ? 'active' : ''}
            onClick={() => go(i)}
          >
            <span />
          </button>
        ))}
      </div>

      <div className="hero-counter">{String(index + 1).padStart(2, '0')} / {String(ordered.length).padStart(2, '0')}</div>
    </div>
  );
}

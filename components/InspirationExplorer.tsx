'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, ChevronDown, Search, Sparkles } from 'lucide-react';

type Region = 'maroc' | 'monde';
type Gender = 'homme' | 'femme';
type FaceShape = 'ovale' | 'rond' | 'carre' | 'long' | 'coeur';

type Inspiration = {
  id: string;
  name: string;
  alias: string;
  region: Region;
  gender: Gender;
  popularity: string;
  origin: string;
  history: string;
  why: string;
  faces: FaceShape[];
  image: string;
  service?: string;
};

const FACE_LABELS: Record<FaceShape, string> = {
  ovale: 'Ovale',
  rond: 'Rond',
  carre: 'Carré',
  long: 'Long',
  coeur: 'Cœur',
};

const STYLES: Inspiration[] = [
  {
    id: 'degrade-americain', name: 'Dégradé américain', alias: 'Skin fade · fade', region: 'maroc', gender: 'homme', popularity: 'Très demandé au Maroc', origin: 'États-Unis · barbershops',
    history: 'Né dans les salons militaires et les barbershops américains, le fade s’est imposé dans les années 1940 et 1950. La culture hip-hop et les barbiers afro-américains l’ont ensuite transformé en véritable signature technique : un fondu propre, du volume en haut et des contours précis.',
    why: 'Le contraste allonge visuellement le visage et met en valeur la texture du dessus. C’est la coupe la plus facile à personnaliser.', faces: ['ovale', 'carre', 'long'], image: '/images/cut-fade.jpg', service: 'degrade-americain',
  },
  {
    id: 'taper-fade', name: 'Taper fade', alias: 'Low taper · taper classique', region: 'maroc', gender: 'homme', popularity: 'Un favori des jeunes Marocains', origin: 'États-Unis · modern barbering',
    history: 'Le taper est la version plus progressive et plus discrète du dégradé. D’abord porté dans les coupes classiques américaines, il a été modernisé par les barbiers des années 2010 avec un fondu concentré autour des tempes et de la nuque.',
    why: 'Il garde davantage de matière sur les côtés : parfait pour un style propre au travail tout en restant moderne.', faces: ['ovale', 'rond', 'coeur'], image: '/images/cut-taper-2.jpg', service: 'taper-fade',
  },
  {
    id: 'curly-top', name: 'Curly top dégradé', alias: 'Boucles · curly fade', region: 'maroc', gender: 'homme', popularity: 'Très demandé pour cheveux bouclés', origin: 'Barbershops · cultures afro et méditerranéennes',
    history: 'Le curly top n’est pas une coupe unique mais une façon contemporaine de laisser parler la texture naturelle. Les dégradés de barbershop ont permis de structurer les boucles tout en conservant leur volume et leur mouvement.',
    why: 'Le volume placé au-dessus équilibre les visages ronds et donne du caractère aux visages carrés.', faces: ['rond', 'carre', 'long'], image: '/images/cut-curls.jpg', service: 'degrade-americain',
  },
  {
    id: 'side-part', name: 'Coupe classique side part', alias: 'Raie de côté · coupe aux ciseaux', region: 'maroc', gender: 'homme', popularity: 'Indémodable dans les salons marocains', origin: 'Europe et États-Unis · années 1920',
    history: 'La raie de côté devient populaire dans les années 1920 avec les coupes courtes et les coiffures bien peignées. Elle traverse les décennies grâce à son équilibre entre élégance, simplicité et facilité de coiffage.',
    why: 'La ligne latérale structure les visages longs et carrés. Avec une finition mate, elle fonctionne aussi dans un look très actuel.', faces: ['ovale', 'carre', 'long'], image: '/images/hero-salon.jpg', service: 'ciseaux',
  },
  {
    id: 'coupe-barbe', name: 'Coupe + barbe sculptée', alias: 'Formule complète · contours', region: 'maroc', gender: 'homme', popularity: 'La formule star des barbershops', origin: 'Tradition du barbier · réinterprétation moderne',
    history: 'Le duo cheveux et barbe vient du retour des barbershops traditionnels au début des années 2010. Au Maroc, il est devenu une prestation complète : dégradé, taille de barbe, serviette chaude et contours au rasoir.',
    why: 'Les contours peuvent affiner une mâchoire ronde ou adoucir un visage très carré. Le résultat dépend surtout de la longueur choisie.', faces: ['rond', 'carre', 'ovale'], image: '/images/cut-beard.jpg', service: 'coupe-barbe',
  },
  {
    id: 'carre-plongeant', name: 'Carré plongeant', alias: 'Bob angulaire · lob', region: 'maroc', gender: 'femme', popularity: 'Très demandé en salon', origin: 'Paris · début du XXe siècle',
    history: 'Le carré moderne est associé au coiffeur parisien Antoine de Paris, qui popularise la coupe courte autour de 1909. Dans les années 1920, les femmes émancipées et les flappers en font un symbole de liberté. Le carré plongeant en est une version plus dynamique.',
    why: 'La longueur devant encadre les joues et la mâchoire. Elle donne de la structure aux visages ronds et cœur.', faces: ['rond', 'coeur', 'ovale'], image: '/images/hero-design.jpg',
  },
  {
    id: 'brushing-wavy', name: 'Brushing wavy', alias: 'Ondulations · brushing souple', region: 'maroc', gender: 'femme', popularity: 'Un grand classique au Maroc', origin: 'Salons de coiffure · années 1970 à aujourd’hui',
    history: 'Le brushing devient un rituel de salon dans les années 1970 et 1980. Les versions souples et ondulées actuelles mélangent la technique du brushing, du fer et la recherche d’un mouvement naturel, très présent dans les tendances marocaines.',
    why: 'Les ondulations apportent du volume sur les côtés et adoucissent les traits. Elles conviennent particulièrement aux visages longs et cœur.', faces: ['long', 'coeur', 'carre'], image: '/images/hero-beard.jpg',
  },
  {
    id: 'bob', name: 'Bob / carré droit', alias: 'Blunt bob · carré court', region: 'monde', gender: 'femme', popularity: 'Parmi les coupes les plus recherchées au monde', origin: 'Paris · 1909 puis années 1920',
    history: 'Le bob court devient un phénomène mondial dans les années 1920. Louise Brooks en fait une image iconique au cinéma. Sa ligne nette revient régulièrement dans la mode car elle donne immédiatement une silhouette forte et graphique.',
    why: 'La ligne droite valorise les visages ovales et cœur. Sur un visage carré, une légère texture ou une longueur sous le menton adoucit l’ensemble.', faces: ['ovale', 'coeur', 'rond'], image: '/images/hero-salon.jpg',
  },
  {
    id: 'butterfly-cut', name: 'Butterfly cut', alias: 'Dégradé papillon · longues mèches', region: 'monde', gender: 'femme', popularity: 'Tendance mondiale des réseaux sociaux', origin: 'Inspirée des années 1970 · popularisée dans les années 2020',
    history: 'Le butterfly cut reprend les grands dégradés des années 1970 et 1990, avec des mèches courtes autour du visage et de longues couches derrière. Les tutoriels vidéo et les réseaux sociaux l’ont propulsé dans les salons du monde entier.',
    why: 'Les mèches qui encadrent le visage permettent d’ajuster la coupe : plus courtes pour allonger un visage rond, plus souples pour équilibrer un visage long.', faces: ['rond', 'long', 'coeur'], image: '/images/hero-fade.jpg',
  },
  {
    id: 'wolf-cut', name: 'Wolf cut', alias: 'Shag-mulet · coupe sauvage', region: 'monde', gender: 'femme', popularity: 'Très populaire dans la Gen Z', origin: 'K-pop, Japon et réseaux sociaux · années 2020',
    history: 'Le wolf cut mélange le volume déstructuré du shag et les longueurs du mulet. Après avoir circulé dans la K-pop, les scènes alternatives et les plateformes vidéo, il devient une des coupes les plus identifiables du début des années 2020.',
    why: 'Ses couches créent du mouvement et cassent la rondeur. Il demande une texture naturelle ou un peu de coiffage.', faces: ['ovale', 'rond', 'long'], image: '/images/hero-design.jpg',
  },
  {
    id: 'shag', name: 'Shag', alias: 'Shaggy · dégradé rock', region: 'monde', gender: 'femme', popularity: 'Un retour fort de la mode vintage', origin: 'États-Unis · années 1970',
    history: 'Le shag apparaît dans les années 1970, porté par la musique rock et le cinéma. Ses couches irrégulières, sa frange légère et son effet volontairement décontracté en ont fait un classique des retours vintage.',
    why: 'La frange et les mèches autour des pommettes donnent de la largeur aux visages longs et adoucissent les mâchoires.', faces: ['long', 'carre', 'ovale'], image: '/images/cut-curls.jpg',
  },
  {
    id: 'pixie', name: 'Pixie', alias: 'Coupe garçonne · short crop', region: 'monde', gender: 'femme', popularity: 'Un court iconique partout dans le monde', origin: 'Années 1950 · Audrey Hepburn et Mia Farrow',
    history: 'La coupe pixie devient célèbre dans les années 1950 avec Audrey Hepburn, puis se réinvente dans les années 1960 avec Mia Farrow. Courte, graphique ou texturée, elle reste liée à une idée de liberté et de confiance.',
    why: 'Elle met les yeux et les pommettes en avant. Les visages ovales et cœur la portent naturellement ; une mèche latérale peut équilibrer un visage carré.', faces: ['ovale', 'coeur', 'carre'], image: '/images/cut-fade-2.jpg',
  },
  {
    id: 'modern-mullet', name: 'Modern mullet', alias: 'Mulet contemporain · soft mullet', region: 'monde', gender: 'homme', popularity: 'Retour mondial revisité', origin: 'Des silhouettes anciennes aux années 1980 puis 2020',
    history: 'Des coiffures avec l’avant court et l’arrière long existent depuis l’Antiquité. Le mulet devient une icône populaire dans les années 1970 et 1980, puis revient dans une version plus douce, texturée et personnalisable au début des années 2020.',
    why: 'Les côtés plus courts et la longueur arrière donnent une ligne verticale aux visages ronds ou courts. Il convient aux personnes qui aiment un style affirmé.', faces: ['rond', 'ovale', 'carre'], image: '/images/hero-fade.jpg',
  },
  {
    id: 'afro-naturel', name: 'Afro naturel', alias: 'Afro · volume naturel', region: 'monde', gender: 'homme', popularity: 'Un style culturel et mondial', origin: 'Diaspora africaine · années 1960 et 1970',
    history: 'L’afro naturel devient un symbole de fierté, d’identité et de mouvement culturel dans les années 1960 et 1970. Aujourd’hui, il célèbre la texture naturelle avec des formes rondes, géométriques ou dégradées, selon le choix de chacun.',
    why: 'Le volume peut être adapté à chaque visage : plus haut pour allonger, plus arrondi pour équilibrer une mâchoire marquée.', faces: ['long', 'ovale', 'carre'], image: '/images/cut-curls.jpg',
  },
];

const REGION_FILTERS = [
  { id: 'tous', label: 'Toutes les tendances' },
  { id: 'maroc', label: 'Populaires au Maroc' },
  { id: 'monde', label: 'Populaires dans le monde' },
] as const;

const GENDER_FILTERS = [
  { id: 'tous', label: 'Homme & Femme' },
  { id: 'homme', label: 'Homme' },
  { id: 'femme', label: 'Femme' },
] as const;

export function InspirationExplorer() {
  const [region, setRegion] = useState<(typeof REGION_FILTERS)[number]['id']>('tous');
  const [gender, setGender] = useState<(typeof GENDER_FILTERS)[number]['id']>('tous');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const visibleStyles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return STYLES.filter((style) => {
      const matchesRegion = region === 'tous' || style.region === region;
      const matchesGender = gender === 'tous' || style.gender === gender;
      const matchesQuery = !normalizedQuery || [style.name, style.alias, style.origin, ...style.faces.map((face) => FACE_LABELS[face])].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesRegion && matchesGender && matchesQuery;
    });
  }, [gender, query, region]);

  return (
    <>
      <section className="inspiration-hero-new">
        <div className="inspiration-hero-image"><Image src="/images/hero-design.jpg" fill alt="Inspiration coiffure HLAQTI" priority sizes="100vw" /></div>
        <div className="inspiration-hero-overlay" />
        <div className="container inspiration-hero-content-new">
          <span className="section-kicker">GUIDE STYLE · MAROC & MONDE</span>
          <h1>La bonne coupe<br /><em>change tout.</em></h1>
          <p>Découvre les coiffures les plus demandées, leur histoire et la forme de visage qui les met le mieux en valeur.</p>
          <a className="inspiration-hero-link" href="#guide-coupes">Explorer le guide <ArrowRight size={16} /></a>
        </div>
        <div className="inspiration-hero-stamp"><Sparkles size={16} /><span><b>Sélection éditoriale</b><small>Styles vus dans les salons marocains et les tendances mondiales</small></span></div>
      </section>

      <section className="inspiration-guide" id="guide-coupes">
        <div className="container">
          <div className="inspiration-guide-head">
            <div><span className="section-kicker">LE GUIDE DES COUPES</span><h2>Nom, histoire, visage.</h2><p>Une fiche claire pour trouver l’inspiration avant de réserver.</p></div>
            <div className="inspiration-count"><b>{visibleStyles.length}</b><span>style{visibleStyles.length > 1 ? 's' : ''} affiché{visibleStyles.length > 1 ? 's' : ''}</span></div>
          </div>

          <div className="inspiration-toolbar">
            <div className="inspiration-tabs" role="tablist" aria-label="Origine des coiffures">
              {REGION_FILTERS.map((item) => <button type="button" role="tab" aria-selected={region === item.id} className={region === item.id ? 'active' : ''} key={item.id} onClick={() => { setRegion(item.id); setOpenId(null); }}>{item.label}</button>)}
            </div>
            <div className="inspiration-toolbar-bottom">
              <div className="inspiration-gender-tabs" role="tablist" aria-label="Type de coiffure">{GENDER_FILTERS.map((item) => <button type="button" role="tab" aria-selected={gender === item.id} className={gender === item.id ? 'active' : ''} key={item.id} onClick={() => { setGender(item.id); setOpenId(null); }}>{item.label}</button>)}</div>
              <label className="inspiration-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une coupe…" aria-label="Rechercher une coupe" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche">×</button>}</label>
            </div>
          </div>

          {visibleStyles.length ? <div className="inspiration-style-grid">{visibleStyles.map((style, index) => {
            const expanded = openId === style.id;
            return <article className={`inspiration-style-card${expanded ? ' expanded' : ''}`} key={style.id}>
              <div className="inspiration-style-photo"><Image src={style.image} fill alt={style.name} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 280px" /><span className={`inspiration-origin ${style.region}`}>{style.region === 'maroc' ? 'MAROC' : 'MONDE'}</span><b className="inspiration-rank">{String(index + 1).padStart(2, '0')}</b></div>
              <div className="inspiration-style-body"><div className="inspiration-style-meta"><span>{style.gender === 'homme' ? 'HOMME' : 'FEMME'}</span><small>{style.popularity}</small></div><h3>{style.name}</h3><p className="inspiration-alias">{style.alias}</p><p className="inspiration-origin-text">{style.origin}</p><div className="face-tags"><small>Convient aux visages</small><div>{style.faces.map((face) => <span key={face}>{FACE_LABELS[face]}</span>)}</div></div><div className="inspiration-card-actions"><button type="button" className="history-toggle" onClick={() => setOpenId(expanded ? null : style.id)}><BookOpen size={14} /> {expanded ? 'Fermer l’histoire' : 'Lire son histoire'} <ChevronDown className={expanded ? 'up' : ''} size={14} /></button><Link href="/salons">Trouver un salon <ArrowRight size={13} /></Link></div>{expanded && <div className="inspiration-story"><p>{style.history}</p><strong>Pourquoi elle fonctionne</strong><p>{style.why}</p><Link href={style.service ? `/recherche?service=${encodeURIComponent(style.service)}` : '/salons'}>Voir les salons qui proposent ce style <ArrowRight size={13} /></Link></div>}</div>
            </article>;
          })}</div> : <div className="inspiration-no-results"><Search size={25} /><h3>Aucune coupe ne correspond</h3><p>Essaie « fade », « carré », « boucles » ou enlève un filtre.</p><button type="button" onClick={() => { setQuery(''); setRegion('tous'); setGender('tous'); }}>Réinitialiser</button></div>}
        </div>
      </section>

      <section className="face-guide-section" id="visage">
        <div className="container"><div className="face-guide-heading"><span className="section-kicker">AVANT DE CHOISIR</span><h2>Quel est ton type de visage ?</h2><p>Ce sont des repères, pas des règles : la meilleure coupe reste celle dans laquelle tu te sens bien.</p></div><div className="face-guide-grid">{Object.entries(FACE_LABELS).map(([id, label]) => <article key={id} className="face-guide-card"><div className={`face-shape face-${id}`}><span /></div><div><h3>Visage {label.toLowerCase()}</h3><p>{id === 'ovale' ? 'Équilibré : presque toutes les coupes fonctionnent.' : id === 'rond' ? 'Ajoute de la hauteur et évite un volume trop large sur les côtés.' : id === 'carre' ? 'Les textures et les lignes souples peuvent adoucir la mâchoire.' : id === 'long' ? 'Privilégie le volume latéral et évite de trop allonger le dessus.' : 'Une frange ou des mèches autour du visage créent un bel équilibre.'}</p><span className="face-recommendation"><Check size={13} /> {id === 'ovale' ? 'Fade, bob, pixie' : id === 'rond' ? 'Taper, shag, butterfly' : id === 'carre' ? 'Side part, shag, pixie' : id === 'long' ? 'Curly top, afro, wavy' : 'Carré, pixie, butterfly'}</span></div></article>)}</div></div>
      </section>
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, ChevronDown, ExternalLink, Search, Scissors, Sparkles } from 'lucide-react';

type Region = 'maroc' | 'monde';
type FaceShape = 'ovale' | 'rond' | 'carre' | 'long' | 'coeur';
type DiagramKind = 'fade' | 'taper' | 'crop' | 'buzz' | 'crew' | 'sidepart' | 'pompadour' | 'undercut' | 'mullet' | 'afro' | 'locs' | 'hightop';

type Measurements = {
  sides: string;
  top: string;
  nape: string;
  finish: string;
};

type Inspiration = {
  id: string;
  name: string;
  alias: string;
  region: Region;
  popularity: string;
  origin: string;
  firstKnown: string;
  history: string;
  why: string;
  faces: FaceShape[];
  image: string;
  diagram: DiagramKind;
  measurements: Measurements;
  sourceUrl: string;
  sourceLabel: string;
  service?: string;
};

const FACE_LABELS: Record<FaceShape, string> = {
  ovale: 'Ovale',
  rond: 'Rond',
  carre: 'Carré',
  long: 'Long',
  coeur: 'Cœur',
};

// Les mentions « première fois » restent prudentes : pour la majorité des
// coupes modernes, aucun inventeur unique n'est documenté. On distingue donc
// la première trace connue du coiffeur ou de la personne qui a popularisé le style.
const STYLES: Inspiration[] = [
  {
    id: 'degrade-americain', name: 'Dégradé américain', alias: 'Fade · skin fade · high fade', region: 'maroc', popularity: 'Très demandé au Maroc', origin: 'États-Unis · années 1940–1950 puis barbershops afro-américains',
    firstKnown: 'Aucun inventeur unique n’est identifié. Le fondu moderne s’est construit par étapes : le high-and-tight militaire a posé la base, puis des barbiers noirs américains ont perfectionné le mélange et les contours dans les années 1980–1990.',
    history: 'Le mot fade décrit une technique, pas une coupe unique : la longueur disparaît progressivement jusqu’à la peau ou presque. Les coupes militaires de l’après-guerre ont popularisé le contraste court sur les côtés. Ensuite, les barbershops afro-américains ont transformé ce contraste en un travail de précision, avec des transitions propres, des line-ups et des variations low, mid, high et skin fade. Le style est arrivé dans les salons du monde entier par le hip-hop, le sport et les réseaux sociaux.',
    why: 'Le fondu libère les côtés et donne une ligne nette. La hauteur du dégradé se choisit selon la forme du visage et la densité des cheveux.', faces: ['ovale', 'carre', 'long'], image: '/images/cut-fade.jpg', diagram: 'fade', service: 'degrade-americain',
    measurements: { sides: '0 → 6 mm', top: '4 → 7 cm', nape: 'fondu à blanc', finish: 'contours nets' }, sourceUrl: 'https://www.kctv5.com/2024/02/09/kc-barber-weighs-real-origin-fade-haircut-creating-buzz-online/', sourceLabel: 'KCTV5 · origine du fade',
  },
  {
    id: 'taper-fade', name: 'Taper fade', alias: 'Low taper · temple taper', region: 'maroc', popularity: 'Un favori des jeunes Marocains', origin: 'Tradition du barbering américain · évolution contemporaine',
    firstKnown: 'Il n’existe pas de premier coiffeur confirmé. Le taper vient de la technique classique qui raccourcit progressivement les tempes et la nuque, sans effacer tous les côtés comme un skin fade.',
    history: 'Le taper est une évolution naturelle du short back and sides : le barbier crée une transition progressive autour des oreilles, des tempes et de la nuque. Le terme s’est imposé dans le vocabulaire américain du barbering, puis la version taper fade a été popularisée par les barbiers urbains, les sportifs et les créateurs de contenu. Il est devenu une demande internationale parce qu’il garde un aspect propre sans être aussi radical qu’un dégradé à blanc.',
    why: 'Il laisse de la matière sur les côtés. C’est une option équilibrée pour un visage rond ou cœur et pour ceux qui veulent une coupe facile à entretenir.', faces: ['ovale', 'rond', 'coeur'], image: '/images/cut-taper-2.jpg', diagram: 'taper', service: 'taper-fade',
    measurements: { sides: '3 → 12 mm', top: '5 → 8 cm', nape: 'nuque fondue', finish: 'tempes douces' }, sourceUrl: 'https://www.fashionbeans.com/article/taper-fade-haircuts/', sourceLabel: 'FashionBeans · taper fade',
  },
  {
    id: 'curly-top', name: 'Curly top dégradé', alias: 'Curly fade · boucles texturées', region: 'maroc', popularity: 'Très demandé pour cheveux bouclés', origin: 'Barbershops · textures afro et méditerranéennes',
    firstKnown: 'Ce n’est pas une invention attribuée à une personne. C’est la rencontre entre la mise en forme des boucles naturelles et la technique du dégradé, perfectionnée dans de nombreux barbershops.',
    history: 'Les cheveux bouclés ont toujours été coiffés en respectant leur texture. La version actuelle associe un dessus conservé long, parfois défini à la crème, à des côtés plus courts. Les barbiers ont développé des méthodes adaptées à chaque boucle : ne pas trop désépaissir, travailler sur cheveux secs et préserver le ressort naturel. Les vidéos de barbering ont rendu cette coupe très populaire au Maroc et à l’international.',
    why: 'Le volume peut être placé au-dessus pour allonger un visage rond ou sur les côtés pour équilibrer un visage long. La coupe doit suivre le mouvement réel de la boucle.', faces: ['rond', 'carre', 'long'], image: '/images/cut-curls.jpg', diagram: 'fade', service: 'degrade-americain',
    measurements: { sides: '0,5 → 12 mm', top: '6 → 10 cm', nape: 'fondu naturel', finish: 'boucles définies' }, sourceUrl: 'https://www.allthingshair.com/en-us/mens-hairstyles/curly-hairstyles/', sourceLabel: 'All Things Hair · cheveux bouclés',
  },
  {
    id: 'french-crop', name: 'French crop / coupe César', alias: 'Frange courte · Caesar crop', region: 'maroc', popularity: 'Très présent dans les demandes de coupe homme', origin: 'Référence à la Rome antique · retour moderne dans les années 1990',
    firstKnown: 'Le nom César renvoie à Jules César, mais rien ne prouve qu’il ait inventé une coupe codifiée. L’association vient de récits antiques sur ses cheveux ramenés vers le front et de ses bustes, puis la version moderne a été popularisée à la télévision par George Clooney dans les années 1990.',
    history: 'La coupe César actuelle est courte, brossée vers l’avant, avec une petite frange horizontale. Elle s’inspire des représentations de l’empereur romain et des coupes courtes européennes. Son retour moderne dans les années 1990 a donné naissance au French crop : côtés dégradés, dessus texturé et frange plus souple. Elle reste populaire parce qu’elle fonctionne avec peu de coiffage et peut accompagner une ligne de cheveux qui recule.',
    why: 'La frange réduit visuellement la hauteur du front. Une texture irrégulière adoucit un visage carré, tandis qu’un crop plus court structure un visage ovale.', faces: ['ovale', 'carre', 'long'], image: '/images/hero-fade.jpg', diagram: 'crop', service: 'degrade-americain',
    measurements: { sides: '0,5 → 12 mm', top: '2 → 5 cm', nape: 'taper court', finish: 'frange texturée' }, sourceUrl: 'https://www.salerm.com/us_en/blog/looks-homme/french-crop-men-cut', sourceLabel: 'Salerm · French crop',
  },
  {
    id: 'buzz-cut', name: 'Buzz cut / coupe militaire', alias: 'Induction cut · tondeuse uniforme', region: 'maroc', popularity: 'Simple, net et toujours demandé', origin: 'Europe et institutions militaires · XIXe–XXe siècles',
    firstKnown: 'Nikola Bizumić, inventeur serbe, est généralement crédité pour les premières tondeuses manuelles du XIXe siècle. Il n’a pas inventé la coupe elle-même : les coupes courtes existaient déjà, mais son outil les a rendues rapides et régulières.',
    history: 'Le buzz cut tire son nom du bruit de la tondeuse. Les premières tondeuses manuelles ont facilité la coupe uniforme, puis les armées l’ont adoptée pour l’hygiène, la rapidité et le port du casque. Au XXe siècle, la coupe d’incorporation et les variantes 0, 1, 2 ou 3 sont devenues reconnaissables partout. Aujourd’hui, un barbier peut garder une légère différence de longueur pour mieux dessiner le crâne.',
    why: 'La coupe révèle les proportions du crâne et du visage. Une longueur 2 ou 3 est plus douce qu’un zéro et convient mieux aux cheveux clairsemés.', faces: ['ovale', 'carre', 'rond'], image: '/images/hero-salon.jpg', diagram: 'buzz',
    measurements: { sides: '3 à 9 mm', top: '3 à 9 mm', nape: 'même longueur', finish: 'ligne naturelle' }, sourceUrl: 'https://pauledmonds.com/blogs/blog/the-ultimate-guide-to-the-classic-men-s-haircut', sourceLabel: 'Paul Edmonds · buzz cut',
  },
  {
    id: 'crew-cut', name: 'Crew cut / Ivy League', alias: 'Coupe à la brosse · brush cut', region: 'monde', popularity: 'Un classique homme international', origin: 'Équipes d’aviron de Yale et Harvard · années 1920',
    firstKnown: 'La première association documentée est avec les équipes d’aviron américaines : le nom crew cut aurait décrit une coupe courte qui ne tombe pas devant les yeux pendant la course. L’attribution à John “Jock” Whitney existe, mais elle reste discutée : aucun premier barbier n’est confirmé.',
    history: 'Les rameurs avaient besoin d’une coupe pratique lorsque leurs deux mains tenaient les avirons. La coupe s’est diffusée dans les universités américaines, puis dans l’armée pendant la Seconde Guerre mondiale. Dans les années 1950, elle est devenue le symbole d’un style propre et sportif. L’Ivy League garde un peu plus de longueur sur le dessus et se coiffe facilement sur le côté.',
    why: 'Le dessus légèrement plus long donne de la hauteur sans élargir les joues. C’est une bonne base pour un visage ovale, carré ou long.', faces: ['ovale', 'carre', 'long'], image: '/images/cut-fade-2.jpg', diagram: 'crew',
    measurements: { sides: '6 → 15 mm', top: '2,5 → 5 cm', nape: 'taper court', finish: 'dessus brossé' }, sourceUrl: 'https://en.wikipedia.org/wiki/Crew_cut', sourceLabel: 'Historique documenté · crew cut',
  },
  {
    id: 'side-part', name: 'Side part / raie de côté', alias: 'Classic side part · gentleman cut', region: 'monde', popularity: 'Un intemporel dans tous les pays', origin: 'Europe et États-Unis · popularité des années 1920',
    firstKnown: 'Aucun premier coiffeur n’est identifié. La raie de côté est une manière de coiffer les cheveux qui apparaît dans de nombreux portraits et devient particulièrement populaire avec les coupes masculines courtes des années 1920.',
    history: 'Avec l’arrivée des cheveux courts et des produits de coiffage au début du XXe siècle, la raie de côté est devenue une finition régulière du barbering. Elle a traversé le cinéma, les bureaux, les écoles et les vestiaires sportifs. Les versions actuelles mélangent ciseaux sur le dessus, taper sur les côtés et finition mate plutôt que brillante.',
    why: 'La ligne diagonale structure le visage. Une raie souple peut allonger un visage rond et une longueur plus naturelle adoucit une mâchoire carrée.', faces: ['ovale', 'rond', 'carre'], image: '/images/hero-salon.jpg', diagram: 'sidepart',
    measurements: { sides: '6 → 15 mm', top: '5 → 9 cm', nape: 'taper doux', finish: 'raie naturelle' }, sourceUrl: 'https://www.artofmanliness.com/style/hair/the-side-part-hairstyle/', sourceLabel: 'The Art of Manliness · side part',
  },
  {
    id: 'pompadour', name: 'Pompadour homme', alias: 'Rockabilly · Elvis cut', region: 'monde', popularity: 'Le grand classique rétro toujours revisité', origin: 'France · XVIIIe siècle puis rock’n’roll américain des années 1950',
    firstKnown: 'La coiffure porte le nom de Madame de Pompadour, qui l’a rendue célèbre à la cour de Louis XV. La version masculine n’a pas été créée par Elvis Presley, mais Elvis l’a popularisée mondialement dans les années 1950.',
    history: 'Le pompadour original était volumineux et porté à la cour française au XVIIIe siècle. Au XXe siècle, la forme a été adaptée pour les hommes avec des côtés plus courts, une mèche relevée et un coiffage vers l’arrière. Elvis Presley, Johnny Cash et les musiciens rockabilly en ont fait une image de rébellion et de style. Les versions modernes associent souvent pompadour et taper fade.',
    why: 'La hauteur du dessus allonge un visage rond. Pour un visage long, il vaut mieux réduire la hauteur et garder plus de largeur sur les côtés.', faces: ['rond', 'ovale', 'carre'], image: '/images/hero-design.jpg', diagram: 'pompadour',
    measurements: { sides: '6 → 18 mm', top: '8 → 12 cm', nape: 'taper ou fade', finish: 'volume arrière' }, sourceUrl: 'https://www.gq-magazine.co.uk/grooming/article/elvis-presley-hair-pompadour', sourceLabel: 'GQ · histoire du pompadour homme',
  },
  {
    id: 'undercut', name: 'Undercut', alias: 'Slick back undercut · disconnected cut', region: 'monde', popularity: 'Un style graphique mondial', origin: 'Europe germanique puis Royaume-Uni · XIXe–XXe siècles',
    firstKnown: 'Il n’existe pas de premier inventeur confirmé. Des versions européennes du XIXe siècle sont associées au “Inselhaarschnitt” allemand, puis la coupe a été portée par des hommes de la classe ouvrière et des gangs britanniques avant ses retours modernes.',
    history: 'L’undercut sépare nettement le dessus long des côtés courts, avec peu ou pas de fondu entre les deux. Il apparaît sous différentes formes en Europe, notamment en Allemagne à la fin du XIXe siècle. Dans les années 1930, les rues de Birmingham et les silhouettes de gangsters l’ont rendu reconnaissable. Le style revient ensuite avec les films, le rock, les looks rétro et les coupes slick back.',
    why: 'La ligne horizontale crée de la largeur. Il convient aux visages longs et ovales ; sur un visage rond, un dessus plus haut et plaqué vers l’arrière affine la silhouette.', faces: ['long', 'ovale', 'rond'], image: '/images/cut-beard-2.jpg', diagram: 'undercut',
    measurements: { sides: '0 → 6 mm', top: '8 → 15 cm', nape: 'déconnectée', finish: 'contraste franc' }, sourceUrl: 'https://www.axe.com/us/en/inspiration/hair/the-edgy-undercut.html', sourceLabel: 'Axe · histoire de l’undercut',
  },
  {
    id: 'mullet', name: 'Modern mullet', alias: 'Mulet contemporain · business front', region: 'monde', popularity: 'Un retour mondial très visible', origin: 'Traces antiques · explosion rock des années 1970–1980',
    firstKnown: 'La plus ancienne description littéraire souvent citée se trouve dans l’Iliade d’Homère : les Abantes y sont décrits avec le devant court et les cheveux longs derrière. Pour le retour moderne, David Bowie a joué un rôle majeur avec son look Ziggy Stardust en 1972.',
    history: 'Le principe du devant court et de l’arrière long a existé dans plusieurs cultures, parfois pour dégager les yeux tout en gardant le cou protégé. Le mot et la silhouette moderne se diffusent dans la musique rock des années 1970 et 1980. Le modern mullet actuel est plus texturé, moins uniforme et souvent associé à un taper ou un burst fade.',
    why: 'La longueur arrière donne une ligne verticale aux visages ronds. Un dessus texturé et des côtés maîtrisés peuvent aussi équilibrer un visage carré.', faces: ['rond', 'ovale', 'carre'], image: '/images/hero-fade.jpg', diagram: 'mullet',
    measurements: { sides: '6 → 20 mm', top: '5 → 10 cm', nape: '8 → 15 cm', finish: 'longueur arrière' }, sourceUrl: 'https://www.czechcenter.org/blog/2020/9/23/the-mullet-likely-the-most-infamous-haircut-of-all', sourceLabel: 'Czech Center Museum · histoire du mullet',
  },
  {
    id: 'afro-naturel', name: 'Afro naturel homme', alias: 'Natural afro · rounded afro', region: 'monde', popularity: 'Un style culturel et mondial', origin: 'Traditions africaines puis mouvement Black Power des années 1960–1970',
    firstKnown: 'Il n’y a pas de premier créateur : le volume afro vient de textures naturelles et de traditions anciennes. Le mouvement Black Power a popularisé l’afro comme symbole visible de fierté et d’identité dans les années 1960–1970.',
    history: 'Les cheveux naturellement crépus ont été portés et façonnés de nombreuses manières en Afrique bien avant la mode contemporaine. Aux États-Unis, l’afro devient particulièrement visible dans les mouvements de fierté noire avec le message “Black is beautiful”. Aujourd’hui, il peut être rond, carré, haut, court ou combiné à un dégradé : la forme est décidée avec la texture et le souhait du client.',
    why: 'Le volume se place selon le visage : plus haut pour un visage long, plus arrondi pour une mâchoire carrée. L’entretien hydratation et rétrécissement doit être expliqué avant la coupe.', faces: ['long', 'ovale', 'carre'], image: '/images/cut-curls.jpg', diagram: 'afro',
    measurements: { sides: '6 → 25 mm', top: '5 → 12 cm', nape: 'naturelle ou taper', finish: 'volume équilibré' }, sourceUrl: 'https://kids.britannica.com/scholars/article/African-Americans/477096', sourceLabel: 'Britannica · afro et Black pride',
  },
  {
    id: 'locs', name: 'Locs / locks homme', alias: 'Dreadlocks · mèches verrouillées', region: 'monde', popularity: 'Une coiffure mondiale à forte histoire culturelle', origin: 'Plusieurs cultures anciennes · Rastafari et reggae au XXe siècle',
    firstKnown: 'Aucun premier porteur n’est connu : les locks sont apparues indépendamment dans plusieurs cultures. Des traces anciennes existent en Égypte et dans la civilisation minoenne. Dans le monde moderne, Bob Marley a fortement popularisé l’image des locs par le reggae et le mouvement Rastafari.',
    history: 'Les locs se forment par torsion, enroulement, tressage ou croissance contrôlée. Des représentations et des restes archéologiques montrent des cheveux verrouillés dans plusieurs sociétés anciennes. Le mouvement Rastafari, né en Jamaïque dans les années 1930, leur a donné une portée spirituelle et politique particulière. Il est préférable de dire “locs” lorsque l’on veut éviter une étymologie ressentie comme péjorative par certaines personnes.',
    why: 'La longueur et le volume changent fortement la silhouette. Les locs attachées en hauteur peuvent allonger un visage rond ; une longueur latérale équilibre un visage long. Le diagnostic du cuir chevelu et du poids est essentiel.', faces: ['ovale', 'rond', 'long'], image: '/images/hero-beard.jpg', diagram: 'locs',
    measurements: { sides: 'selon la longueur', top: '8 → 30 cm+', nape: 'libre ou attachée', finish: 'sections régulières' }, sourceUrl: 'https://www.britannica.com/topic/dreadlocks', sourceLabel: 'Britannica · histoire des locs',
  },
  {
    id: 'hi-top-fade', name: 'Hi-top fade', alias: 'High-top · flat-top fade', region: 'monde', popularity: 'Icône de la culture hip-hop', origin: 'Communautés afro-américaines · années 1980–1990',
    firstKnown: 'Aucun barbier unique n’est confirmé. Grace Jones a offert un précurseur très visible en 1980, puis des barbiers et artistes comme Larry Blackmon, Schoolly D et Doug E. Fresh ont contribué à rendre la forme géométrique célèbre dans la culture hip-hop.',
    history: 'Le hi-top reprend le flat top militaire et le transforme en architecture capillaire : côtés très courts, dessus haut et parfois parfaitement carré. Il se développe dans les communautés afro-américaines au milieu des années 1980 et devient un symbole de la New Jack Swing et de l’âge d’or du hip-hop. Les versions actuelles sont souvent plus basses, texturées et portées avec un fade.',
    why: 'La hauteur attire le regard vers le haut et allonge un visage rond. Pour un visage long, un hi-top plus bas et plus large est plus équilibré.', faces: ['rond', 'ovale', 'carre'], image: '/images/hero-design.jpg', diagram: 'hightop',
    measurements: { sides: '0 → 6 mm', top: '5 → 15 cm', nape: 'fade net', finish: 'forme carrée' }, sourceUrl: 'https://en.wikipedia.org/wiki/Hi-top_fade', sourceLabel: 'Historique documenté · hi-top fade',
  },
];

const REGION_FILTERS = [
  { id: 'tous', label: 'Toutes les coupes homme' },
  { id: 'maroc', label: 'Demandées au Maroc' },
  { id: 'monde', label: 'Célèbres dans le monde' },
] as const;

const FACE_FILTERS: { id: 'tous' | FaceShape; label: string }[] = [
  { id: 'tous', label: 'Tous les visages' },
  { id: 'ovale', label: 'Ovale' },
  { id: 'rond', label: 'Rond' },
  { id: 'carre', label: 'Carré' },
  { id: 'long', label: 'Long' },
  { id: 'coeur', label: 'Cœur' },
];

function HairDiagram({ style }: { style: Inspiration }) {
  const paths: Record<DiagramKind, string> = {
    fade: 'M54 74 Q58 42 100 40 Q142 42 146 74 L137 94 L63 94 Z',
    taper: 'M55 78 Q62 45 100 42 Q138 45 145 78 L132 93 L68 93 Z',
    crop: 'M54 74 Q58 43 100 41 Q142 43 146 74 L139 94 L61 94 Z',
    buzz: 'M58 79 Q62 47 100 45 Q138 47 142 79 L132 91 L68 91 Z',
    crew: 'M55 78 Q61 43 100 39 Q139 43 145 78 L133 94 L67 94 Z',
    sidepart: 'M54 76 Q58 43 100 39 Q143 43 146 76 L137 94 L63 94 Z',
    pompadour: 'M52 76 Q55 30 100 25 Q145 30 148 76 L137 94 L63 94 Z',
    undercut: 'M51 77 Q54 37 100 30 Q146 37 149 77 L138 94 L62 94 Z',
    mullet: 'M56 72 Q63 43 100 41 Q137 43 144 72 L160 105 L40 105 Z',
    afro: 'M43 79 Q43 26 100 22 Q157 26 157 79 L144 99 L56 99 Z',
    locs: 'M49 77 Q54 39 100 39 Q146 39 151 77 L161 109 L39 109 Z',
    hightop: 'M54 74 L61 27 L139 27 L146 74 L137 94 L63 94 Z',
  };
  const labels: Record<DiagramKind, string> = {
    fade: 'fondu progressif', taper: 'transition douce', crop: 'frange courte', buzz: 'même longueur', crew: 'dessus brossé', sidepart: 'raie de côté', pompadour: 'volume arrière', undercut: 'contraste séparé', mullet: 'arrière long', afro: 'volume naturel', locs: 'sections de locs', hightop: 'dessus géométrique',
  };
  return <div className="cut-diagram" aria-label={`Dessin explicatif de la taille : ${style.name}`}><div className="cut-diagram-visual"><svg viewBox="0 0 200 130" role="img"><title>{`Schéma de taille : ${style.name}`}</title><path className={`diagram-hair diagram-${style.diagram}`} d={paths[style.diagram]} /><ellipse className="diagram-head" cx="100" cy="76" rx="35" ry="48" /><path className="diagram-face-line" d="M85 78 Q100 88 115 78" /><path className="diagram-side-line" d="M58 78 L39 78" /><path className="diagram-side-line" d="M142 78 L161 78" /><text x="6" y="74">côtés</text><text x="163" y="74">nuque</text><text x="72" y="119">dessus</text></svg></div><div className="cut-diagram-caption"><span><i className="diagram-gold-dot" /> {labels[style.diagram]}</span><small>Schéma indicatif — le barbier adapte aux cheveux</small></div><div className="cut-measurements"><span><b>Côtés</b>{style.measurements.sides}</span><span><b>Dessus</b>{style.measurements.top}</span><span><b>Nuque</b>{style.measurements.nape}</span></div></div>;
}

export function InspirationExplorer() {
  const [region, setRegion] = useState<(typeof REGION_FILTERS)[number]['id']>('tous');
  const [face, setFace] = useState<'tous' | FaceShape>('tous');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const visibleStyles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return STYLES.filter((style) => {
      const matchesRegion = region === 'tous' || style.region === region;
      const matchesFace = face === 'tous' || style.faces.includes(face);
      const matchesQuery = !normalizedQuery || [style.name, style.alias, style.origin, style.firstKnown, ...style.faces.map((item) => FACE_LABELS[item])].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesRegion && matchesFace && matchesQuery;
    });
  }, [face, query, region]);

  function resetFilters() {
    setRegion('tous');
    setFace('tous');
    setQuery('');
    setOpenId(null);
  }

  return (
    <>
      <section className="inspiration-hero-new">
        <div className="inspiration-hero-image"><Image src="/images/hero-design.jpg" fill alt="Inspiration coiffure homme HLAQTI" priority sizes="100vw" /></div>
        <div className="inspiration-hero-overlay" />
        <div className="container inspiration-hero-content-new">
          <span className="section-kicker">GUIDE COIFFURE HOMME · MAROC & MONDE</span>
          <h1>Les coupes homme<br /><em>ont une histoire.</em></h1>
          <p>Découvre l’origine réelle des styles, les personnes qui les ont popularisés, la taille à demander au barbier et les formes de visage qui les mettent en valeur.</p>
          <a className="inspiration-hero-link" href="#guide-coupes">Explorer le guide <ArrowRight size={16} /></a>
        </div>
        <div className="inspiration-hero-stamp"><Scissors size={16} /><span><b>100 % coiffures homme</b><small>Du fade marocain aux icônes mondiales du barbering</small></span></div>
      </section>

      <section className="inspiration-guide" id="guide-coupes">
        <div className="container">
          <div className="inspiration-guide-head"><div><span className="section-kicker">ARTICLE PAR ARTICLE</span><h2>Nom, histoire, taille, visage.</h2><p>Chaque fiche distingue ce qui est documenté de ce qui relève de la popularisation.</p></div><div className="inspiration-count"><b>{visibleStyles.length}</b><span>coupe{visibleStyles.length > 1 ? 's' : ''} homme affichée{visibleStyles.length > 1 ? 's' : ''}</span></div></div>

          <div className="inspiration-toolbar">
            <div className="inspiration-tabs" role="tablist" aria-label="Origine des coiffures homme">{REGION_FILTERS.map((item) => <button type="button" role="tab" aria-selected={region === item.id} className={region === item.id ? 'active' : ''} key={item.id} onClick={() => { setRegion(item.id); setOpenId(null); }}>{item.label}</button>)}</div>
            <div className="inspiration-toolbar-bottom"><div className="inspiration-face-tabs" role="tablist" aria-label="Forme de visage">{FACE_FILTERS.map((item) => <button type="button" role="tab" aria-selected={face === item.id} className={face === item.id ? 'active' : ''} key={item.id} onClick={() => { setFace(item.id); setOpenId(null); }}>{item.label}</button>)}</div><label className="inspiration-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une coupe homme…" aria-label="Rechercher une coupe homme" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche">×</button>}</label></div>
          </div>

          {visibleStyles.length ? <div className="inspiration-style-grid">{visibleStyles.map((style, index) => {
            const expanded = openId === style.id;
            return <article className={`inspiration-style-card${expanded ? ' expanded' : ''}`} key={style.id}>
              <div className="inspiration-style-photo"><Image src={style.image} fill alt={`Exemple ${style.name}`} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 280px" /><span className={`inspiration-origin ${style.region}`}>{style.region === 'maroc' ? 'MAROC' : 'MONDE'}</span><b className="inspiration-rank">{String(index + 1).padStart(2, '0')}</b></div>
              <div className="inspiration-style-body"><div className="inspiration-style-meta"><span>HOMME</span><small>{style.popularity}</small></div><h3>{style.name}</h3><p className="inspiration-alias">{style.alias}</p><p className="inspiration-origin-text">{style.origin}</p><div className="history-fact"><BookOpen size={13} /><span><b>Première trace / personne associée</b><small>{style.firstKnown}</small></span></div><div className="face-tags"><small>Convient aux visages</small><div>{style.faces.map((item) => <span key={item}>{FACE_LABELS[item]}</span>)}</div></div><HairDiagram style={style} /><div className="inspiration-card-actions"><button type="button" className="history-toggle" onClick={() => setOpenId(expanded ? null : style.id)}><BookOpen size={14} /> {expanded ? 'Fermer l’article' : 'Lire l’article complet'} <ChevronDown className={expanded ? 'up' : ''} size={14} /></button><Link href={style.service ? `/recherche?service=${encodeURIComponent(style.service)}` : '/salons'}>Trouver un barbier <ArrowRight size={13} /></Link></div>{expanded && <div className="inspiration-story inspiration-article"><h4>Histoire réelle</h4><p>{style.history}</p><h4>Pourquoi cette coupe fonctionne</h4><p>{style.why}</p><a className="inspiration-source" href={style.sourceUrl} target="_blank" rel="noreferrer">Source de vérification : {style.sourceLabel} <ExternalLink size={12} /></a></div>}</div>
            </article>;
          })}</div> : <div className="inspiration-no-results"><Search size={25} /><h3>Aucune coupe ne correspond</h3><p>Essaie « fade », « Caesar », « barbe » ou enlève un filtre.</p><button type="button" onClick={resetFilters}>Réinitialiser</button></div>}
        </div>
      </section>

      <section className="face-guide-section" id="visage"><div className="container"><div className="face-guide-heading"><span className="section-kicker">AVANT DE CHOISIR</span><h2>Quel est ton type de visage ?</h2><p>Ce sont des repères, pas des règles : la meilleure coupe reste celle dans laquelle tu te sens bien.</p></div><div className="face-guide-grid">{Object.entries(FACE_LABELS).map(([id, label]) => <article key={id} className="face-guide-card"><div className={`face-shape face-${id}`}><span /></div><div><h3>Visage {label.toLowerCase()}</h3><p>{id === 'ovale' ? 'Équilibré : presque toutes les coupes homme fonctionnent.' : id === 'rond' ? 'Ajoute de la hauteur et évite un volume trop large sur les côtés.' : id === 'carre' ? 'Les textures et les lignes souples peuvent adoucir la mâchoire.' : id === 'long' ? 'Privilégie le volume latéral et évite de trop allonger le dessus.' : 'Une frange ou des mèches autour du visage créent un bel équilibre.'}</p><button type="button" className="face-recommendation" onClick={() => { setFace(id as FaceShape); document.getElementById('guide-coupes')?.scrollIntoView({ behavior: 'smooth' }); }}><Check size={13} /> Voir les coupes adaptées <ArrowRight size={12} /></button></div></article>)}</div></div></section>
    </>
  );
}

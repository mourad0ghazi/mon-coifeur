import Link from 'next/link';
import { CutsWall } from '@/components/CutsWall';

export const metadata = { title: 'Inspirations · HLAQTI' };

export default function Inspirations() {
  return (
    <main className="inspirations-page">
      <div className="container inspirations-head">
        <Link href="/" className="back-link">← Accueil</Link>
        <span className="section-kicker">INSPIRATIONS</span>
        <h1>Le mur des coupes.</h1>
        <p>Du vrai travail, par de vrais coiffeurs du Maroc. Filtrez par style.</p>
      </div>
      <CutsWall />
    </main>
  );
}

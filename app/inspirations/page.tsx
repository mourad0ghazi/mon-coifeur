import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { InspirationExplorer } from '@/components/InspirationExplorer';
import { CutsWall } from '@/components/CutsWall';

export const metadata = { title: 'Inspirations · HLAQTI', description: 'Guide des coiffures populaires au Maroc et dans le monde.' };

export default function Inspirations() {
  return (
    <main className="inspirations-page inspirations-redesigned">
      <div className="inner-head"><Header /></div>
      <InspirationExplorer />
      <section className="inspiration-real-wall"><CutsWall /></section>
      <Footer />
    </main>
  );
}

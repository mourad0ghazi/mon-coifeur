import Link from 'next/link';
import { ReactNode } from 'react';
import { Logo } from '@/components/Logo';

export function LegalLayout({ title, kicker, updated, children }: { title: string; kicker: string; updated?: string; children: ReactNode }) {
  return (
    <main className="legal-page">
      <header className="legal-top">
        <div className="container legal-top-inner">
          <Link href="/"><Logo /></Link>
          <nav className="legal-crumbs">
            <Link href="/">Accueil</Link><span>/</span><b>{title}</b>
          </nav>
        </div>
      </header>
      <div className="container legal-wrap">
        <article className="legal-content">
          <span className="section-kicker">{kicker}</span>
          <h1>{title}</h1>
          {updated && <p className="legal-updated">Dernière mise à jour : {updated}</p>}
          {children}
        </article>
        <aside className="legal-side">
          <h4>Sur cette page</h4>
          <nav>
            <Link href="/a-propos">À propos</Link>
            <Link href="/devenir-partenaire">Devenir partenaire</Link>
            <Link href="/aide">Centre d'aide</Link>
            <Link href="/conditions">Conditions d'utilisation</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
          </nav>
        </aside>
      </div>
    </main>
  );
}

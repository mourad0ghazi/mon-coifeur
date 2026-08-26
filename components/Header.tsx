'use client';
import Link from 'next/link';
import { Menu, Search, UserRound, X } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { useState } from 'react';
export function Header(){
 const [open,setOpen]=useState(false);
 return <header className="site-header"><div className="container header-inner"><Logo/><nav className={open?'open':''}>
  <button className="nav-close" onClick={()=>setOpen(false)}><X/></button>
  <Link href="/salons" data-i18n="salons">Salons</Link><Link href="/inspirations" data-i18n="inspirations">Inspirations</Link><Link href="/espace-pro" data-i18n="pro">Espace pro</Link><Link href="/devenir-partenaire" data-i18n="partner">Devenir partenaire</Link>
 </nav><div className="header-actions"><LanguageSwitcher/><Link className="icon-btn login" href="/connexion"><UserRound size={18}/> <span data-i18n="login">Se connecter</span></Link><Link className="btn btn-ghost register-cta" href="/inscription">S'inscrire</Link><Link className="btn btn-primary desktop-cta" href="/reserver/karim" data-i18n="book">Réserver</Link><button className="mobile-search"><Search/></button><button className="menu" onClick={()=>setOpen(true)}><Menu/></button></div></div></header>
}

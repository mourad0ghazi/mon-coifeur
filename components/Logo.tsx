import Link from 'next/link';
export function Logo({compact=false}:{compact?:boolean}) {
 return <Link href="/" className="logo" aria-label="Hlaqti accueil"><span className="logo-mark"><i/><b>H</b></span>{!compact&&<span>HLAQTI<small>حلاقتي</small></span>}</Link>
}

import { NextResponse } from 'next/server';
import { searchSalons, getOpenStatus, QUARTIERS, SERVICES } from '@/lib/salons';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const results = searchSalons({
    q: url.searchParams.get('q') || undefined,
    city: url.searchParams.get('ville') || undefined,
    quartier: url.searchParams.get('quartier') || undefined,
    service: url.searchParams.get('service') || undefined,
    priceMax: url.searchParams.get('prix') ? Number(url.searchParams.get('prix')) : undefined,
    verified: url.searchParams.get('verifie') === '1',
    sort: url.searchParams.get('tri') || 'disponibilite',
    date: url.searchParams.get('date') || undefined,
    openNow: url.searchParams.get('ouvert') === '1',
    latitude: url.searchParams.has('lat') ? Number(url.searchParams.get('lat')) : undefined,
    longitude: url.searchParams.has('lng') ? Number(url.searchParams.get('lng')) : undefined,
    radiusKm: url.searchParams.has('rayon') ? Number(url.searchParams.get('rayon')) : undefined,
  }).map((s) => ({ ...s, openStatus: getOpenStatus(s.hours) }));
  return NextResponse.json({
    data: {
      results,
      count: results.length,
      facets: { quartiers: QUARTIERS, services: SERVICES },
    },
  });
}

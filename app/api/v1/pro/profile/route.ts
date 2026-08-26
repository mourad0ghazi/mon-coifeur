import { NextResponse } from 'next/server';
import { requirePro } from '@/lib/api-guard';
import { getPartnerApplicationByUserId } from '@/lib/platform-store';
import { SALONS } from '@/lib/salon-data';

function fallbackProfile(user: { sub: string; name: string; phone: string }) {
  const salon = SALONS[0];
  return {
    source: 'demo',
    firstName: user.name.split(' ')[0] || user.name,
    lastName: user.name.split(' ').slice(1).join(' '),
    phone: user.phone,
    experience: '10+',
    salonName: salon.name,
    city: salon.city,
    neighborhood: salon.neighborhood,
    address: salon.address,
    landmark: 'Adresse pilote HLAQTI',
    placeId: null,
    latitude: salon.latitude,
    longitude: salon.longitude,
    certificatePhoto: null,
    chairCount: 1,
    staff: [{ name: salon.barberName, specialty: salon.specialties.slice(0, 2).join(' · '), hours: '09:00–21:00' }],
    specialties: salon.specialties,
    serviceCatalog: salon.services.map((service) => ({ name: service.label, price: service.price, duration: service.duration })),
    openingHours: salon.hours.map((hours, index) => ({ day: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][index], on: !hours.closed, open: hours.open == null ? undefined : `${String(Math.floor(hours.open / 60)).padStart(2, '0')}:${String(hours.open % 60).padStart(2, '0')}`, close: hours.close == null ? undefined : `${String(Math.floor(hours.close / 60)).padStart(2, '0')}:${String(hours.close % 60).padStart(2, '0')}` })),
    photos: [salon.image],
    status: 'VALIDE',
    validatedAt: null,
  };
}

export async function GET() {
  const guard = await requirePro();
  if ('error' in guard) return guard.error;
  const application = getPartnerApplicationByUserId(guard.user.sub);
  if (!application) return NextResponse.json({ data: { profile: fallbackProfile(guard.user) } });

  return NextResponse.json({
    data: {
      profile: {
        source: 'partner_application',
        firstName: application.first_name,
        lastName: application.last_name,
        phone: application.phone,
        experience: application.experience,
        salonName: application.salon_name,
        city: application.city,
        neighborhood: application.neighborhood,
        address: application.address,
        landmark: application.landmark,
        placeId: application.place_id,
        latitude: application.latitude,
        longitude: application.longitude,
        certificatePhoto: application.certificate_photo,
        chairCount: application.chair_count,
        staff: application.staff,
        specialties: application.specialties,
        serviceCatalog: application.service_catalog,
        openingHours: application.opening_hours,
        photos: application.photos,
        status: application.status,
        validatedAt: application.validated_at,
      },
    },
  });
}

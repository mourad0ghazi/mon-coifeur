import { SalonDetail } from '@/components/SalonDetail';
import { getOpenStatus, SALONS } from '@/lib/salons';

export const dynamic = 'force-dynamic';

export default function SalonMouad() {
  const salon = SALONS.find((item) => item.slug === 'mouad') || SALONS[0];
  return <SalonDetail salon={salon} status={getOpenStatus(salon.hours)} />;
}

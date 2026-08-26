import { notFound } from 'next/navigation';
import { SalonDetail } from '@/components/SalonDetail';
import { getOpenStatus, SALONS } from '@/lib/salons';

export const dynamic = 'force-dynamic';

export default async function SalonBySlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const salon = SALONS.find((item) => item.slug === slug);
  if (!salon) notFound();
  return <SalonDetail salon={salon} status={getOpenStatus(salon.hours)} />;
}

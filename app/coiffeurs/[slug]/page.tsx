import { notFound } from 'next/navigation';
import { PublicPartnerProfile } from '@/components/PublicPartnerProfile';
import { listPartnerApplications } from '@/lib/platform-store';

export const dynamic = 'force-dynamic';

function publicSlug(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default async function PublicCoiffeurProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const application = listPartnerApplications({ status: 'VALIDE' }).find((item) => publicSlug(item.salon_name) === slug);
  if (!application) notFound();
  return <PublicPartnerProfile application={application} />;
}

import { notFound } from 'next/navigation';
import { PublicPartnerProfile, partnerPublicSlug } from '@/components/PublicPartnerProfile';
import { listPartnerApplications } from '@/lib/platform-store';

export const dynamic = 'force-dynamic';

export default async function PublicCoiffeurProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const application = listPartnerApplications({ status: 'VALIDE' }).find((item) => partnerPublicSlug(item) === slug);
  if (!application) notFound();
  return <PublicPartnerProfile application={application} />;
}

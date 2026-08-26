import { normalizeWhatsapp } from './whatsapp';
import { recordPartnerNotification } from './platform-store';

export type PartnerNotificationResult = {
  status: 'ENVOYE' | 'DEMO_A_ENVOYER' | 'ECHEC';
  notificationId: string;
  providerId?: string | null;
  detail?: string;
};

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function notifyPartnerValidated(application: {
  id: string;
  first_name: string;
  salon_name: string;
  phone: string;
}) : Promise<PartnerNotificationResult> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://hlaqti.ma').replace(/\/$/, '');
  const profileUrl = `${appUrl}/coiffeurs/${slugify(application.salon_name)}`;
  const message = `Salam ${application.first_name}, ton profil ${application.salon_name} a été validé par HLAQTI. Ton profil public : ${profileUrl}. Connecte-toi à ton espace pro pour gérer tes horaires, services, clients et rendez-vous. Bienvenue dans HLAQTI !`;
  const phone = normalizeWhatsapp(application.phone);
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_VALIDATION_TEMPLATE_NAME;

  // Sans identifiants Meta, on garde une notification traçable en mode démo
  // au lieu de prétendre qu'un message externe a été envoyé.
  if (!accessToken || !phoneNumberId) {
    const saved = recordPartnerNotification({
      applicationId: application.id,
      phone,
      type: 'PARTNER_VALIDATED',
      message,
      status: 'DEMO_A_ENVOYER',
    });
    return { status: 'DEMO_A_ENVOYER', notificationId: saved.id, detail: 'Identifiants WhatsApp Business manquants.' };
  }

  try {
    const payload = templateName
      ? {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: { name: templateName, language: { code: 'fr' }, components: [{ type: 'body', parameters: [{ type: 'text', text: application.first_name }, { type: 'text', text: application.salon_name }] }] },
        }
      : { messaging_product: 'whatsapp', to: phone, type: 'text', text: { preview_url: false, body: message } };
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.error?.message || `WhatsApp HTTP ${response.status}`);
    const providerId = result?.messages?.[0]?.id || null;
    const saved = recordPartnerNotification({ applicationId: application.id, phone, type: 'PARTNER_VALIDATED', message, status: 'ENVOYE', providerId, sentAt: new Date().toISOString() });
    return { status: 'ENVOYE', notificationId: saved.id, providerId };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Erreur WhatsApp Business';
    const saved = recordPartnerNotification({ applicationId: application.id, phone, type: 'PARTNER_VALIDATED', message, status: 'ECHEC' });
    return { status: 'ECHEC', notificationId: saved.id, detail };
  }
}

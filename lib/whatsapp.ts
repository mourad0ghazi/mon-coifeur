// WhatsApp helpers — the client may type its number in any format
// (06..., 00212..., +212..., spaces/dots), but wa.me always needs the
// international digits without +, spaces or leading zero.

export function normalizeWhatsapp(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Moroccan local number 0[5-7]...
  if (/^0[5-7]\d{8}$/.test(digits)) digits = '212' + digits.slice(1);
  // Moroccan number without leading 0 (5/6/7 + 8 digits)
  if (/^[5-7]\d{8}$/.test(digits)) digits = '212' + digits;
  return digits;
}

export function whatsappLink(raw: string, message?: string): string {
  const phone = normalizeWhatsapp(raw);
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function formatPhone(raw: string): string {
  const d = normalizeWhatsapp(raw).replace(/^212/, '');
  if (d.length === 9) return `+212 ${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  return raw;
}

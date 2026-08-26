import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSlots } from '@/lib/booking';
import { listBookedSlots } from '@/lib/platform-store';
import { BARBER_HOURS } from '@/lib/barbers';

const querySchema = z.object({
  barberId: z.string().default('karim'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.coerce.number().int().min(5).max(480).default(40),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success)
    return NextResponse.json({ error: 'INVALID_QUERY', details: parsed.error.flatten() }, { status: 400 });
  const { barberId, date, duration } = parsed.data;

  const booked = listBookedSlots(barberId, date).map((x) => ({ startMinutes: x.start, endMinutes: x.end }));

  const target = new Date(date + 'T12:00:00');
  const day = (target.getDay() + 6) % 7;
  const h = BARBER_HOURS[barberId]?.[day] || { open: 9 * 60, close: 21 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 };

  // Jour de repos / fermé → aucun créneau.
  if (h.closed || h.open == null || h.close == null) {
    return NextResponse.json({
      data: { barberId, date, durationMinutes: duration, timezone: 'Africa/Casablanca', slots: [], closed: true },
    });
  }

  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const localParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const minStart =
    date === today
      ? Number(localParts.find((x) => x.type === 'hour')?.value) * 60 +
        Number(localParts.find((x) => x.type === 'minute')?.value) +
        30
      : 0;

  const working = [{ startMinutes: h.open, endMinutes: h.close }];
  const breaks = h.breakStart != null && h.breakEnd != null
    ? [{ startMinutes: h.breakStart, endMinutes: h.breakEnd }] : [];

  const slots = generateSlots({
    working, breaks, booked,
    durationMinutes: duration, gridMinutes: 15, bufferMinutes: 5, minStartMinutes: minStart,
  });

  return NextResponse.json({
    data: { barberId, date, durationMinutes: duration, timezone: 'Africa/Casablanca', slots },
    meta: { generatedAt: new Date().toISOString(), source: 'persistent' },
  });
}

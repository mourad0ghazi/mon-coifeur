import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const MAX_SIZE = 6 * 1024 * 1024; // 6 Mo par photo
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'FORMULAIRE_INVALIDE' }, { status: 400 });

  const files = form.getAll('files').filter((f) => f instanceof File) as File[];
  if (!files.length) return NextResponse.json({ error: 'AUCUN_FICHIER' }, { status: 400 });

  const uploadDir = join(process.cwd(), 'public', 'uploads', 'partners');
  await mkdir(uploadDir, { recursive: true });

  const saved: { url: string; name: string; size: number }[] = [];
  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'TYPE_NON_AUTORISE', name: file.name }, { status: 422 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'FICHIER_TROP_VOLUMINEUX', name: file.name }, { status: 422 });
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const safeName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, safeName), bytes);
    saved.push({ url: `/uploads/partners/${safeName}`, name: file.name, size: file.size });
  }

  return NextResponse.json({ data: { files: saved } }, { status: 201 });
}

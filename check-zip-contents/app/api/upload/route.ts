import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll('files') as File[];
    const singleFile = form.get('file') as File | null;

    const toProcess: File[] = files && files.length > 0
      ? files
      : (singleFile ? [singleFile] : []);

    if (toProcess.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const uploaded = [] as Array<{ url: string; name: string }>;
    for (const file of toProcess) {
      const buf = Buffer.from(await file.arrayBuffer());
      const originalName = file.name || 'upload';
      const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
      const fp = path.join(uploadsDir, unique);
      await fs.writeFile(fp, buf);
      uploaded.push({ url: `/uploads/${unique}`, name: unique });
    }

    return NextResponse.json(toProcess.length === 1 ? uploaded[0] : uploaded);
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}



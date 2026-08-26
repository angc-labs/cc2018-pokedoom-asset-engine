import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get('collectionId');

  try {
    const assets = await prisma.asset.findMany({
      where: {
        userId: user.id,
        ...(collectionId ? { collectionId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Sign in to save assets to the cloud.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, collectionId, kind, name, size, dataUrl, mapData, metadata } = body;

    if (!kind || !name) {
      return NextResponse.json({ error: 'Kind and Name are required' }, { status: 400 });
    }

    if (id) {
      // Upsert
      const existing = await prisma.asset.findUnique({ where: { id } });
      if (existing && existing.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const asset = await prisma.asset.upsert({
        where: { id },
        create: {
          id,
          userId: user.id,
          collectionId: collectionId || null,
          kind,
          name: name.trim(),
          size: size ? Number(size) : null,
          dataUrl: dataUrl || null,
          mapData: typeof mapData === 'object' ? JSON.stringify(mapData) : (mapData || null),
          metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || null),
        },
        update: {
          collectionId: collectionId !== undefined ? collectionId : undefined,
          kind,
          name: name.trim(),
          size: size ? Number(size) : null,
          dataUrl: dataUrl || null,
          mapData: typeof mapData === 'object' ? JSON.stringify(mapData) : (mapData || null),
          metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || null),
        },
      });

      return NextResponse.json({ asset });
    } else {
      const asset = await prisma.asset.create({
        data: {
          userId: user.id,
          collectionId: collectionId || null,
          kind,
          name: name.trim(),
          size: size ? Number(size) : null,
          dataUrl: dataUrl || null,
          mapData: typeof mapData === 'object' ? JSON.stringify(mapData) : (mapData || null),
          metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || null),
        },
      });

      return NextResponse.json({ asset });
    }
  } catch (error) {
    console.error('Error saving asset:', error);
    return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  try {
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 });
    }

    await prisma.asset.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}

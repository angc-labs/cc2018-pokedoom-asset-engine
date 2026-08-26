import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  const { id } = params;

  try {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        assets: true,
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (!collection.isPublic && (!user || collection.userId !== user.id)) {
      return NextResponse.json({ error: 'Unauthorized to view this collection' }, { status: 403 });
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, tags, isPublic } = body;

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        name: name ? name.trim() : existing.name,
        description: description !== undefined ? description?.trim() : existing.description,
        tags: tags !== undefined ? (Array.isArray(tags) ? JSON.stringify(tags) : tags) : existing.tags,
        isPublic: isPublic !== undefined ? !!isPublic : existing.isPublic,
      },
      include: {
        assets: true,
      },
    });

    return NextResponse.json({ collection: updated });
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
    }

    await prisma.collection.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}

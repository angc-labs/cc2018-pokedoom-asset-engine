import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in to access collections.' }, { status: 401 });
  }

  try {
    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      include: {
        assets: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, tags, isPublic } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : (tags || null),
        isPublic: !!isPublic,
      },
      include: {
        assets: true,
      },
    });

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET all workspaces for the current user
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await prisma.workspace.findMany({
        where: { userId: session.userId },
        include: {
            documents: {
                select: { id: true, filename: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ workspaces });
}

// POST create a new workspace
export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || name.trim().length === 0) {
        return NextResponse.json({ error: 'Workspace name is required.' }, { status: 400 });
    }

    const workspace = await prisma.workspace.create({
        data: {
            name: name.trim(),
            userId: session.userId,
        },
        include: { documents: true },
    });

    return NextResponse.json({ workspace }, { status: 201 });
}

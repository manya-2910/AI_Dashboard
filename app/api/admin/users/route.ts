import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSession } from '@/app/lib/auth';

// GET all users (admin only)
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, approved: true, createdAt: true },
    });

    return NextResponse.json({ users });
}

// PATCH approve user (admin only)
export async function PATCH(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, approved } = await req.json();
    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: { approved: approved ?? true },
        select: { id: true, name: true, email: true, approved: true },
    });

    return NextResponse.json({ user });
}

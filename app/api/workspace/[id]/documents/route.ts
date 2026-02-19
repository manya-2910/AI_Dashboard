import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { extractText } from '@/app/lib/document';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = params.id;

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: session.userId },
    });

    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
        return NextResponse.json(
            { error: 'Only PDF and TXT files are allowed.' },
            { status: 400 }
        );
    }

    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size must be under 10MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimetype = file.type || (file.name.endsWith('.txt') ? 'text/plain' : 'application/pdf');

    let extractedText: string;
    try {
        extractedText = await extractText(buffer, mimetype);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Extraction failed';
        return NextResponse.json({ error: msg }, { status: 422 });
    }

    const document = await prisma.document.create({
        data: {
            workspaceId,
            filename: file.name,
            extractedText,
        },
    });

    return NextResponse.json(
        { document: { id: document.id, filename: document.filename, createdAt: document.createdAt } },
        { status: 201 }
    );
}

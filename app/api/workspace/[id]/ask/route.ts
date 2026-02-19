import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { chunkText, retrieveRelevantChunks } from '@/app/lib/chunker';
import { askGroq } from '@/app/lib/groq';
import { webSearch } from '@/app/lib/firecrawl';

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
        include: { documents: { select: { id: true, filename: true, extractedText: true } } },
    });

    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
    }

    const { question, useWebSearch = true } = await req.json();

    if (!question) {
        return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    // Gather relevant chunks from all documents
    interface DocumentChunk {
        filename: string;
        chunk: string;
    }
    const documentChunks: DocumentChunk[] = [];
    const docSources: string[] = [];

    for (const doc of workspace.documents) {
        const chunks = chunkText(doc.extractedText);
        const relevantChunks = retrieveRelevantChunks(chunks, question, 3);

        if (relevantChunks.length > 0) {
            relevantChunks.forEach((chunk) => {
                documentChunks.push({ filename: doc.filename, chunk });
            });
            if (!docSources.includes(doc.filename)) {
                docSources.push(doc.filename);
            }
        }
    }

    // Fallback: if no relevant chunks found, use first chunks from each doc
    if (documentChunks.length === 0 && workspace.documents.length > 0) {
        for (const doc of workspace.documents) {
            const chunks = chunkText(doc.extractedText);
            if (chunks.length > 0) {
                documentChunks.push({ filename: doc.filename, chunk: chunks[0] });
                docSources.push(doc.filename);
            }
        }
    }

    // Run web search in parallel
    const webResults = useWebSearch ? await webSearch(question, 3) : [];

    // Build context
    const docContext = documentChunks
        .map((d) => `[Source: ${d.filename}]\n${d.chunk}`)
        .join('\n\n---\n\n');

    const webContext = webResults
        .map((r) => `[Web Source: ${r.url}]\n${r.content}`)
        .join('\n\n---\n\n');

    const hasDocContext = docContext.trim().length > 0;
    const hasWebContext = webContext.trim().length > 0;

    let fullContext = '';
    if (hasDocContext) fullContext += `## Document Knowledge:\n${docContext}\n\n`;
    if (hasWebContext) fullContext += `## Web Search Results:\n${webContext}`;

    if (!fullContext.trim()) {
        fullContext = 'No context available from documents or web search.';
    }

    const systemPrompt = `You are an expert research assistant with access to document knowledge and real-time web search results.
Answer questions comprehensively using all provided context.
Always cite your sources clearly (documents and/or web URLs).
If the context is insufficient, say so clearly. Do NOT hallucinate.
Structure your answers with clear headings and bullet points when appropriate.`;

    const userMessage = `Context from documents and web search:

${fullContext}

Question: ${question}

Provide a comprehensive, well-structured answer. Reference your sources (document names and/or URLs) in your response.`;

    const answer = await askGroq(systemPrompt, userMessage);

    return NextResponse.json({
        success: true,
        answer,
        sources: {
            documents: docSources,
            web: webResults.map((r) => ({ url: r.url, title: r.title })),
        },
        documentsSearched: workspace.documents.length,
    });
}

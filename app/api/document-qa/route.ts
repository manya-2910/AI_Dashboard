import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth';
import { extractText } from '@/app/lib/document';
import { chunkText, retrieveRelevantChunks } from '@/app/lib/chunker';
import { askGroq } from '@/app/lib/groq';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const question = formData.get('question') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        if (!question) {
            return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'text/plain', 'text/txt'];
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PDF and TXT files are supported.' },
                { status: 400 }
            );
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimetype = file.type || (file.name.endsWith('.txt') ? 'text/plain' : 'application/pdf');

        let extractedText: string;
        try {
            extractedText = await extractText(buffer, mimetype);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to extract text';
            return NextResponse.json({ error: msg }, { status: 422 });
        }

        if (!extractedText || extractedText.trim().length < 50) {
            return NextResponse.json(
                { error: 'Could not extract meaningful text from the document.' },
                { status: 422 }
            );
        }

        // Chunk and retrieve relevant sections
        const chunks = chunkText(extractedText);
        const relevantChunks = retrieveRelevantChunks(chunks, question);

        let context: string;
        let snippets: string[];

        if (relevantChunks.length === 0) {
            // Fallback: use first 3 chunks
            snippets = chunks.slice(0, 3);
            context = snippets.join('\n\n---\n\n');
        } else {
            snippets = relevantChunks;
            context = relevantChunks.join('\n\n---\n\n');
        }

        const systemPrompt = `You are an expert document analyst and question answering assistant.
Answer questions based ONLY on the provided document context.
If the answer cannot be found in the context, clearly state that.
Do NOT hallucinate or add information not present in the context.
Provide clear, well-structured answers with references to specific parts of the document when possible.`;

        const userMessage = `Document Context:
${context}

Question: ${question}

Please provide a comprehensive answer based on the document content above. If the information is not in the document, say so clearly.`;

        const answer = await askGroq(systemPrompt, userMessage);

        return NextResponse.json({
            success: true,
            answer,
            snippets: snippets.slice(0, 3).map((s) => s.slice(0, 500)),
            totalChunks: chunks.length,
            filename: file.name,
        });
    } catch (error) {
        console.error('Document QA error:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}

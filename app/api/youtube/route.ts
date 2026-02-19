import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth';
import { getTranscript } from '@/app/lib/youtube';
import { askGroq } from '@/app/lib/groq';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'YouTube URL is required.' }, { status: 400 });
        }

        let transcript: string;
        try {
            transcript = await getTranscript(url);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch transcript';
            return NextResponse.json({ error: message }, { status: 422 });
        }

        // Truncate transcript if too long (Groq has token limits)
        const truncatedTranscript = transcript.slice(0, 12000);

        const systemPrompt = `You are an expert educational content analyzer and note-taker. 
Your task is to analyze YouTube video transcripts and create comprehensive, well-structured study materials.
Do NOT hallucinate or add information not present in the transcript.
Always structure your output in clean markdown format.`;

        const userMessage = `Analyze this YouTube video transcript and create detailed study notes:

TRANSCRIPT:
${truncatedTranscript}

Please provide:

## 📋 Summary
A concise 2-3 paragraph summary of the entire video.

## 🔑 Key Points
A bullet-point list of the most important concepts and takeaways (at least 8-10 points).

## 📚 Study Notes
Detailed, structured notes organized by topic with subheadings. Include examples, definitions, and explanations.

## 💡 Key Takeaways
3-5 actionable insights or lessons from the video.`;

        const result = await askGroq(systemPrompt, userMessage);

        return NextResponse.json({
            success: true,
            notes: result,
            transcriptLength: transcript.length,
        });
    } catch (error) {
        console.error('YouTube API error:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}

import { YoutubeTranscript } from 'youtube-transcript';

export async function getTranscript(youtubeUrl: string): Promise<string> {
    // Extract video ID from URL
    const videoIdMatch = youtubeUrl.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );

    if (!videoIdMatch || !videoIdMatch[1]) {
        throw new Error('Invalid YouTube URL. Could not extract video ID.');
    }

    const videoId = videoIdMatch[1];

    try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcriptItems || transcriptItems.length === 0) {
            throw new Error('No transcript available for this video.');
        }

        const fullText = transcriptItems.map((item) => item.text).join(' ');
        return fullText;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('Could not get the transcript') || message.includes('disabled')) {
            throw new Error(
                'Transcript is not available for this video. The video may have captions disabled or restricted.'
            );
        }
        throw new Error(`Failed to fetch transcript: ${message}`);
    }
}

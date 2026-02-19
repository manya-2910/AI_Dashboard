/**
 * Splits text into overlapping chunks for RAG retrieval.
 * @param text - The full document text
 * @param chunkSize - Approximate tokens per chunk (1 token ≈ 4 chars)
 * @param overlap - Character overlap between chunks
 */
export function chunkText(
    text: string,
    chunkSize = 1000,
    overlap = 200
): string[] {
    const charLimit = chunkSize * 4; // roughly 4 chars per token
    const chunks: string[] = [];

    // Normalize whitespace
    const normalized = text.replace(/\s+/g, ' ').trim();

    if (normalized.length === 0) return [];

    let start = 0;
    while (start < normalized.length) {
        const end = Math.min(start + charLimit, normalized.length);
        const chunk = normalized.slice(start, end);
        chunks.push(chunk.trim());
        if (end >= normalized.length) break;
        start = end - overlap * 4; // overlap in characters
    }

    return chunks.filter((c) => c.length > 50); // Remove very small chunks
}

/**
 * Find the most relevant chunks for a given query using simple keyword matching.
 * For production, replace with vector embeddings.
 */
export function retrieveRelevantChunks(
    chunks: string[],
    query: string,
    topK = 5
): string[] {
    const queryWords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);

    const scored = chunks.map((chunk) => {
        const lowerChunk = chunk.toLowerCase();
        const score = queryWords.reduce((acc, word) => {
            // Count occurrences of each query word in the chunk
            const matches = (lowerChunk.match(new RegExp(word, 'g')) || []).length;
            return acc + matches;
        }, 0);
        return { chunk, score };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter((s) => s.score > 0)
        .map((s) => s.chunk);
}

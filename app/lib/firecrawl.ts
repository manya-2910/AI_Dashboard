export interface WebSearchResult {
    url: string;
    title: string;
    content: string;
}

export async function webSearch(query: string, limit = 3): Promise<WebSearchResult[]> {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey || apiKey === 'your-firecrawl-api-key-from-firecrawl.dev') {
        console.warn('Firecrawl API key not configured. Skipping web search.');
        return [];
    }

    try {
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query,
                limit,
                scrapeOptions: {
                    formats: ['markdown'],
                },
            }),
        });

        if (!response.ok) {
            console.error('Firecrawl search failed:', response.statusText);
            return [];
        }

        const data = await response.json();

        if (!data.success || !data.data) return [];

        return data.data
            .filter((item: { url?: string; markdown?: string; metadata?: { title?: string } }) => item.url && item.markdown)
            .map((item: { url: string; markdown: string; metadata?: { title?: string } }) => ({
                url: item.url,
                title: item.metadata?.title || item.url,
                content: item.markdown.slice(0, 3000), // Limit content per source
            }));
    } catch (error) {
        console.error('Firecrawl error:', error);
        return [];
    }
}

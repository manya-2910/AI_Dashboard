import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function askGroq(
    systemPrompt: string,
    userMessage: string,
    model = 'llama-3.3-70b-versatile'
): Promise<string> {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        model,
        temperature: 0.3,
        max_tokens: 4096,
    });

    return completion.choices[0]?.message?.content || 'No response generated.';
}

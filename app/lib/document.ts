export async function extractText(
    buffer: Buffer,
    mimetype: string
): Promise<string> {
    if (mimetype === 'text/plain' || mimetype === 'text/txt') {
        return buffer.toString('utf-8');
    }

    if (mimetype === 'application/pdf') {
        try {
            // Dynamic import to avoid Next.js bundling issues
            const pdfParse = (await import('pdf-parse')).default;
            const data = await pdfParse(buffer);
            return data.text;
        } catch (error) {
            console.error('PDF parse error:', error);
            throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
        }
    }

    throw new Error(`Unsupported file type: ${mimetype}. Please upload a PDF or TXT file.`);
}

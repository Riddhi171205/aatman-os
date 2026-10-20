import { GoogleGenAI } from '@google/genai';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const apiKey = process.env.GEMINI_API_KEY;
const isRealApiKey = apiKey && apiKey.length > 0 && apiKey !== 'MY_GEMINI_API_KEY';
const ai = isRealApiKey ? new GoogleGenAI({ apiKey }) : null;
const EMBEDDING_TIMEOUT_MS = 1200;

export class EmbeddingService {
    
    /**
     * Generates vector embeddings for a given text using Ollama (nomic-embed-text)
     * with a fallback to Gemini embeddings.
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        try {
            // Priority 1: Local Ollama Model
            const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
                method: 'POST',
                signal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'nomic-embed-text',
                    prompt: text
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.embedding;
            } else {
                console.warn(`[EmbeddingService] Ollama responded with ${response.status}`);
            }
        } catch (error) {
            console.log('[EmbeddingService] Ollama connection failed, attempting fallback...');
        }

        // Priority 2: Gemini API Fallback
        if (ai) {
             try {
                 const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=' + process.env.GEMINI_API_KEY, {
                     method: 'POST',
                     signal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                         model: 'models/text-embedding-004',
                         content: { parts: [{text}] }
                     })
                 });
                 if (resp.ok) {
                     const data = await resp.json();
                     return data.embedding.values;
                 }
                 console.warn('[EmbeddingService] Gemini embedding failed', await resp.text());
             } catch(e) {
                 console.error("[EmbeddingService] Gemini embedding exception", e);
             }
        }

        // Fallback: Generate mock embedding for development
        console.warn("[EmbeddingService] Returning mock embeddings! Cannot reach Ollama or Gemini.");
        // nomic-embed-text generates 768 dimensions usually
        return new Array(768).fill(0).map(() => Math.random() - 0.5);
    }
}

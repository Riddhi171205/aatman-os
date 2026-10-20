import { dbService } from '../db/pg';
import { qdrantService } from './qdrantService';
import { EmbeddingService } from './embeddingService';
import { RankingService } from './rankingService';

export class MemoryService {
    
    /**
     * Stores a new message as Long-Term Memory.
     * Evaluates importance heuristically (or via LLM), generates embedding,
     * stores in Qdrant, and logs it in PostgreSQL.
     */
    static async storeMemory(userId: string, messageId: string, content: string, importanceScore: number = 5, tags: string[] = []) {
        try {
            console.log(`[MemoryService] Processing memory storage for user: ${userId}`);

            // 1. Generate Vector Embedding
            const vector = await EmbeddingService.generateEmbedding(content);

            // 2. Store in Qdrant Vector Database
            await qdrantService.storeEmbedding(userId, content, vector, importanceScore);

            // 3. Log to PostgreSQL `memory_logs`
            await dbService.addMemoryLog(messageId, importanceScore, tags);

            return true;
        } catch (error) {
            console.error('[MemoryService] Failed to store memory:', error);
            return false;
        }
    }

    /**
     * Evaluates whether a message contains a fact worth remembering.
     * In a production multi-agent system, this could be a small fast LLM call.
     */
    static async evaluateAndStore(userId: string, messageId: string, content: string) {
        // Simple heuristic for "Agent OS" feel
        const isImportant = content.match(/\b(i am|i like|i love|my name is|remember|important|my favorite)\b/i);
        
        if (isImportant) {
            // Assigning arbitrary score and tag for now
            await this.storeMemory(userId, messageId, content, 8, ['user_fact']);
        }
    }

    /**
     * Retrieves Long-Term Memory (LTM) context for a given prompt.
     * Generates embedding for the prompt and searches Qdrant for top matches.
     */
    static async getRelevantPastMemory(userId: string, currentPrompt: string, limit: number = 3): Promise<string> {
        try {
            // 1. Convert current prompt to embedding
            const queryVector = await EmbeddingService.generateEmbedding(currentPrompt);
            
            // 2. Find closest matches in Qdrant (fetch more for ranking)
            const matches = await qdrantService.searchSimilar(userId, queryVector, 10);
            
            // 3. Rank memories
            const rankedMemories = RankingService.rankMemories(matches, limit);

            if (rankedMemories.length > 0) {
                // Return formatted context string
                return rankedMemories.map((m) => `- ${m.payload.content}`).join('\n');
            }
            return '';
        } catch (error) {
            console.error('[MemoryService] Context retrieval failed:', error);
            return '';
        }
    }
}

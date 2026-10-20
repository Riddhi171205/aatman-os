import { dbService } from '../db/pg';
import { ChatService } from './chatService';

export class SummarizationService {
    /**
     * Checks if a session needs summarization (e.g. > 10 messages)
     * and generates a summary if needed.
     */
    static async summarizeSessionIfNeeded(sessionId: string) {
        try {
            const count = await dbService.getMessagesCount(sessionId);
            
            // Summarize every 10 messages
            if (count > 0 && count % 10 === 0) {
                console.log(`[SummarizationService] Triggering summary for session ${sessionId}`);
                await this.generateAndStoreSummary(sessionId);
            }
        } catch (error) {
            console.error('[SummarizationService] Error checking summary condition:', error);
        }
    }

    /**
     * Fetches recent messages, generates a summary, and stores it.
     */
    static async generateAndStoreSummary(sessionId: string) {
        try {
            // Get last 20 messages for context
            const recentMessages = await dbService.getRecentMessages(sessionId, 20);
            
            if (recentMessages.length === 0) return;

            const conversation = recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
            
            const prompt = `Summarize the following conversation in 3-5 concise bullet points. Focus on key facts, decisions, and user preferences. Do not include introductory filler.\n\n--- Conversation ---\n${conversation}`;

            const summaryText = await ChatService.generateCompletion(prompt);
            
            if (summaryText && !summaryText.startsWith("Error") && !summaryText.startsWith("No AI provider")) {
                await dbService.addSummary(sessionId, summaryText);
                console.log(`[SummarizationService] Summary stored for session ${sessionId}`);
            }
        } catch (error) {
            console.error('[SummarizationService] Error generating summary:', error);
        }
    }
}

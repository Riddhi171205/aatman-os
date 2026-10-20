import { GoogleGenAI } from '@google/genai';
import { dbService } from '../db/pg';
import { MemoryService } from './memoryService';
import { ContextBuilder } from './contextBuilder';
import { SummarizationService } from './summarizationService';
import { BrainService, BrainDecision } from './brainService';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const apiKey = process.env.GEMINI_API_KEY;
const isRealApiKey = apiKey && apiKey.length > 0 && apiKey !== 'MY_GEMINI_API_KEY';
const ai = isRealApiKey ? new GoogleGenAI({ apiKey }) : null;
const FAST_REPLY_TIMEOUT_MS = 1800;

export type ChatEngine = 'llm' | 'brain';

interface ChatOptions {
    fastMode?: boolean;
    engine?: ChatEngine;
}

export class ChatService {

    /**
     * Core Chat Flow: Build prompt with STM & LTM, get LLM response, save everything.
     */
    static async handleUserChat(userId: string, sessionId: string, prompt: string, options: ChatOptions = {}) {
        // 1. Save User Message (STM)
        const userMsg = await dbService.addMessage(userId, sessionId, 'user', prompt);

        // Trigger summarization check in the background
        if (!options.fastMode) {
            SummarizationService.summarizeSessionIfNeeded(sessionId).catch(err => console.error("Summarization error:", err));
        }

        // 2. Trigger Async LTM Storage Evaluation
        MemoryService.evaluateAndStore(userId, userMsg.id, prompt).catch(err => console.error("Async LTM error:", err));

        // 3. Retrieve Short-Term Memory (STM)
        const recentMessages = await dbService.getRecentMessages(sessionId, options.fastMode ? 2 : 5);
        let stmContext = recentMessages
            .filter(m => m.id !== userMsg.id) // Exclude the message we just added
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n');
        
        if (!stmContext) stmContext = "No recent conversation.";

        // 4. Retrieve Long-Term Memory (LTM)
        let ltmContext = options.fastMode ? "" : await MemoryService.getRelevantPastMemory(userId, prompt, 3);
        if (!ltmContext) ltmContext = "No relevant past memories found.";

        // 4.5 Retrieve Latest Summary
        const latestSummary = options.fastMode ? null : await dbService.getLatestSummary(sessionId);
        const summaryText = latestSummary ? latestSummary.summary_text : "";

        // 5. Build Unified Context Prompt
        const fullPrompt = ContextBuilder.buildPrompt(stmContext, ltmContext, summaryText, prompt);

        // 6. Generate Response from LLM
        const t0 = Date.now();
        let aiResponseText = "";
        let activeModelUsed = "unknown";
        
        let brainDecision: BrainDecision | null = null;

        // Brain engine: route through the Python AATMAN BRAIN, falling back to the LLM chain if it's offline.
        if (options.engine === 'brain') {
            brainDecision = await BrainService.think(prompt, `${userId}:${sessionId}`);
            if (brainDecision) {
                aiResponseText = brainDecision.response;
                activeModelUsed = 'aatman-brain';
            }
        }

        if (!brainDecision) {
            try {
                const completionResult = await this.generateCompletionWithMetadata(fullPrompt);
                aiResponseText = completionResult.text;
                activeModelUsed = completionResult.model;
            } catch (e: any) {
                aiResponseText = "Error generating response.";
            }
        }
        
        const latencyMs = Date.now() - t0;

        // 7. Save AI Response
        const aiMsg = await dbService.addMessage(userId, sessionId, 'assistant', aiResponseText);

        return {
            response: aiResponseText,
            messageId: aiMsg.id,
            observability: {
                promptContext: {
                    systemPrompt: fullPrompt,
                    retrievedMemory: ltmContext !== "No relevant past memories found." ? [{ text: ltmContext }] : [],
                    userQuery: prompt
                },
                latencyMs,
                activeModel: activeModelUsed,
                engine: brainDecision ? 'brain' : 'llm',
                brainFallback: options.engine === 'brain' && !brainDecision,
                brain: brainDecision ? {
                    intent: brainDecision.intent,
                    plan: brainDecision.plan,
                    simulation: brainDecision.simulation,
                    explanation: brainDecision.explanation,
                    memoryContext: brainDecision.memory_context,
                    knowledgeContext: brainDecision.knowledge_context
                } : undefined
            }
        };
    }

    /**
     * Generates LLM completion and returns the model used.
     */
    public static async generateCompletionWithMetadata(fullPrompt: string): Promise<{ text: string, model: string }> {
        // Priority 1: NVIDIA API (Gemma)
        const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
        if (NVIDIA_API_KEY) {
            try {
                const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                    method: 'POST',
                    signal: AbortSignal.timeout(FAST_REPLY_TIMEOUT_MS),
                    headers: {
                        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "google/gemma-2-2b-it",
                        messages: [{ role: "user", content: fullPrompt }],
                        temperature: 0.2,
                        top_p: 0.7,
                        max_tokens: 220,
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.choices && data.choices.length > 0) {
                        return { text: data.choices[0].message.content, model: 'google/gemma-2-2b-it' };
                    }
                }
            } catch (error) {}
        }

        // Priority 2: Ollama
        try {
            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                signal: AbortSignal.timeout(FAST_REPLY_TIMEOUT_MS),
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3', // Adjust based on local model
                    prompt: fullPrompt,
                    stream: false,
                    options: {
                        num_predict: 180,
                        temperature: 0.2
                    }
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return { text: data.response, model: 'llama3 (local)' };
            }
        } catch (error) {}

        // Priority 3: Gemini API
        if (ai) {
            try {
                const resp = await ai.models.generateContent({
                    model: 'gemini-3.1-pro-preview',
                    contents: fullPrompt,
                });
                return { text: resp.text || "Error", model: 'gemini-3.1-pro-preview' };
            } catch (e: any) {}
        }
        
        return { text: "No AI provider available.", model: 'none' };
    }

    /**
     * Legacy method for backward compatibility
     */
    public static async generateCompletion(fullPrompt: string): Promise<string> {
        const res = await this.generateCompletionWithMetadata(fullPrompt);
        return res.text;
    }
}

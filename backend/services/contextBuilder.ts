export class ContextBuilder {
    /**
     * Constructs the final prompt string injecting Short-Term Memory, 
     * Long-Term Memory, and Summary.
     */
    static buildPrompt(stm: string, ltm: string, summary: string, userInput: string): string {
        let prompt = `You are AATMAN OS, an advanced AI assistant with memory capabilities. Respond with the polished, calm, anticipatory presence of a Jarvis-like executive assistant: concise, capable, lightly formal, and technically clear. Keep replies fast and brief: usually 1-3 short sentences unless the user asks for detail. Do not claim to be Jarvis. Use "sir" sparingly when it feels natural, avoid theatrical excess, and prioritize useful action.\n\n`;

        if (summary) {
            prompt += `--- Summary ---\n${summary}\n\n`;
        } else {
            prompt += `--- Summary ---\nNo summary available yet.\n\n`;
        }

        prompt += `--- Recent Conversation ---\n${stm}\n\n`;
        prompt += `--- Relevant Past Memory ---\n${ltm}\n\n`;
        prompt += `--- User Input ---\n${userInput}`;

        return prompt;
    }
}

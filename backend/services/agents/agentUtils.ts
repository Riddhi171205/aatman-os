export class AgentUtils {
    /**
     * Extracts and parses JSON from raw LLM output, handling markdown blocks
     * and potential prefix/suffix text.
     */
    static parseJsonFromResponse<T>(text: string, fallback: T): T {
        try {
            // Try to parse it directly first
            return JSON.parse(text) as T;
        } catch (e) {
            try {
                // Look for JSON block within markdown
                const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
                if (jsonMatch && jsonMatch[1]) {
                    return JSON.parse(jsonMatch[1].trim()) as T;
                }
                
                // Fallback: look for the first { or [ and parse from there
                const firstBrace = text.indexOf('{');
                const firstBracket = text.indexOf('[');
                
                let startIndex = -1;
                if (firstBrace !== -1 && firstBracket !== -1) {
                    startIndex = Math.min(firstBrace, firstBracket);
                } else if (firstBrace !== -1) {
                    startIndex = firstBrace;
                } else if (firstBracket !== -1) {
                    startIndex = firstBracket;
                }

                if (startIndex !== -1) {
                    const lastBrace = text.lastIndexOf('}');
                    const lastBracket = text.lastIndexOf(']');
                    let endIndex = -1;
                    if (lastBrace !== -1 && lastBracket !== -1) {
                        endIndex = Math.max(lastBrace, lastBracket) + 1;
                    } else if (lastBrace !== -1) {
                        endIndex = lastBrace + 1;
                    } else if (lastBracket !== -1) {
                        endIndex = lastBracket + 1;
                    }

                    if (endIndex > startIndex) {
                        const jsonStr = text.substring(startIndex, endIndex);
                        return JSON.parse(jsonStr) as T;
                    }
                }
                
                console.warn("[AgentUtils] Failed to extract JSON. Returning fallback.");
                return fallback;
            } catch (err) {
                console.warn("[AgentUtils] JSON Parse error. Returning fallback.", err);
                return fallback;
            }
        }
    }
}

import { ChatService } from '../chatService';
import { AgentUtils } from './agentUtils';

export interface ResearchOutput {
    insights: string[];
}

export class ResearchAgentService {
    static async research(taskDescription: string, context: string = ""): Promise<ResearchOutput> {
        let prompt = `You are a research agent. Your job is to gather relevant information, expand on tasks with context, and retrieve useful knowledge.
Output ONLY valid JSON in the exact format shown below, with no markdown, no explanation, and no prefix/suffix.

Format:
{
  "insights": [
    "info1",
    "info2"
  ]
}

Task to Research:
"${taskDescription}"
`;
        
        if (context) {
            prompt += `\nAdditional Context:\n${context}`;
        }

        const responseText = await ChatService.generateCompletion(prompt);
        return AgentUtils.parseJsonFromResponse<ResearchOutput>(responseText, { insights: [] });
    }
}
